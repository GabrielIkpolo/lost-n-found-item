import rateLimit from "express-rate-limit";



// --- Rate Limit Configuration ---

// Strict rate limit for authentication attempts (login, register, forgot password)
// Prevents brute-force attacks
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in headers (RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset)
    legacyHeaders: false, // Disable X-RateLimit-* headers
});

// Moderate rate limit for less sensitive actions (e.g., verify email, resend verification)
export const moderateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});


// --- Rate Limit Configuration for Item Routes ---

// More lenient rate limit for general browsing (GET requests)
export const publicApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Moderate rate limit for authenticated item actions (POST, PUT, DELETE, POST /claim)
export const itemActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 requests per windowMs
    message: 'Too many requests for item actions from this IP, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});