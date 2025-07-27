import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config(); // loads environment variables

// Configure the transporter using environment variables
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, // e.g., 'smtp.sendgrid.net'
    port: parseInt(process.env.EMAIL_PORT, 10), // e.g., 587 or 465
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports like 587
    auth: {
        user: process.env.EMAIL_USER, // Your SMTP username from the email service
        pass: process.env.EMAIL_PASS, // Your SMTP password or API key from the email service
    },
});

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

// Password reset email using the generic sendEmail function
// export const sendPasswordResetEmail = async (toEmail, token, resetUrl) => {
//     const subject = 'Password Reset Request';
//     const text = `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`;
//     const html = `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 15 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

//     return sendEmail(toEmail, subject, text, html);
// };


export const sendPasswordResetEmail = async (toEmail, token, resetUrl) => {
    // Ensure the reset URL uses the correct client URL
    const clientUrl = process.env.NODE_ENV === 'production'
        ? process.env.VITE_REACT_APP_API_CLIENT_URL
        : 'http://localhost:5173';
    
    const fullResetUrl = `${clientUrl}/reset-password/${token}`;
    
    const subject = 'Password Reset Request';
    const text = `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n${fullResetUrl}\n\nThis link is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`;
    const html = `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${fullResetUrl}">${fullResetUrl}</a></p><p>This link is valid for 15 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`;

    return sendEmail(toEmail, subject, text, html);
};
