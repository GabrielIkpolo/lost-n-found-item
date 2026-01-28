import express from 'express';
import {
    getSystemSettings, updateSystemSettings, getAuditLogs,
    getReports, dismissReport
} from '../controllers/adminController.js';
import { requireSignin, isSuperAdmin, isAdmin } from '../helpers/authMiddleware.js';

const router = express.Router();

// Get Settings (Admins can view, but strictly Super Admin for now based on your UI)
router.get('/settings', requireSignin, isSuperAdmin, getSystemSettings);

// Update Settings (Super Admin only)
router.put('/settings', requireSignin, isSuperAdmin, updateSystemSettings);

// audit log routes
router.get('/logs', requireSignin, isSuperAdmin, getAuditLogs);

// --- Report Management ---
router.get('/reports', requireSignin, isAdmin, getReports); 
router.delete('/reports/:id', requireSignin, isAdmin, dismissReport); 

export default router;