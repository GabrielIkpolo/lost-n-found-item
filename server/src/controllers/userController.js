import prisma from "../helpers/prisma.js";
import { UserRole, AuditAction, Prisma, ItemStatus } from '@prisma/client';
import { sendNotification } from '../services/notificationService.js'; // Assuming sendNotification is needed here
// Import getImageUrl helper from itemController or move it to a shared helper file
import { getImageUrl } from '../helpers/imageHelper.js'; //
// import path from 'path';
// import fs from 'fs'; 

// Function to generate public URL for images (copied from itemController)
// const getImageUrl = (filePath) => {
//     if (!filePath) return null;
//     const fileName = path.basename(filePath);
//     return `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/images/${fileName}`;
// };


// --- Standard User: Get My Items ---
// Requires requireSignin middleware on the route
export const getMyItems = async (req, res) => {
    if (!req.user) {
         return res.status(401).json({ error: "Authentication required." });
    }

    const userId = req.user.id;

    try {
        // Extract query parameters for pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Fetch items where the current user is either the reporter OR the claimant
        const myItems = await prisma.item.findMany({
            where: {
                OR: [
                    { reportedById: userId }, // Items reported by this user
                    { claimedById: userId }   // Items claimed by this user
                ]
            },
             include: {
                 reportedBy: { select: { id: true, name: true } },
                 claimedBy: { select: { id: true, name: true } }
             },
            orderBy: {
                createdAt: 'desc'
            },
            skip: skip,
            take: limit,
        });

        // Count total items
         const totalItems = await prisma.item.count({
            where: {
                OR: [
                    { reportedById: userId },
                    { claimedById: userId }
                ]
            }
         });
         const totalPages = Math.ceil(totalItems / limit);

        // Format items to include public image URLs
         const itemsWithPublicUrls = myItems.map(item => ({
             ...item,
             imageUrlFront: getImageUrl(item.imageUrlFront),
             imageUrlBack: getImageUrl(item.imageUrlBack),
         }));


        return res.status(200).json({
            items: itemsWithPublicUrls,
             pagination: {
                 totalItems: totalItems,
                 totalPages: totalPages,
                 currentPage: page,
                 itemsPerPage: limit,
             },
        });

    } catch (error) {
        console.error(`Error fetching items for user ${userId}:`, error);
        return res.status(500).json({ error: "Internal server error while fetching user's items." });
    }
};


// --- Standard User: Save FCM Token ---
// Requires requireSignin middleware on the route
export const saveFcmToken = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const { fcmToken } = req.body;
    const userId = req.user.id;

    if (!fcmToken || typeof fcmToken !== 'string') {
        if (fcmToken === null || fcmToken === undefined) {
             console.log(`Received null/undefined FCM token for user ${userId}. Clearing token.`);
             try {
                 await prisma.user.update({
                     where: { id: userId },
                     data: { fcmToken: null, lastFcmUpdate: new Date() }
                 });
                 return res.status(200).json({ message: "FCM token cleared successfully." });
             } catch (error) {
                 console.error(`Error clearing FCM token for user ${userId}:`, error);
                 return res.status(500).json({ error: "Internal server error while clearing FCM token." });
             }
        }
        return res.status(400).json({ error: "Invalid FCM token format." });
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { fcmToken: fcmToken, lastFcmUpdate: new Date() },
            select: { id: true, fcmToken: true, lastFcmUpdate: true }
        });

        console.log(`FCM token saved/updated for user ${userId}. Token: ${updatedUser.fcmToken ? updatedUser.fcmToken.substring(0, 10) + '...' : 'null'}`);

        return res.status(200).json({
            message: "FCM token saved successfully.",
            user: {
                 id: updatedUser.id,
                 fcmToken: updatedUser.fcmToken,
                 lastFcmUpdate: updatedUser.lastFcmUpdate,
            }
        });

    } catch (error) {
        console.error(`Error saving FCM token for user ${userId}:`, error);
         if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
             return res.status(404).json({ error: "Authenticated user not found." });
         }
        return res.status(500).json({ error: "Internal server error while saving FCM token." });
    }
};


// --- Admin: Get All Users ---
// Requires isAdmin or isSuperAdmin middleware on the route
export const getAllUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                provider: true,
                role: true,
                emailVerified: true,
                createdAt: true,
                updatedAt: true,
                // Consider privacy even for admins: exclude sensitive tokens/passwords
            },
            orderBy: { createdAt: 'asc' }
        });

        return res.status(200).json(users);

    } catch (error) {
        console.error("Error fetching all users:", error);
        return res.status(500).json({ error: "Internal server error while fetching users." });
    }
};

