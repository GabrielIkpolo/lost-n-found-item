import express from 'express';
import {
    getMyItems,      
    saveFcmToken,
    getAllUsers,
    getUserDetails,
    updateUserRole,
    deleteUser
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


// --- Admin User Management Routes (under /api/users) ---
// These routes require at least isAdmin privileges

// GET /api/users - Get all users (Admin/Super Admin only)
router.route('/')
    .get(requireSignin, isAdmin, getAllUsers);

// GET /api/users/:id - Get user details (Admin/Super Admin only)
// DELETE /api/users/:id - Delete user (Admin/Super Admin only)
router.route('/:id')
    .get(requireSignin, isAdmin, getUserDetails)
    .delete(requireSignin, isAdmin, deleteUser); // Note: isAdmin middleware is sufficient here, controller has further checks


// PUT /api/users/:id/role - Update user role (Super Admin only)
router.put(
    '/:id/role',
    requireSignin,
    isSuperAdmin, // Only Super Admins can change roles
    updateUserRole // Handle updating user role
);


export default router;