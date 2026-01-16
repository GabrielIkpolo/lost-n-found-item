import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // loads environment variables

//==== Google configuration ==================
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true, // Gmail uses port 465 with SSL
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.OAUTH_CLIENT_ID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
});


// Configure the transporter using environment variables from mailgun
// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST, // e.g., 'smtp.sendgrid.net'
//     port: parseInt(process.env.EMAIL_PORT, 10), // e.g., 587 or 465
//     secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports like 587
//     auth: {
//         user: process.env.EMAIL_USER, 
//         pass: process.env.EMAIL_PASS, 
//     },
// });


//========Resend provider configuration==================

// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST, 
//     port: parseInt(process.env.EMAIL_PORT, 10), // Resend Port: 465
//     // Set secure: true if port is 465 (SSL), false if port is 587 or 2587 (TLS)
//     secure: process.env.EMAIL_PORT === '465' || process.env.EMAIL_PORT === '2465', 
//     auth: {
//         user: process.env.EMAIL_USER, 
//         pass: process.env.EMAIL_PASS, 
//     },
// });



// New generic email sending function
/**
 * Sends a general email.
 *
 * @param {string} toEmail - The recipient email address.
 * @param {string} subject - The subject of the email.
 * @param {string} text - The plain text body of the email.
 * @param {string} [html] - The HTML body of the email (optional).
 */
export const sendEmail = async (toEmail, subject, text, html) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Lost and Found Item'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@yourdomain.com'}>`,
        to: toEmail,
        subject: subject,
        text: text,
        html: html || text, // Use HTML body if provided, otherwise use text
    };

    try {
        console.log(`Attempting to send email to ${toEmail} with subject "${subject}"...`);
        let info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        // Optional: Log preview URL if using a testing service like Ethereal
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Depending on requirements, you might want to throw the error or return null/false
        throw error; // Re-throwing the error for the caller to handle
    }
};

// Verification email using the generic sendEmail function
export const sendVerificationEmail = async (toEmail, token) => {
    const verificationLink = `${process.env.VITE_REACT_APP_API_BASE_URL}/api/auth/verify-email?token=${token}`;
    const subject = 'Verify Your Email Address';
    const text = `Hello,\n\nPlease verify your email address by clicking this link: ${verificationLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`;
    const html = `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">Verify Email Address</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

    return sendEmail(toEmail, subject, text, html);
};


export const sendPasswordResetEmail = async (toEmail, token, resetUrl) => {
    // Prefer the resetUrl passed in; fallback to env if not provided
    const clientUrlFromEnv = process.env.CLIENT_URL || process.env.VITE_REACT_APP_API_CLIENT_URL || process.env.VITE_APP_CLIENT_URL;
    const clientUrl = resetUrl ? undefined : (process.env.NODE_ENV === 'production' ? clientUrlFromEnv : 'http://localhost:5173');

    // If resetUrl was passed, use it; otherwise build from clientUrl + token
    const fullResetUrl = resetUrl || `${clientUrl}/reset-password/${token}`;

    const subject = 'Password Reset Request';
    const text = `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n${fullResetUrl}\n\nThis link is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`;
    const html = `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${fullResetUrl}">${fullResetUrl}</a></p><p>This link is valid for 15 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

    return sendEmail(toEmail, subject, text, html);
};


/**
 * Sends handover instructions to both the reporter and the claimant.
 */
export const sendHandoverEmail = async (reporter, claimant, item) => {
    const safeLocation = "Campus Security Post (Main Gate)"; // Default safe spot

    // 1. Email to the Reporter (Finder)
    const reporterSubject = `Action Required: Someone claimed "${item.title}"`;
    const reporterHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Good news, ${reporter.name}!</h2>
            <p>The item you reported found (<strong>${item.title}</strong>) has been claimed by <strong>${claimant.name}</strong>.</p>
            <hr />
            <h3>Claimant Contact Details:</h3>
            <p><strong>Email:</strong> ${claimant.email}</p>
            <p><strong>Phone:</strong> ${claimant.phone || 'Not provided'}</p>
            <hr />
            <p>Please contact them to arrange a handover.</p>
            <p style="background-color: #e7f3fe; padding: 10px; border-left: 5px solid #2196F3;">
                <strong>Safety Tip:</strong> We recommend meeting at the <strong>${safeLocation}</strong> or another public, well-lit area on campus for the exchange.
            </p>
            <p>Once returned, please log in and mark the item as <strong>RETURNED</strong>.</p>
        </div>
    `;

    // 2. Email to the Claimant (Owner)
    const claimantSubject = `Claim Successful: "${item.title}"`;
    const claimantHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Hello ${claimant.name},</h2>
            <p>You have successfully claimed <strong>${item.title}</strong>.</p>
            <hr />
            <h3>Finder Contact Details:</h3>
            <p><strong>Name:</strong> ${reporter.name}</p>
            <p><strong>Email:</strong> ${reporter.email}</p>
            <p><strong>Phone:</strong> ${reporter.phone || 'Not provided'}</p>
            <hr />
            <p>Please contact the finder to retrieve your item.</p>
            <p style="background-color: #e7f3fe; padding: 10px; border-left: 5px solid #2196F3;">
                <strong>Safety Tip:</strong> We recommend meeting at the <strong>${safeLocation}</strong>.
            </p>
        </div>
    `;

    // Send both emails in parallel
    try {
        await Promise.all([
            sendEmail(reporter.email, reporterSubject, "Please view HTML version", reporterHtml),
            sendEmail(claimant.email, claimantSubject, "Please view HTML version", claimantHtml)
        ]);
        console.log(`Handover emails sent for item ${item.id}`);
    } catch (error) {
        console.error("Error sending handover emails:", error);
        // Don't throw, just log. We don't want to roll back the claim transaction just because email failed.
    }
};