import { hashPassword, comparePassword } from "../helpers/authHelpers.js";
import prisma from "../helpers/prisma.js";
import { generateVerificationToken } from "../helpers/authHelpers.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { UserRole, AuditAction, Prisma } from "@prisma/client";


export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate inputs
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters" });
        }

        // Normalize email to lowercase
        const normalizedEmail = email.toLowerCase();

        // Check if email exists in the database
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        // Handle existing user cases
        if (existingUser) {

            if (existingUser.provider !== 'LOCAL') {
                return res.status(400).json({
                    error: `This email is already registered using ${existingUser.provider}. Please log in with ${existingUser.provider}.`
                });
            }

            if (existingUser.emailVerified) {
                return res.status(400).json({ error: "Email already registered and verified" });
            }
            return res.status(400).json({ error: "Email already registered. Please check your email for verification." });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);
        const verificationToken = generateVerificationToken();
        const verificationTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

        // Create user in the database
        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword,
                provider: 'LOCAL',
                role: 'USER',
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationTokenExpires,
                emailVerified: false,
            },
        });

        try {
            await sendVerificationEmail(user.email, verificationToken);
            return res.status(201).json({
                message: "Registration successful! Please check your email to verify your account",
            });
        } catch (emailError) {
            console.error("Failed to send verification email:", emailError);
            // Option 2: Keep user but inform them to request verification later
            return res.status(201).json({
                message: "Registration successful, but we couldn't send the verification email. Please try verifying later or contact support",
                userId: user.id,
            });
        }

    } catch (error) {
        console.error("Error in registerUser:", error);
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            return res.status(409).json({ error: "Email already exists" });
        }
        return res.status(500).json({ error: "Internal server error" });
    }
};




export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required!" });
        }

        const normalizedEmail = email.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(404).json({ error: "Invalid email or password" }); // Generic message for security
        }

        // Crucial check:
        // If this login endpoint is ONLY for local users, add this check:
        if (user.provider !== 'LOCAL') {
            return res.status(400).json({ error: `This email is registered via ${user.provider}. Please use ${user.provider} login.` });
        }

        //Check if user is email verified (Optional for login, but good practice if required)
        // If you need email verification for local logins, uncomment this:
        if (!user.emailVerified) {
            return res.status(403).json({ error: "Please verify your email address before logging in." });
        }

        // If user.password is null (e.g. OAuth user somehow got here), bcrypt.compare will fail.
        // This check also ensures user.password is not null, which it shouldn't be for LOCAL users.
        if (!user.password) {
            console.error(`Login attempt for LOCAL user ${user.email} with no password set.`);
            return res.status(401).json({ error: "Invalid email or password" }); // Or a more specific server error
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        //Generate JWT tokens
        const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
        // const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

        // res.cookie('refreshToken', refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === 'production',
        //     sameSite: 'strict',
        //     maxAge: 7 * 24 * 60 * 60 * 1000 // 7days
        // });

        res.status(200).json({
            accessToken,
            user: { // Send some user details back, excluding sensitive info
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.toString() // Convert enum to string
            }
        });

    } catch (error) {
        console.error("Error in loginUser:", error); // Good
        return res.status(500).json({ error: "Internal server error" });
    }
};



