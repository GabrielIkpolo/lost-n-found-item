import jwt from 'jsonwebtoken';
import prisma from './prisma.js';


const requireSignin = async (req, res, next) => {
    try {
        // Extract the token from the Authorization header
        const token = req.headers.authorization;

        console.log("REQUET Headers===>", req.headers);

        // Check if the token exists
        if (!token) {
            return res.status(401).json({ error: "Unauthorized: Token is missing" });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRETE, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Unauthorized: Invalid token" });
            }

            // Fetch user data based on the decoded token
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
            });

            // Attach the user object to the request for further processing
            req.user = user;
            next();
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

 
const isAdmin = async (req, res, next) => {

    try {
        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
        });

        if (user.role == 0) {
            return res.json("Not Authorised to see resource");
        }
        next();

    } catch (error) {
        console.error(error);
        return res.status(500).json({ Error: "Internal Server Error" });
    }
}

const isSuperAdmin = async (req, res, next) => {

    try {
        const user = await prisma.user.findUnique({
            where: { email: req.user.email },
        });

        if (user.role !== 2) {
            return res.json("Unathorized");
        }

        next();
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export default { requireSignin, isSuperAdmin, isAdmin }