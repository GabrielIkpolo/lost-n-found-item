import { hashPassword } from "../helpers/authHelpers.js";
import prisma from "../helpers/prisma.js";
import { generateVerificationToken } from "../helpers/authHelpers.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto'
import { UserRole, AuditAction, Prisma } from '@prisma/client'; // Import UserRole and Prisma Client for error handling




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
        if (user.provider !== 'LOCAL' && !user.emailVerified) {
            // Optional: You could offer to resend varification here too
            return res.status(403).json({
                error: "Please verify your email address before logging in."
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


//========== Below are to be expunged ================

// // --- Controller function to save FCM token ---
// export const saveFcmToken = async (req, res) => {
//     // requireSignin middleware ensures req.user is populated
//     if (!req.user) {
//         return res.status(401).json({ error: "Authentication required." });
//     }

//     const { fcmToken } = req.body;
//     const userId = req.user.id; // User ID from the authenticated user

//     // Basic validation
//     if (!fcmToken || typeof fcmToken !== 'string') {
//         // If token is null/undefined or not a string, treat it as a request to remove the token
//         // This is useful for users who disable notifications or log out
//         if (fcmToken === null || fcmToken === undefined) {
//              console.log(`Received null/undefined FCM token for user ${userId}. Clearing token.`);
//              try {
//                  await prisma.user.update({
//                      where: { id: userId },
//                      data: {
//                          fcmToken: null,
//                          lastFcmUpdate: new Date() // Still update the timestamp
//                      }
//                  });
//                  return res.status(200).json({ message: "FCM token cleared successfully." });
//              } catch (error) {
//                  console.error(`Error clearing FCM token for user ${userId}:`, error);
//                  return res.status(500).json({ error: "Internal server error while clearing FCM token." });
//              }
//         }
//         // If token is provided but not a string
//         return res.status(400).json({ error: "Invalid FCM token format." });
//     }

//     try {
//         // Save or update the FCM token for the user
//         const updatedUser = await prisma.user.update({
//             where: { id: userId },
//             data: {
//                 fcmToken: fcmToken,
//                 lastFcmUpdate: new Date(), // Record the time the token was updated
//             },
//             select: {
//                 id: true,
//                 fcmToken: true,
//                 lastFcmUpdate: true,
//             }
//         });

//         console.log(`FCM token saved/updated for user ${userId}. Token: ${fcmToken.substring(0, 10)}...`); // Log first few chars for privacy

//         return res.status(200).json({
//             message: "FCM token saved successfully.",
//             user: {
//                  id: updatedUser.id,
//                  fcmToken: updatedUser.fcmToken,
//                  lastFcmUpdate: updatedUser.lastFcmUpdate,
//             }
//         });

//     } catch (error) {
//         console.error(`Error saving FCM token for user ${userId}:`, error);
//          if (error.code === 'P2025') { // User not found (shouldn't happen with requireSignin)
//              return res.status(404).json({ error: "Authenticated user not found." });
//          }
//         return res.status(500).json({ error: "Internal server error while saving FCM token." });
//     }
// };


// // --- Admin: Get All Users ---
// // Requires isAdmin or isSuperAdmin middleware
// export const getAllUsers = async (req, res) => {
//     // Middleware ensures user is authenticated and has admin role
//     try {
//         // Fetch all users
//         const users = await prisma.user.findMany({
//             // Select fields - be mindful of privacy, even for admins
//             select: {
//                 id: true,
//                 name: true,
//                 email: true,
//                 phone: true,
//                 provider: true,
//                 role: true,
//                 emailVerified: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 // Exclude sensitive data like passwords, providerIds (maybe), fcmTokens here.
//                 // You might include more in getItemDetails if needed there.
//             },
//             orderBy: {
//                 createdAt: 'asc' // Or 'email' or 'role'
//             }
//         });

//         return res.status(200).json(users);

//     } catch (error) {
//         console.error("Error fetching all users:", error);
//         return res.status(500).json({ error: "Internal server error while fetching users." });
//     }
// };

// // --- Admin: Get User Details ---
// // Requires isAdmin or isSuperAdmin middleware
// export const getUserDetails = async (req, res) => {
//     // Middleware ensures user is authenticated and has admin role
//     try {
//         const { id } = req.params; // User ID from URL parameter

//         // Validate ID format (optional but good practice)
//          // if (!ObjectId.isValid(id)) { // Requires ObjectId from 'mongodb'
//          //     return res.status(400).json({ error: "Invalid User ID format." });
//          // }

//         const user = await prisma.user.findUnique({
//             where: { id: id },
//              // Select fields - include more details for the individual view
//              select: {
//                  id: true,
//                  name: true,
//                  email: true,
//                  phone: true,
//                  provider: true,
//                  providerId: true, // Admins might need this
//                  role: true,
//                  emailVerified: true,
//                  emailVerificationToken: false, // Don't expose tokens
//                  emailVerificationExpires: false,
//                  passwordResetToken: false, // Don't expose tokens
//                  passwordResetExpires: false,
//                  fcmToken: true, // Might be useful for admin to see
//                  lastFcmUpdate: true,
//                  emailNotificationsEnabled: true,
//                  inAppNotificationsEnabled: true,
//                  pushNotificationsEnabled: true,
//                  createdAt: true,
//                  updatedAt: true,
//                  // Optionally include count of reported/claimed items, or the items themselves
//                  // _count: {
//                  //     select: { items: true, claimedItems: true, notifications: true, auditLogs: true }
//                  // }
//              }
//         });

//         if (!user) {
//             return res.status(404).json({ error: "User not found." });
//         }

//         return res.status(200).json(user);

//     } catch (error) {
//         console.error("Error fetching user details:", error);
//         if (error instanceof Prisma.PrismaClientKnownRequestError) {
//              if (error.code === 'P2025') {
//                  return res.status(404).json({ error: "User not found." });
//              }
//               // Example: Invalid ID format caught by Prisma
//              if (error.code === 'P2000') {
//                   return res.status(400).json({ error: "Invalid User ID format." });
//              }
//         }
//         return res.status(500).json({ error: "Internal server error while fetching user details." });
//     }
// };


// // --- Super Admin: Update User Role ---
// // Requires isSuperAdmin middleware
// export const updateUserRole = async (req, res) => {
//      // Middleware ensures user is authenticated and is a Super Admin
//     try {
//         const { id } = req.params; // User ID to update
//         const { role } = req.body; // New role

//         // Validate incoming role value against the UserRole enum
//         const validRoles = Object.values(UserRole);
//         if (!role || !validRoles.includes(role)) {
//             return res.status(400).json({ error: `Invalid role: ${role}. Must be one of ${validRoles.join(', ')}` });
//         }

//         // IMPORTANT SECURITY CHECK: Prevent Super Admin from downgrading or deleting the *last* Super Admin
//         // or from changing their *own* role in this specific endpoint.
//         // This requires more complex logic, potentially checking user count per role or requiring a different flow.
//         // For simplicity NOW, let's prevent changing the *current* Super Admin's role via this route.
//         // A production system needs more robust checks.
//          if (req.user.id === id && req.user.role === UserRole.SUPER_ADMIN) {
//               return res.status(403).json({ error: "Forbidden: Super Admin cannot change their own role via this endpoint." });
//          }
//          // Add check to prevent Super Admin from changing another Super Admin's role if needed.
//          // Fetch the target user's current role first:
//          const targetUser = await prisma.user.findUnique({ where: { id: id }, select: { id: true, role: true } });

//          if (!targetUser) {
//              return res.status(404).json({ error: "Target user not found." });
//          }

//          // Prevent Super Admin from changing *another* Super Admin's role (basic protection)
//          if (targetUser.role === UserRole.SUPER_ADMIN && req.user.id !== id) {
//               return res.status(403).json({ error: "Forbidden: Super Admin cannot change another Super Admin's role." });
//          }
//          // Prevent Super Admin from promoting to SUPER_ADMIN role (only Super Admins can manage Super Admins)
//          // This check is implicitly handled by the isSuperAdmin middleware on the route,
//          // but adding explicit logic here makes it clearer that Super Admins *can* assign ADMIN/USER roles.
//          // However, the current logic is for *updating* roles. A separate `promoteToAdmin` might be clearer.
//          // Given the `isSuperAdmin` middleware, `req.user.role` will be SUPER_ADMIN here.
//          // The check below means SUPER_ADMIN can assign ADMIN or USER roles.
//          if (role === UserRole.SUPER_ADMIN && req.user.role !== UserRole.SUPER_ADMIN) {
//              // This check is redundant due to middleware but included for logical clarity
//              return res.status(403).json({ error: "Forbidden: Only Super Admins can assign the Super Admin role." });
//          }
//           // Further checks: Prevent assigning a role *higher* than the current user's role (already implicitly handled by middleware structure, but good to think about).
//           // A Super Admin *can* assign ADMIN or USER roles.


//         // Update the user's role
//         const updatedUser = await prisma.user.update({
//             where: { id: id },
//             data: { role: role },
//              select: { id: true, name: true, email: true, role: true, updatedAt: true } // Select fields for response
//         });

//         // Create Audit Log
//         await prisma.auditLog.create({
//              data: {
//                  userId: req.user.id, // The Super Admin performing the action
//                  // itemId: null, // Action is on a user, not an item
//                  action: 'MANAGE_USER_ROLE',
//                  details: `Changed role of user "${updatedUser.name}" (${updatedUser.id}) from ${targetUser.role} to ${updatedUser.role}.`,
//                  ipAddress: req.ip,
//                  userAgent: req.headers['user-agent'],
//              }
//         });

//         return res.status(200).json({
//             message: `User role updated successfully to ${updatedUser.role}`,
//             user: updatedUser
//         });

//     } catch (error) {
//         console.error("Error updating user role:", error);
//          if (error instanceof Prisma.PrismaClientKnownRequestError) {
//              if (error.code === 'P2025') {
//                  return res.status(404).json({ error: "User not found." });
//              }
//               // Example: Invalid ID format caught by Prisma
//              if (error.code === 'P2000') {
//                   return res.status(400).json({ error: "Invalid User ID format." });
//              }
//          }
//         return res.status(500).json({ error: "Internal server error while updating user role." });
//     }
// };


// // --- Admin: Delete User ---
// // Requires isAdmin or isSuperAdmin middleware
// // NOTE: Deleting a user might require cascading deletes or handling orphaned records (items, notifications, audit logs).
// // Prisma's cascading delete rules in schema.prisma are important here.
// // A "soft delete" (e.g., adding an `isActive: Boolean` field) is often safer.
// export const deleteUser = async (req, res) => {
//      // Middleware ensures user is authenticated and has admin role
//     try {
//         const { id } = req.params; // User ID to delete

//         // IMPORTANT SECURITY CHECK: Prevent Super Admin from deleting themselves.
//         // Also prevent ADMIN from deleting another ADMIN or SUPER_ADMIN.
//          const targetUser = await prisma.user.findUnique({ where: { id: id }, select: { id: true, role: true } });

//          if (!targetUser) {
//              return res.status(404).json({ error: "User not found." });
//          }

//          // Prevent user from deleting themselves
//          if (req.user.id === id) {
//              return res.status(403).json({ error: "Forbidden: You cannot delete your own account via this endpoint." });
//          }

//          // Prevent ADMIN from deleting ADMIN or SUPER_ADMIN
//          if (req.user.role === UserRole.ADMIN && (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN)) {
//              return res.status(403).json({ error: "Forbidden: Admins cannot delete other Admins or Super Admins." });
//          }

//           // Super Admins can delete Admins and Users (but not themselves, handled above)


//         // Perform the delete operation
//         // NOTE: Ensure your schema.prisma has correct `onDelete` cascade rules
//         // for related models like Item, Notification, AuditLog, etc.
//         const deletedUser = await prisma.user.delete({
//             where: { id: id },
//              // Select fields for audit log before deletion
//              select: { id: true, name: true, email: true, role: true }
//         });

//         // Create Audit Log for deletion
//         await prisma.auditLog.create({
//              data: {
//                  userId: req.user.id, // The admin performing the action
//                  // itemId: null, // Action is on a user
//                  action: AuditAction.DELETE_USER, // Assuming you add this to AuditAction enum
//                  details: `Deleted user "${deletedUser.name}" (${deletedUser.id}) with role ${deletedUser.role}.`,
//                  ipAddress: req.ip,
//                  userAgent: req.headers['user-agent'],
//              }
//         });

//         return res.status(200).json({ message: "User deleted successfully", user: { id: deletedUser.id } });

//     } catch (error) {
//         console.error("Error deleting user:", error);
//          if (error instanceof Prisma.PrismaClientKnownRequestError) {
//              if (error.code === 'P2025') {
//                  return res.status(404).json({ error: "User not found." });
//              }
//              // P2003: Foreign key constraint failed (if cascade rules are missing/incorrect)
//              if (error.code === 'P2003') {
//                   console.error("Prisma P2003 Error: Foreign key constraint failed during user deletion. Check schema.prisma `onDelete` rules.");
//                   return res.status(409).json({ error: "Cannot delete user due to related data. Check database cascade rules or implement soft delete." });
//              }
//              // Example: Invalid ID format caught by Prisma
//              if (error.code === 'P2000') {
//                   return res.status(400).json({ error: "Invalid User ID format." });
//              }
//          }
//         return res.status(500).json({ error: "Internal server error while deleting user." });
//     }
// };
