import express from 'express';
import { registerUser, loginUser }  from '../controllers/authController.js';
import passport from '../helpers/passport.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Google and facebook Strategy routes
router.get('/google', passport.authenticate('google', {scope: ['profile', 'email']} ));
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login'}), (req, res)=>{
    res.redirect('/'); // Redirect to homepage after successful login
})


router.get('/facebook', passport.authenticate('facebook', {scope: ['email']}));
router.get('/facebook/callback', passport.authenticate('facebook', {failureRedirect: '/login'}), (req, res)=>{
    res.redirect('/'); //Redirects to home page after successful login
} );


//Google Login: http://localhost:3000/api/auth/google
//Facebook Login: http://localhost:3000/api/auth/facebook


export default router;