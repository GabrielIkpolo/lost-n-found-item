import express from 'express';
import {
    registerUser,
    loginUser, verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logoutUser,
} from '../controllers/authController.js';
import passport from '../helpers/passport.js';
import { authLimiter, moderateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();


router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Google and facebook Strategy routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/'); // Redirect to homepage after successful login
})


router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), (req, res) => {
    res.redirect('/'); //Redirects to home page after successful login
});


router.get('/verify-email', moderateLimiter, verifyEmail); // We can also use POST here


router.post('/resend-verification', moderateLimiter, resendVerificationEmail);

// Password Reset Routes
router.post('/forgot-password',  authLimiter, forgotPassword); // Placeholder for forgot password controller
router.post('/reset-password/:token', authLimiter, resetPassword); // Placeholder for reset password controller

router.post('/logout', logoutUser);

//Google Login: http://localhost:3000/api/auth/google  // No deed for registering
//Facebook Login: http://localhost:3000/api/auth/facebook

// Forgot password: http://localhost:3000/api/auth/forgot-password

// http://localhost:3000/api/auth/reset-password/4472665565a6a04a465f9c83e935fbeb195ab01b91cfc88e52ce85d47aceef8d


export default router;
