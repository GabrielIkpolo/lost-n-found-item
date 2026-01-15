import express from 'express';
import { getSystemSettings, updateSystemSettings } from '../controllers/adminController.js';
import { requireSignin, isSuperAdmin } from '../helpers/authMiddleware.js';

const router = express.Router();

// Get Settings (Admins can view, but strictly Super Admin for now based on your UI)
router.get('/settings', requireSignin, isSuperAdmin, getSystemSettings);

// Update Settings (Super Admin only)
router.put('/settings', requireSignin, isSuperAdmin, updateSystemSettings);

export default router;