// --- Admin: Get User Details ---
// Requires isAdmin or isSuperAdmin middleware on the route
export const getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: id },
             select: {
                 id: true,
                 name: true,
                 email: true,
                 phone: true,
                 provider: true,
                 providerId: true,
                 role: true,
                 emailVerified: true,
                 fcmToken: true, // Can show token for admin
                 lastFcmUpdate: true,
                 emailNotificationsEnabled: true,
                 inAppNotificationsEnabled: true,
                 pushNotificationsEnabled: true,
                 createdAt: true,
                 updatedAt: true,
                 // Exclude sensitive tokens
                 emailVerificationToken: false,
                 emailVerificationExpires: false,
                 passwordResetToken: false,
                 passwordResetExpires: false,
             }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.status(200).json(user);

    } catch (error) {
        console.error("Error fetching user details:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2000')) {
             return res.status(400).json({ error: "Invalid User ID format or user not found." }); // Combine errors for simplicity
        }
        return res.status(500).json({ error: "Internal server error while fetching user details." });
    }
};

// --- Super Admin: Update User Role ---
// Requires isSuperAdmin middleware on the route
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = Object.values(UserRole);
        if (!role || !validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role: ${role}. Must be one of ${validRoles.join(', ')}` });
        }

        // --- Security Checks ---
         if (req.user.id === id) {
              return res.status(403).json({ error: "Forbidden: You cannot change your own role via this endpoint." });
         }

         const targetUser = await prisma.user.findUnique({ where: { id: id }, select: { id: true, role: true } });

         if (!targetUser) {
             return res.status(404).json({ error: "Target user not found." });
         }

         if (targetUser.role === UserRole.SUPER_ADMIN) {
              return res.status(403).json({ error: "Forbidden: You cannot change another Super Admin's role." });
         }

         if (role === UserRole.SUPER_ADMIN) {
              return res.status(403).json({ error: "Forbidden: You cannot assign the Super Admin role via this endpoint." });
         }
         // --- End Security Checks ---


        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: { role: role },
            select: { id: true, name: true, email: true, role: true, updatedAt: true }
        });

        await prisma.auditLog.create({
             data: {
                 userId: req.user.id,
                 action: AuditAction.MANAGE_USER_ROLE,
                 details: `Changed role of user "${updatedUser.name}" (${updatedUser.id}) from ${targetUser.role} to ${updatedUser.role}.`,
                 ipAddress: req.ip,
                 userAgent: req.headers['user-agent'],
             }
        });

        return res.status(200).json({
            message: `User role updated successfully to ${updatedUser.role}`,
            user: updatedUser
        });

    } catch (error) {
        console.error("Error updating user role:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === 'P2025' || error.code === 'P2000')) {
             return res.status(400).json({ error: "Invalid User ID format or user not found." });
        }
        return res.status(500).json({ error: "Internal server error while updating user role." });
    }
};


// --- Admin: Delete User ---
// Requires isAdmin or isSuperAdmin middleware on the route
// NOTE: Deleting a user might require cascading deletes or handling orphaned records (items, notifications, audit logs).
// Prisma's cascading delete rules in schema.prisma are important here.
// A "soft delete" (e.g., adding an `isActive: Boolean` field) is often safer.
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // User ID to delete

        // --- Security Checks ---
         const targetUser = await prisma.user.findUnique({ where: { id: id }, select: { id: true, role: true } });

         if (!targetUser) {
             return res.status(404).json({ error: "User not found." });
         }

         // Prevent user from deleting themselves
         if (req.user.id === id) {
             return res.status(403).json({ error: "Forbidden: You cannot delete your own account via this endpoint." });
         }

         // Prevent ADMIN from deleting ADMIN or SUPER_ADMIN
         if (req.user.role === UserRole.ADMIN && (targetUser.role === UserRole.ADMIN || targetUser.role === UserRole.SUPER_ADMIN)) {
             return res.status(403).json({ error: "Forbidden: Admins cannot delete other Admins or Super Admins." });
         }
         // --- End Security Checks ---


        // Perform the delete operation
        // NOTE: Ensure your schema.prisma has correct `onDelete` cascade rules
        // for related models like Item, Notification, AuditLog, etc.
        const deletedUser = await prisma.user.delete({
            where: { id: id },
             // Select fields for audit log before deletion
             select: { id: true, name: true, email: true, role: true }
        });

        // Create Audit Log for deletion
        await prisma.auditLog.create({
             data: {
                 userId: req.user.id,
                 action: AuditAction.DELETE_USER, // Using the enum value
                 details: `Deleted user "${deletedUser.name}" (${deletedUser.id}) with role ${deletedUser.role}.`,
                 ipAddress: req.ip,
                 userAgent: req.headers['user-agent'],
             }
        });

        return res.status(200).json({ message: "User deleted successfully", user: { id: deletedUser.id } });

    } catch (error) {
        console.error("Error deleting user:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
             if (error.code === 'P2025') {
                 return res.status(404).json({ error: "User not found." });
             }
             // P2003: Foreign key constraint failed (if cascade rules are missing/incorrect)
             if (error.code === 'P2003') {
                  console.error("Prisma P2003 Error: Foreign key constraint failed during user deletion. Check schema.prisma `onDelete` rules.");
                  return res.status(409).json({ error: "Cannot delete user due to related data. Check database cascade rules or implement soft delete." });
             }
             if (error.code === 'P2000') {
                  return res.status(400).json({ error: "Invalid User ID format." });
             }
         }
        return res.status(500).json({ error: "Internal server error while deleting user." });
    }
};