import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { application } from 'express';



const uploadDir = path.join(process.cwd(), 'fileStorage', 'images');

if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir, { recursive: true });
}


const diskStorage = multer.diskStorage({
   destination: (req, file, cb) => cb(null, uploadDir),
   filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, filename);
   },
});


const memoryStorate = multer.memoryStorage();

// Basic file type filters
const fileFilter = (req, file, cb) => {
   const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

   if (allowed.includes(file.mimetype)) return cb(null, true);
   cb(Object.assign(new Error('Unsupported file type'), { status: 400 }))
};


const limits = { fileSize: 10 * 1024 * 1024 } // 10MB


export const makeUploader = (storageType) => multer({
   storage: storageType === 'cloudinary' ? memoryStorate : diskStorage,
   fileFilter,
   limits,
})