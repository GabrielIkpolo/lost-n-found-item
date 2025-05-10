import passport from "passport";
import GoogleStrategy from 'passport-google-oauth20';
import FacebookStrategy from 'passport-facebook';
import prisma from "./prisma.js";
import { hashPassword } from "./authHelpers.js";

passport.serializeUser((user, done) => {
    console.log("SerializeUser called with user:", user); // Add log
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    console.log("DeserializeUser called with id:", id); // Add log
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            console.error("DeserializeUser: User not found with id:", id); // Add log
            return done(new Error('User not found'), null);
        }
        console.log("DeserializeUser: Found user:", user); // Add log
        done(null, user);
    } catch (error) {
        console.error("DeserializeUser Error:", error); // Add log
        done(error, null);
    }
});

// Name the Google Strategy
passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    console.log("Google Strategy - accessToken:", accessToken);
    console.log("Google Strategy - refreshToken:", refreshToken); // refreshToken might be undefined if not requested or already issued
    console.log("Google Strategy - profile:", JSON.stringify(profile, null, 2)); // Log the full profile

    try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) {
            console.error("Google Strategy Error: No email found in profile.");
            return done(new Error("No email found in Google profile."), null);
        }
        console.log("Google Strategy - Extracted email:", email);

        // Check if user already exists by Google providerId
        let user = await prisma.user.findFirst({
            where: {
                provider: 'GOOGLE',
                providerId: profile.id
            }
        });
        console.log("Google Strategy - Existing user by provider_providerId:", user);


        if (!user) {
            // Check by email only if not found by providerId
            console.log("Google Strategy - No user by providerId. Checking by email:", email);
            let existingUserWithEmail = await prisma.user.findUnique({
                where: { email: email }
            });
            console.log("Google Strategy - Existing user with this email:", existingUserWithEmail);

            if (existingUserWithEmail) {
                // Or inform user they already have an account with this email
                console.error(`Google Strategy Error: User with email ${email} already exists with provider ${existingUserWithEmail.provider}. Cannot automatically create new Google user.`);
                // Redirect them to login and inform them, or provide a way to link accounts.
                return done(new Error(`Account with email ${email} already exists. Please log in with your original method.`), null);
            }

            // If no user with this providerId and no user with this email, create new user
            console.log("Google Strategy - Creating new user for profile.id:", profile.id, "and email:", email);
            user = await prisma.user.create({
                data: {
                    name: profile.displayName,
                    email: email,
                    provider: 'GOOGLE',
                    providerId: profile.id,
                    role: 'USER',
                    password: null, // Explicitly null for OAuth
                    phone: null,    // Explicitly null if not provided
                    passwordResetToken: null, // Explicitly null
                    passwordResetExpires: null, // Explicitly null
                    fcmToken: null, // Explicitly null for other optional fields
                    lastFcmUpdate: null // Explicitly null
                    // password field will be null for OAuth users
                }
            });
            console.log("Google Strategy - New user created:", user);
        }

        return done(null, user); // Pass the user object to Passport
    } catch (error) {
        console.error("Google Strategy - Catch Block Error:", error);
        return done(error, null); // Pass the error to Passport
    }
}));



//Facebook startegy
passport.use('facebook', new FacebookStrategy({ // Name the strategy 'facebook'
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/api/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'] // Ensure 'emails' is requested
}, async (accessToken, refreshToken, profile, done) => {
    console.log("Facebook Strategy - profile:", JSON.stringify(profile, null, 2)); // Log profile

    try {
        // Facebook might return emails differently or it might be missing if user denies permission
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
            // Decide how to handle users without an email from Facebook
            // Option 1: Deny login/registration
            console.error("Facebook Strategy Error: No email found in Facebook profile. User might have denied permission or has no primary email.");
            return done(new Error("An email is required from Facebook to register/login. Please ensure your Facebook account has a primary email and you grant permission."), null);
            
        }
        console.log("Facebook Strategy - Extracted email:", email);

        // Check if user already exists by Facebook providerId
        let user = await prisma.user.findFirst({
            where: {
                provider: 'FACEBOOK',
                providerId: profile.id
            }
        });
        console.log("Facebook Strategy - Existing user by provider+providerId:", user);

        if (!user) {
            // User not found by FACEBOOK providerId, check if an account with this email already exists
            console.log("Facebook Strategy - No user by provider+providerId. Checking by email:", email);
            let existingUserWithEmail = await prisma.user.findUnique({
                where: { email: email } // Assumes email from Facebook is reliable
            });
            console.log("Facebook Strategy - Existing user with this email:", existingUserWithEmail);

            if (existingUserWithEmail) {
                // User with this email already exists.
                console.error(`Facebook Strategy Error: User with email ${email} already exists with provider ${existingUserWithEmail.provider}.`);
                return done(new Error(`An account with email ${email} already exists using ${existingUserWithEmail.provider}. Please log in with that method.`), null);
            }

            // If no user by providerId and no user with this email, create new user
            console.log("Facebook Strategy - Creating new FACEBOOK user for profile.id:", profile.id, "and email:", email);
            user = await prisma.user.create({
                data: {
                    name: profile.displayName,
                    email: email, // Email from Facebook
                    provider: 'FACEBOOK',
                    providerId: profile.id, // Facebook User ID
                    role: 'USER',
                    password: null,
                    phone: null,
                    passwordResetToken: null,
                    passwordResetExpires: null,
                    fcmToken: null,
                    lastFcmUpdate: null
                }
            });
            console.log("Facebook Strategy - New user created:", user);
        }

        return done(null, user); // Pass the user object to Passport
    } catch (error) {
        console.error("Facebook Strategy - Catch Block Error:", error);
        return done(error, null); // Pass the error to Passport
    }
}));
export default passport;

