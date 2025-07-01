import express from 'express';
import {
    getMyItems,
    saveFcmToken,
    getAllUsers,
    getUserDetails,
    updateUserRole,
    deleteUser,
    updateNotificationPreferences,
    getUserNotifications,
    markNotificationAsRead
} from '../controllers/userController.js';
import { requireSignin, isAdmin, isSuperAdmin } from '../helpers/authMiddleware.js'; // Import middleware

const router = express.Router();

// --- Standard User Routes (under /api/users) ---
// Endpoint for a logged-in user to get their items
// GET /api/users/my-items 
router.get(
    '/my-items',
    requireSignin, // Must be logged in
    getMyItems     // Controller function
);

// Endpoint to save FCM Token for a logged-in user
// POST /api/users/fcm-token
router.post(
    '/fcm-token',
    requireSignin, // Must be logged in
    saveFcmToken   // Controller function
);


// New Endpoint to update user notification preferences
// PUT /api/users/preferences
router.put(
    '/preferences',
    requireSignin, 
    updateNotificationPreferences
);


// New Endpoint to get user's in-app notifications
// GET /api/users/notifications
router.get(
    '/notifications',
    requireSignin, // Must be logged in to view notifications
    getUserNotifications
);

// New Endpoint to mark a specific notification as read
// PUT /api/users/notifications/:id/read
router.put(
    '/notifications/:id/read',
    requireSignin, // Must be logged in
    markNotificationAsRead
);



// --- Admin User Management Routes (under /api/users) ---
// These routes require at least isAdmin privileges

// GET /api/users - Get all users (Admin/Super Admin only)
router.route('/')
    .get(requireSignin, isAdmin, getAllUsers);


// PUT /api/users/:id/role - Update user role (Super Admin only)
router.put(
    '/:id/role',
    requireSignin,
    isSuperAdmin, // Only Super Admins can change roles
    updateUserRole // Handle updating user role
);


// GET /api/users/:id - Get user details (Admin/Super Admin only)
// DELETE /api/users/:id - Delete user (Admin/Super Admin only)
router.route('/:id')
    .get(requireSignin, isAdmin, getUserDetails)
    .delete(requireSignin, isAdmin, deleteUser); // Note: isAdmin middleware is sufficient here, controller has further checks



export default router;