import jwt from 'jsonwebtoken';
import prisma from './prisma.js';
import dotenv from 'dotenv';

dotenv.config();

// Middleware to require authentication (returns 401 if no token or invalid)
const requireSignin = async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: "Unauthorized: No token provided or invalid format" });
        }

        const token = authHeader.split(' ')[1] // Extract token from "Bearer TOKEN"

        console.log("The extracted token", token);


        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.error("JWT verification failed", err.message);
                return res.status(401).json({ error: "Unauthorized: Invalid token or expired token" });
            }

            // Fetch user data based on the decoded userId from the token
            //Only select necessary fields for performance, including role
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true, // May be usefull to check verification status
                },
            });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            // Attach the user object (with role) to the request for further processing
            req.user = user;
            next(); // Proceed to the next middleware or route handler
        });
    } catch (error) {
        console.error("Error in requireSignin middleware: ", error);
        return res.status(500).json({ error: "Internal Server Error during authentication" });
    }
}


// Middleware to attempt authentication but not require it (req.user will be null if no token)
const optionalSignin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null; // No token provided, proceed with req.user = null
            return next();
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.warn("Optional JWT verification failed (token invalid or expired):", err.message);
                req.user = null; // Token invalid, proceed with req.user = null
                return next();
            }

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    emailVerified: true,
                },
            });

            if (!user) {
                 console.warn(`Optional signin: User with ID ${decoded.userId} not found from token.`);
                req.user = null; // User not found, proceed with req.user = null
                return next();
            }

            req.user = user; // User found and token valid
            next();
        });
    } catch (error) {
        console.error("Error in optionalSignin middleware: ", error);
         // Even on unexpected errors, proceed gracefully with req.user = null
        req.user = null;
        next();
    }
};



// Middleware to check if authenticated user is an Admin or Super Admin
const isAdmin = (req, res, next) => {

    // We assume requireSignin has already populated  req.user

    if (!req.user) {
        // This should theoretically not happen if requireSignin is used before this
        return res.status(401).json({ error: "Authentication required" });
    }

    // Check if the user's role is ADMIN or SUPPER_ADMIN
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        next(); // User is an Admin or super Admin, proceed
    } else {
        //usser does not have the required role
        return res.status(403).json({ error: "Forbidden: Requires Admin role" });
    }
}

// Middleware to check if the autheticated user is a Super Admin
const isSuperAdmin = async (req, res, next) => {

    // Assuming requireSignin has already populated req.user
    if (!req.user) {
        //This should theoretically not happen if requireSignin is used before this
        return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user's role is SUPER_ADMIN
    if (req.user.role === "SUPER_ADMIN") {
        next(); // User is a Super Admin, proceed.
    } else {
        // User does not have the required role
        return res.status(403).json({ error: "Forbiden: Requires Super Admin role" });
    }
}

export { requireSignin, isAdmin, isSuperAdmin,  optionalSignin  }