// --- loginUser function (Modified for Refresh Token Storage) ---
// COMMENTING OUT THE NEW LOGIN USER FUNCTION
/*
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required!" });
        }

        const normalizedEmail = email.toLowerCase();

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
        });

        if (!user) {
            return res.status(404).json({ error: "Invalid email or password" });
        }

        if (user.provider !== 'LOCAL' && !user.emailVerified) {
            return res.status(403).json({
                error: "Please verify your email address before logging in."
            });
        }

        if (!user.password) {
            console.error(`Login attempt for LOCAL user ${user.email} with no password set.`);
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        // Only proceed with setting refresh token if it's a LOCAL login
        if (user.provider === 'LOCAL') {
             // Generate JWT tokens
             const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
             // Generate Refresh Token (don't include sensitive info)
             const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

             // Calculate refresh token expiry date (need to parse expiration string like '7d' or rely on a numeric env var in ms)
             // Let's add a new ENV var for refresh token expiration in milliseconds for consistency
             const refreshTokenExpirationMs = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS || (7 * 24 * 60 * 60 * 1000), 10); // Default 7 days
             const refreshTokenExpires = new Date(Date.now() + refreshTokenExpirationMs);

             // Hash the refresh token before storing it in the database
             const saltRounds = parseInt(process.env.SALT_ROUNDS || 12, 10); // Use salt rounds from env or default
             const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRounds);

             // Save the hashed refresh token and its expiry in the database
             await prisma.user.update({
                 where: { id: user.id },
                 data: {
                     refreshToken: hashedRefreshToken,
                     refreshTokenExpires: refreshTokenExpires,
                 },
             });

             // Set the refresh token in an HttpOnly cookie
             res.cookie('refreshToken', refreshToken, {
                 httpOnly: true,
                 secure: process.env.NODE_ENV === 'production',
                 sameSite: 'Strict', // Use 'Strict' or 'Lax' based on needs, 'Strict' is more secure
                 expires: refreshTokenExpires, // Cookie expiry matches token expiry
             });

             // Respond with access token and user info
             res.status(200).json({
                 accessToken,
                 user: {
                     id: user.id,
                     name: user.name,
                     email: user.email,
                     role: user.role.toString()
                 }
             });
        } else {
            // Handle OAuth logins - they might rely on session or a different token flow
            // For now, just log them in and issue a JWT access token
             console.log(`OAuth user ${user.email} logged in.`);
              const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });
             res.status(200).json({
                 accessToken,
                 user: {
                     id: user.id,
                     name: user.name,
                     email: user.email,
                     role: user.role.toString()
                 }
             });
        }


    } catch (error) {
        console.error("Error in loginUser:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
*/

