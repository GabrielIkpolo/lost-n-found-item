import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();


// // Determine storage type: Cloudinary (prod) or Local (dev)
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const UPLOAD_DIR = path.join(process.cwd(), 'fileStorage', 'images');

// Configure Cloudinary only if using it
if (STORAGE_TYPE === 'cloudinary') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Ensure upload directory exist for local storage
if (STORAGE_TYPE === 'local' && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}



// Helper: Get image URL based on storage type
export const getImageUrl = (filePath, publicId = null) => {
  if (!filePath && !publicId) return null;


  if (STORAGE_TYPE === 'cloudinary') {
    return publicId
      ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
      : null;
  }

  //For local storage
  return filePath     ? `/uploads/${path.basename(filePath)}` : null
};


//Upload file
export const uploadFile = async (file, folder = 'items') => {
  if (!file) throw new Error('No file provided');

  if (STORAGE_TYPE === 'cloudinary') {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      resource_type: 'auto',
    });

    // clean up temp file
    fs.unlinkSync(file.path);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      filePath: null,
    };
  }

  if (STORAGE_TYPE === 'local') {
    const fileName = path.basename(file.path); 
    const relativePath = path.join('fileStorage', 'images', fileName);

    return {
      url: `/uploads/${fileName}`,
      filePath: relativePath, 
      publicId: null,
    };
  }

  throw new Error('Invalid storage type or file configuration in uploadFile.');
};




// Helper: Delete file from storage
export const deleteFile = (filePath, publicId = null) => {

  try {

    if (STORAGE_TYPE === 'cloudinary' && publicId) {
      cloudinary.uploader.destroy(publicId)
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

  } catch (error) {
    console.error('Error deleting file: ', error);
    throw error

  }
};




// import { v2 as cloudinary } from 'cloudinary';
// import fs from 'fs';
// import path from 'path';
// import dotenv from 'dotenv';

// dotenv.config();

// // Determine storage type: Cloudinary (prod) or Local (dev)
// const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
// const UPLOAD_DIR = path.join(process.cwd(), 'fileStorage', 'images');

// // Configure Cloudinary only if using it
// if (STORAGE_TYPE === 'cloudinary') {
//   cloudinary.config({
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY,
//     api_secret: process.env.CLOUDINARY_API_SECRET,
//   });
// }

// // Ensure upload directory exists for local storage
// if (STORAGE_TYPE === 'local' && !fs.existsSync(UPLOAD_DIR)) {
//   fs.mkdirSync(UPLOAD_DIR, { recursive: true });
// }

// export const uploadFile = async (file, folder = 'items') => {
//   if (!file) throw new Error('No file provided');

//   if (STORAGE_TYPE === 'cloudinary') {
//     const result = await cloudinary.uploader.upload(file.path, {
//       folder,
//       resource_type: 'auto',
//     });

//     // Clean up temp file
//     fs.unlinkSync(file.path);

//     return {
//       url: result.secure_url,
//       publicId: result.public_id,
//       filePath: null,
//     };
//   }

//   if (STORAGE_TYPE === 'local') {
//     const fileName = path.basename(file.path);
//     const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';
//     const absoluteUrl = `${serverUrl}/uploads/${fileName}`;
//     const relativePath = path.join('fileStorage', 'images', fileName);

//     return {
//       url: absoluteUrl, // Full accessible URL
//       filePath: relativePath, // Internal server path
//       publicId: null,
//     };
//   }

//   throw new Error('Invalid storage type configured');
// };

// export const deleteFile = (filePath, publicId = null) => {
//   try {
//     if (STORAGE_TYPE === 'cloudinary' && publicId) {
//       cloudinary.uploader.destroy(publicId);
//     }

//     if (filePath && fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     throw error;
//   }
// };

// // Helper function remains unchanged but won't be needed for local storage
// export const getImageUrl = (filePath, publicId = null) => {
//   if (!filePath && !publicId) return null;

//   if (STORAGE_TYPE === 'cloudinary') {
//     return publicId
//       ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`
//       : null;
//   }

//   // For local storage, this won't be used since we're already returning absolute URLs in uploadFile()
//   return filePath ? `/uploads/${path.basename(filePath)}` : null;
// };