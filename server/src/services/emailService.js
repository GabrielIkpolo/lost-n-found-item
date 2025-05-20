import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config() // loads environment variable

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

export const sendVerificationEmail = async (toEmail, token) => {
    // For development, you might use a base URL from an env variable
    const verificationLink = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Lost and Found Item'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@yourdomain.com'}`,
        to: toEmail,
        subject: 'Verify Your Email Address',
        text: `Hello,\n\nPlease verify your email address by clicking this link: ${verificationLink}\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`,
        html: `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationLink}">Verify Email Address</a></p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`,
    };

    try {

        console.log(`Attempting to send verification email to ${toEmail}...`);
        let info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);
        // Preview URL (if using ethereal.email for testing, for example)
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info;

    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error; // Re-throw to be handled by the caller
    }
};



// To use Ethereal (for testing only, in your emailService.js setup)
// if (process.env.NODE_ENV !== 'production') {
//     nodemailer.createTestAccount((err, account) => {
//         if (err) {
//             console.error('Failed to create a testing account. ' + err.message);
//             return process.exit(1);
//         }
//         console.log('Credentials obtained, populating config...');
//         transporter = nodemailer.createTransport({
//             host: account.smtp.host,
//             port: account.smtp.port,
//             secure: account.smtp.secure,
//             auth: {
//                 user: account.user,
//                 pass: account.pass
//             }
//         });
//     });
// } else {
//     // Production transporter setup
// }


const resetTokenEmailTemplate = (token, resetUrl) => `
<p>Click the link below to reset your password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Token: ${token}</p>
<p>This token is valid for 15 minutes.</p>
`;

export const sendPasswordResetEmail = async (toEmail, token, resetUrl) => {
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Lost and Found Item'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@yourdomain.com'}`,
        to: toEmail,
        subject: 'Password Reset Request',
        text: `Hello,\n\nYou requested a password reset. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link is valid for 15 minutes.\n\nIf you did not request this, please ignore this email.\n\nThanks,\nThe Your App Team`,
        html: `<p>Hello,</p><p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link is valid for 15 minutes.</p><p>If you did not request this, please ignore this email.</p><p>Thanks,<br/>LAFI Team</p>`,
    };

    try {
        console.log(`Attempting to send password reset email to ${toEmail}...`);
        let info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error; // Re-throw to be handled by the caller
    }
};
