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
import { makeUploader } from "./src/helpers/fileupload.js";
import { scheduleArchivalTask } from "./src/tasks/archivalTask.js";
import fileRoutes from './src/routes/fileRoutes.js'

// Defined routes
import authRoutes from './src/routes/authRoutes.js';
import itemRoutes from './src/routes/itemRoutes.js';
import userRoutes from './src/routes/userRoutes.js';


dotenv.config();
const app = express();

const allowedOrigins = [
  process.env.VITE_REACT_APP_API_CLIENT_URL,
  'https://lost-and-found-items.onrender.com',
  'http://localhost:5173',
  'http://localhost:4173',
  'https://localhost:5173',
  'https://localhost:5173',
  '*',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.some(allowed =>
      origin === allowed ||
      origin.startsWith(allowed.replace('*', '')) ||
      new RegExp(allowed.replace('.', '\.').replace('*', '.*')).test(origin)
    )) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};




app.use(cors(corsOptions));

// Declared some middleware used
app.use([express.json(), morgan("dev")]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static image files
const staticOptions = {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    // Cache control for production
    if (process.env.NODE_ENV === 'production') {
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};


// if (process.env.STORAGE_TYPE === 'local') {
//   app.use('/api/images', express.static(imageStoragePath, staticOptions));
// }


// ======================junk=======================
// Static: serve local uploads


// Determine storage type and create multer instance
const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'local').toLowerCase();
const upload = makeUploader(STORAGE_TYPE); 

const fileStoragePath = path.join(process.cwd(), 'fileStorage', 'images');
app.use('/uploads', express.static(fileStoragePath));

// Routes
app.use('/api', fileRoutes);


// ============================================



const port = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Good security practice
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site, 'lax' for local
    maxAge: 7 * 24 * 60 * 60 * 1000 // e.g., 7 days
  }
}));


// Initialize Passport with the configuration
app.use(passport.initialize());
app.use(passport.session());


// Mount item routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes(upload));
app.use('/api/users', userRoutes);


// Return 404 for non-accounted routes
app.all('*', (req, res) => {
  res.status(404).json({
    msg: "Requested resource does not exist"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Something broke!" });
});

// For local SSL usage
// const sslOptions = {
//   key: fs.readFileSync(process.env.SSL_KEY_PATH),
//   cert: fs.readFileSync(process.env.SSL_CERT_PATH),
// }

// const httpsServer = https.createServer(sslOptions, app);

// Cloudinary
// import { v2 as cloudinary } from "cloudinary"
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // Optional: Test the connection
// cloudinary.api.ping()
//   .then(() => console.log('✅ Cloudinary connected successfully!'))
//   .catch(err => console.error('❌ Cloudinary connection failed:', err));


app.listen(port, '0.0.0.0', () => {
  console.log(`App is listening on port: ${port} `);
  // --- Schedule the automated tasks after the server starts ---
  scheduleArchivalTask();

});