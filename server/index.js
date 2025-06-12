import prisma from "./src/helpers/prisma.js";

/** ================= Server Hardening Measures ============================ */
// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  process.exit(1); // Exiting the process is often recommended to avoid undefined behavior
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exiting the process is often recommended to avoid undefined behavior
});

// When ctrl +C is pressed to terminate the application 
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Process terminated');
  await prisma.$disconnect(); // Perform clean-up tasks here if necessary
  process.exit(0);
});

/** =================  End Server Hardening============================ */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import morgan from "morgan";
import fs from 'fs';
import https from 'https';
import session from 'express-session';
import passport from "./src/helpers/passport.js";
import multer from 'multer'; // Import multer

// Defined routes
import authRoutes from './src/routes/authRoutes.js';
import itemRoutes from './src/routes/itemRoutes.js'; // Import item routes

dotenv.config();
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS;

// Declared some middleware used
app.use([express.json(), morgan("dev")]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static files configuration
const imageStoragePath = path.join(__dirname, 'fileStorage', 'images');

// Ensure the directory exists
if (!fs.existsSync(imageStoragePath)) {
  fs.mkdirSync(imageStoragePath, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, imageStoragePath); // Save files to the imageStoragePath
  },
  filename: function (req, file, cb) {
    // Use the original file extension and add a timestamp to prevent name conflicts
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

// Create the multer instance
const upload = multer({ storage: storage });

app.use(cors("*"));

// Serve static image files
app.use('/api/images', express.static(imageStoragePath));

const port = process.env.PORT || 3000;

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: process.env.NODE_ENV === 'production' } // Enable for HTTPS
}));

// Initialize Passport with the configuration
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);

// Mount item routes
// Pass the 'upload' middleware instance to the itemRoutes to handle file uploads
app.use('/api/items', itemRoutes(upload));

// Return 404 for non-accounted routes
app.all('*', (req, res) => {
  res.status(404).json({
    msg: "Requested resource does not exist"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ message: "Something broke!" });
});

// For local SSL usage
// const sslOptions = {
//   key: fs.readFileSync(process.env.SSL_KEY_PATH),
//   cert: fs.readFileSync(process.env.SSL_CERT_PATH),
// }

// const httpsServer = https.createServer(sslOptions, app);

app.listen(port, () => {
  console.log(`App is listening on port: ${port} `);
});