// --- Controller function to refresh access token ---
// COMMENTING OUT THE REFRESH TOKEN FUNCTION
/*
export const refreshAccessToken = async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    // 1. Check if refresh token exists in cookie
    if (!refreshTokenFromCookie) {
        console.warn("Refresh token missing in cookie.");
        return res.status(401).json({ error: "Access Denied. Refresh token not found." });
    }

    try {
        // 2. Verify the refresh token from the cookie
        // Using jwt.verify ensures the token hasn't been tampered with and is signed by our secret
        const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 3. Find the user in the database and retrieve stored refresh token info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                refreshToken: true, // Get the HASHED refresh token from DB
                refreshTokenExpires: true, // Get its expiry
                emailVerified: true,
            }
        });

        // 4. Validate user, stored token, expiry, and match cookie token against stored hash

        // Check if user exists
        if (!user) {
            console.warn(`User with ID ${userId || 'unknown'} not found for token refresh.`);
            // Clear the cookie in the browser to prevent further attempts with this invalid token
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. User not found." });
        }

        // Check if the user has a stored refresh token and if it's expired
        const storedRefreshTokenExists = user.refreshToken;
        const storedRefreshTokenNotExpired = user.refreshTokenExpires && new Date() <= user.refreshTokenExpires;

        // Now, compare the cookie token with the stored hash ONLY if the stored token exists and is not expired
        let isMatch = false;
        if (storedRefreshTokenExists && storedRefreshTokenNotExpired) {
             try {
                 isMatch = await bcrypt.compare(refreshTokenFromCookie, user.refreshToken);
             } catch (bcryptError) {
                 console.error("Bcrypt compare error during refresh:", bcryptError);
                 // This might happen if the stored hash is corrupted, treat as mismatch
                 isMatch = false;
             }
        }


        if (!storedRefreshTokenExists || !storedRefreshTokenNotExpired || !isMatch) {

            console.warn(`Invalid, expired, or mismatched refresh token used for user ${userId}.`);

            // Security Measure: Invalidate the stored token in the database if the user was found but token was invalid/expired/mismatched
            if (user.refreshToken) { // Only try to clear if a token was actually stored
                await prisma.user.update({
                    where: { id: user.id },
                    data: { refreshToken: null, refreshTokenExpires: null }
                }).catch(clearError => console.error("Failed to clear invalid refresh token from DB:", clearError)); // Log update error but don't stop the response
            }

            // Clear the cookie in the browser to prevent further attempts with this invalid token
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. Invalid or expired refresh token." });
        }


        // Optional: Check if the user account is active/verified if necessary for token refresh
        // if (!user.emailVerified) {
        //      res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
        //     return res.status(403).json({ error: "Email not verified. Cannot refresh token." });
        // }

        // 5. Generate a new access token and a new refresh token
        const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });

        // Generate new refresh token (don't include sensitive info like role, just necessary id)
        const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

        // Calculate new refresh token expiry
        const refreshTokenExpirationMs = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS || (7 * 24 * 60 * 60 * 1000), 10);
        const newRefreshTokenExpires = new Date(Date.now() + refreshTokenExpirationMs);

        // 6. Implement Refresh Token Rotation: Invalidate the old token by saving the *new* token hash and expiry
        const saltRounds = parseInt(process.env.SALT_ROUNDS || 12, 10);
        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, saltRounds);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedNewRefreshToken,
                refreshTokenExpires: newRefreshTokenExpires,
            },
        });

        // 7. Set the new refresh token in an HttpOnly cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            expires: newRefreshTokenExpires, // Use expires for date
        });

        // 8. Send the new access token back
        res.status(200).json({
            accessToken: newAccessToken,
            user: { // Include minimal user info
               id: user.id,
               name: user.name,
               email: user.email,
               role: user.role.toString()
            }
        });

    } catch (error) {
       // Handle errors during JWT verification or database operations
       console.error("Error during refresh token process:", error);

       // Specific handling for JWT errors (invalid signature, expired, etc.)
       if (error instanceof jwt.JsonWebTokenError) {
            // Log the specific JWT error
            console.error("JWT Error during refresh:", error.message);
            // Clear the cookie in case of invalid JWT format/signature/etc.
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. Invalid refresh token format." }); // Use 403 for token validation issues
       }

       // Handle other errors (database errors, etc.)
       return res.status(500).json({ error: "Internal server error during token refresh." });
    }
};
*/


export const verifyEmail = async (req, res) => {
    const { token } = req.query; // Assuming token is in query param: /verify-email?token=XYZ

    if (!token) {
        return res.status(400).json({ error: "Verification token is missing." });
    }

    try {
        const user = await prisma.user.findFirst({ // findFirst because token *should* be unique if index setup correctly
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: { gt: new Date() } // Check if token is not expired
            }
        });

        if (!user) {
            // Potentially redirect to a frontend page:
            // return res.redirect('https://yourfrontend.com/verification-failed?reason=invalid_or_expired');
            return res.status(400).json({ error: "Invalid or expired verification token." });
        }

        if (user.emailVerified) {
            // Potentially redirect to a frontend page:
            // return res.redirect('https://yourfrontend.com/login?message=already_verified');
            return res.status(400).json({ error: "Email already verified." });
        }

        // Mark email as verified and clear token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                //emailVerifiedAt: new Date(), // Optional: store verification time
                emailVerificationToken: null, // Invalidate the token
                emailVerificationExpires: null
            }
        });

        // Optional: Log the user in automatically here by generating JWTs
        // Or redirect to a success page that instructs them to log in.
        // For API:
        return res.status(200).json({ message: "Email verified successfully. You can now log in." });
        // For web redirect:
        // return res.redirect('https://yourfrontend.com/login?message=email_verified_success');


    } catch (error) {
        console.error("Error in email verification:", error);
        // return res.redirect('https://yourfrontend.com/verification-failed?reason=server_error');
        return res.status(500).json({ error: "Internal server error during email verification." });
    }
};


