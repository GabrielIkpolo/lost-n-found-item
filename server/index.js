import prisma from "./helpers/prisma.js";

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


dotenv.config();
const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS

// delcared some middleware used 
app.use([express.json(), morgan("dev")]);


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Static files configuration
const imageStoragePath = path.join(__dirname, 'fileStorage', 'images');

// Ensure the directory exists

if (!fs.existsSync(imageStoragePath)) {
  fs.mkdirSync(imageStoragePath, { recursive: true });
}

app.use(cors("*"));


// Serve static image files
app.use('/api/images', express.static(imageStoragePath));


// Return 404 for non accounted routes
app.all('*', (req, res) => {
  res.status(404).json({
    msg: "Requested resource does not exist"
  });
});

const port = process.env.PORT || 3000;

app.listen(port, ()=>{
  console.log(`App is listening on port: ${port} `);
});