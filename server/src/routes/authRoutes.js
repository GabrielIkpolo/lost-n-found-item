import express from 'express';
import {
    registerUser,
    loginUser, verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logoutUser,
    refreshAccessToken
} from '../controllers/authController.js';
import passport from '../helpers/passport.js';
import { requireSignin } from '../helpers/authMiddleware.js';
import { authLimiter, moderateLimiter } from '../middleware/rateLimiter.js';
import dotenv from 'dotenv';
import { generateAccessToken } from '../helpers/authHelpers.js';

const router = express.Router();
dotenv.config();

// Determine the correct client URL based on the environment
const clientUrl = process.env.NODE_ENV === 'production'
    ? process.env.VITE_REACT_APP_API_CLIENT_URL
    : 'http://localhost:5173'; // Force localhost for local dev


router.use((req, res, next) => {
    req.app.locals.clientUrl = clientUrl;
    console.log(`Using client URL: ${clientUrl}`); 
    next();
});


router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);

// Google and facebook Strategy routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', {
    failureRedirect: `${clientUrl}/login`,
    session: false
}),
    (req, res) => {

        // On successful Google login, Passport places the user on req.user
        const user = req.user;

        if (!user) {
            // This case shouldn't typically be reached with session: false and a failureRedirect,
            // but as a safeguard:
            console.error("Google callback successful but req.user is missing!");
            return res.redirect(`${clientUrl}/login?error=auth_failed`);
        }

        // Generate JWT for the authenticated user
        const accessToken = generateAccessToken(user.id, user.role);

        // Redirect to a frontend callback route with the token and user data
        // Pass minimal user data as query params (or stringify)
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.toString() // Convert enum to string
        };

        const encodedUserData = encodeURIComponent(JSON.stringify(userData));

        console.log(`Google login successful, redirecting to frontend callback with token for user ${user.id}`);

        // Redirect to frontend callback route with token and user data in query params
        // res.redirect(`${clientUrl}/auth/callback?token=${accessToken}&user=${encodedUserData}`);
        res.redirect(`${clientUrl}/#token=${accessToken}&user=${encodedUserData}`);
    })


router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));
router.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: `${process.env.VITE_REACT_APP_API_CLIENT_URL}/login`,
    session: false
}), (req, res) => {

    // On successful Facebook login, Passport places the user on req.user
    const user = req.user;

    if (!user) {
        console.error("Facebook callback successful but req.user is missing!");
        return res.redirect(`${process.env.VITE_REACT_APP_API_CLIENT_URL}/login?error=auth_failed`);
    }

    // Generate JWT for the authenticated user
    const accessToken = generateAccessToken(user.id, user.role);

    // Redirect to a frontend callback route with the token and user data
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toString() // Convert enum to string
    };
    const encodedUserData = encodeURIComponent(JSON.stringify(userData));

    console.log(`Facebook login successful, redirecting to frontend callback with token for user ${user.id}`);

    // Redirect to frontend callback route with token and user data in query params
    // res.redirect(`${process.env.VITE_REACT_APP_API_CLIENT_URL}/auth/callback?token=${accessToken}&user=${encodedUserData}`);
    // res.redirect(`${process.env.VITE_REACT_APP_API_BASE_URL}`); 
    res.redirect(`${clientUrl}/#token=${accessToken}&user=${encodedUserData}`);
});


router.get('/verify-email', moderateLimiter, verifyEmail);


router.post('/resend-verification', moderateLimiter, resendVerificationEmail);

// Password Reset Routes
router.post('/forgot-password', authLimiter, forgotPassword);
// router.post('/reset-password/:token', authLimiter, resetPassword);

router.post('/reset-password/:token', authLimiter, (req, res, next) => {
    // Ensure client URL is properly set for production
    req.app.locals.clientUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VITE_REACT_APP_API_CLIENT_URL 
      : 'http://localhost:5173';
    next();
  }, resetPassword);

  
router.post('/logout', logoutUser);

//Google Login: http://localhost:3000/api/auth/google  // No deed for registering
//Facebook Login: http://localhost:3000/api/auth/facebook

// Forgot password: http://localhost:3000/api/auth/forgot-password

// http://localhost:3000/api/auth/reset-password/4472665565a6a04a465f9c83e935fbeb195ab01b91cfc88e52ce85d47aceef8d



// New Route to Refresh Access Token using Refresh Token from cookie
// Endpoint: POST /api/auth/refresh-token
// Does NOT need requireSignin middleware, it validates the cookie token itself
// router.post('/refresh-token', refreshAccessToken);


export default router;
