import { hashPassword } from "../helpers/authHelpers.js";
import prisma from "../helpers/prisma.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';



export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // validate the inputs
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "password must be at least 6 characters" });
        }

        //Normalize email to lowercase before checking
        const normalizedEmail = email.toLowerCase();

        //Check if email exist in the data base
        const existingUser = await prisma.user.findUnique({
            where: {
                email: normalizedEmail
            },
        });

        if (existingUser) {
            // Consider if this user is an OAuth user. If so, you might want to prompt them
            // to log in with Google/Facebook instead of showing "Email already exist".
            if (existingUser.provider !== 'LOCAL') {
                return res.status(400).json({
                    error: `This email is already registered using ${existingUser.provider}. Please log in with ${existingUser.provider}.`
                });
            }
            return res.status(400).json({ error: "Email already exist" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create user in the database
        const user = await prisma.user.create({
            data: {
                name,
                email: normalizedEmail,
                password: hashedPassword, // This is for LOCAL provider
                provider: 'LOCAL',       // Enum value from your schema
                role: 'USER',          // Enum value from your schema
                // All other optional fields like phone, passwordResetToken, fcmToken, etc.,
                // will correctly default to null if not provided here, which is what we want.
            }
        });

        // Return the created user excluding the password
        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.toString(), // Convert enum to string for JSON response if needed
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });

    } catch (error) {
        console.error("Error in registerUser:", error); // Good to have specific logging
        if (error.code === 'P2002') {
            // This P2002 could be for any unique field, not just email.
            // The 'target' in error.meta can specify which field.
            // e.g., if (error.meta && error.meta.target && error.meta.target.includes('email'))
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

        // Crucial check: Only allow LOCAL provider users to log in with a password
        if (user.provider !== 'LOCAL') {
            return res.status(403).json({
                error: `This account was registered using ${user.provider}. Please log in with ${user.provider}.`
            });
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
        const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7days
        });

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
                emailVerifiedAt: new Date(), // Optional: store verification time
                emailVerificationToken: null, // Invalidate the token
                emailVerificationExpires: null
            }
        });

        // Optional: Log the user in automatically here by generating JWTs
        // Or redirect to a success page that instructs them to log in.
        // For API:
        // return res.status(200).json({ message: "Email verified successfully. You can now log in." });
        // For web redirect:
        return res.redirect('https://yourfrontend.com/login?message=email_verified_success');


    } catch (error) {
        console.error("Error in email verification:", error);
        // return res.redirect('https://yourfrontend.com/verification-failed?reason=server_error');
        return res.status(500).json({ error: "Internal server error during email verification." });
    }
};