export const resendVerificationEmail = async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || user.emailVerified) {
        return res.status(400).json({ error: "Invalide request" });
    }

    const newToken = generateVerificationToken();

    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerificationToken: newToken,
            emailVerificationExpires: new Date(Date.now() + 1 * 60 * 60 * 1000), //1hr
        },
    });

    await sendVerificationEmail(user.email, newToken);

    return res.json({ message: "Verification email resent" });

};

//Forgot Password Request: The user  provides their email address 
// to the server. The server finds the user, generates a unique, 
// time-limited token, stores a hashed version of that token in 
// the database along with an expiry time, and sends an email to
// the user containing a link with the unhashed token.

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: "Email is required." });
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Even if user not found, send a generic success message to prevent email enumeration
        if (!user) {
            return res.status(200).json({ message: "If a user with that email exists, a password reset link has been sent." });
        }

        // Generate reset token and expiration
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // Hash the token before saving to the database
        const hashedResetToken = await bcrypt.hash(resetToken, 10);


        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedResetToken,
                passwordResetExpires: passwordResetExpires,
            },
        });




        // Send reset email (implement sendPasswordResetEmail in emailService.js)
        const resetUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/auth/reset-password/${resetToken}`; // Frontend URL
        try {
            await sendPasswordResetEmail(user.email, resetToken, resetUrl);
            return res.status(200).json({ message: "If a user with that email exists, a password reset link has been sent." });
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            // Decide how to handle email sending failure - log, alert, etc.
            return res.status(500).json({ error: "Error sending password reset email." });
        }


    } catch (error) { // <--- Outer catch block for *any* errors in the outer try
        console.error("Error in forgotPassword:", error); // <-- Note: The log message here is 'Error in forgotPassword', not 'Error in registerUser' as in some other functions.
        // This catch would handle errors from findUnique or prisma.user.update
        return res.status(500).json({ error: "Internal server error during forgot password request." }); // You might want a different message than generic 500
    }
};



//Password Reset: The user receives the email, clicks the link (in our case, we'll extract the token from the link),
//and provides a new password along with the token. The server finds users with non-expired reset 
//tokens and compares the provided token with the hashed token in the database. 
//If they match and the token is valid, the server updates the user's password and 
//clears the reset token fields.

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ error: "Token and new password are required." });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    try {
        // Find user by comparing the provided token with the hashed token in the database
        const users = await prisma.user.findMany({
            where: {
                passwordResetExpires: { gt: new Date() } // Check if token is not expired
            }
        });

        let user = null;
        for (const u of users) {
            if (u.passwordResetToken && await bcrypt.compare(token, u.passwordResetToken)) {
                user = u;
                break;
            }
        }


        if (!user) {
            return res.status(400).json({ error: "Invalid or expired password reset token." });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(password);

        // Update user's password and clear reset token fields
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null, // Invalidate the token
                passwordResetExpires: null,
            },
        });

        return res.status(200).json({ message: "Password has been reset successfully." });

    } catch (error) {
        console.error("Error in resetPassword:", error);
        return res.status(500).json({ error: "Internal server error during password reset." });
    }
};


export const logoutUser = async (req, res) => {
    try {
        // clear the refresh token cookie
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Match the options used when setting the cookie
            sameSite: 'strict', //Match the option used when setting the cookie
        });

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        console.error("Error during logout", error);
        return res.status(500).json({ error: "Internal server error during logout" });
    }

}



// --- Controller function to refresh access token ---
export const refreshAccessToken = async (req, res) => {
    const refreshTokenFromCookie = req.cookies.refreshToken;

    // 1. Check if refresh token exists in cookie
    if (!refreshTokenFromCookie) {
        console.warn("Refresh token missing in cookie.");
        return res.status(401).json({ error: "Access Denied. Refresh token not found." });
    }

    try {
        // 2. Verify the refresh token from the cookie
        // Using jwt.verify ensures the token hasn't been tampered with and is signed by our secret
        const decoded = jwt.verify(refreshTokenFromCookie, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // 3. Find the user in the database and retrieve stored refresh token info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                refreshToken: true, // Get the HASHED refresh token from DB
                refreshTokenExpires: true, // Get its expiry
                emailVerified: true,
            }
        });

        // 4. Validate user, stored token, expiry, and match cookie token against stored hash

        // -- NEW LOGIC START --
        // Check if user exists
        if (!user) {
            console.warn(`User with ID ${userId || 'unknown'} not found for token refresh.`);
            // Clear the cookie in the browser to prevent further attempts with this invalid token
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. User not found." });
        }

        // Check if the user has a stored refresh token and if it's expired
        const storedRefreshTokenExists = user.refreshToken;
        const storedRefreshTokenNotExpired = user.refreshTokenExpires && new Date() <= user.refreshTokenExpires;

        // Now, compare the cookie token with the stored hash ONLY if the stored token exists and is not expired
        let isMatch = false;
        if (storedRefreshTokenExists && storedRefreshTokenNotExpired) {
            try {
                // THIS IS THE LINE REPORTED IN THE ERROR: server/src/controllers/authController.js:489:48
                // This line should ONLY be reached if storedRefreshTokenExists is true (meaning user.refreshToken is not null/undefined)
                isMatch = await bcrypt.compare(refreshTokenFromCookie, user.refreshToken);
            } catch (bcryptError) {
                console.error("Bcrypt compare error during refresh:", bcryptError);
                // This might happen if the stored hash is corrupted, treat as mismatch
                isMatch = false;
            }
        }


        if (!storedRefreshTokenExists || !storedRefreshTokenNotExpired || !isMatch) {

            console.warn(`Invalid, expired, or mismatched refresh token used for user ${userId}.`);

            // Security Measure: Invalidate the stored token in the database if the user was found but token was invalid/expired/mismatched
            if (user.refreshToken) { // Only try to clear if a token was actually stored (redundant check due to above logic, but safe)
                await prisma.user.update({
                    where: { id: user.id },
                    data: { refreshToken: null, refreshTokenExpires: null }
                }).catch(clearError => console.error("Failed to clear invalid refresh token from DB:", clearError)); // Log update error but don't stop the response
            }

            // Clear the cookie in the browser to prevent further attempts with this invalid token
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. Invalid or expired refresh token." });
        }
        // -- NEW LOGIC END --


        // Optional: Check if the user account is active/verified if necessary for token refresh
        // if (!user.emailVerified) {
        //      res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
        //     return res.status(403).json({ error: "Email not verified. Cannot refresh token." });
        // }

        // 5. Generate a new access token and a new refresh token
        const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION });

        // Generate new refresh token (don't include sensitive info like role, just necessary id)
        const newRefreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

        // Calculate new refresh token expiry
        const refreshTokenExpirationMs = parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRATION_MS || (7 * 24 * 60 * 60 * 1000), 10);
        const newRefreshTokenExpires = new Date(Date.now() + refreshTokenExpirationMs);

        // 6. Implement Refresh Token Rotation: Invalidate the old token by saving the *new* token hash and expiry
        const saltRounds = parseInt(process.env.SALT_ROUNDS || 12, 10);
        const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, saltRounds);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken: hashedNewRefreshToken,
                refreshTokenExpires: newRefreshTokenExpires,
            },
        });

        // 7. Set the new refresh token in an HttpOnly cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            expires: newRefreshTokenExpires, // Use expires for date
        });

        // 8. Send the new access token back
        res.status(200).json({
            accessToken: newAccessToken,
            user: { // Include minimal user info
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.toString()
            }
        });

    } catch (error) {
        // Handle errors during JWT verification or database operations
        console.error("Error during refresh token process:", error);

        // Specific handling for JWT errors (invalid signature, expired, etc.)
        if (error instanceof jwt.JsonWebTokenError) {
            // Log the specific JWT error
            console.error("JWT Error during refresh:", error.message);
            // Clear the cookie in case of invalid JWT format/signature/etc.
            res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ error: "Access Denied. Invalid refresh token format." }); // Use 403 for token validation issues
        }

        // Handle other errors (database errors, etc.)
        return res.status(500).json({ error: "Internal server error during token refresh." });
    }
};


