// import { fileURLToPath } from 'url';
// import fs from 'fs';
// import path from "path";
// import dotenv from 'dotenv';




// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const imageStoragePath = path.join(__dirname, '../../fileStorage', 'images');


// export const getImageUrl = (filePath, req) => {
//     if (!filePath) return null;

//     const fileName = path.basename(filePath);

//     let baseUrl = process.env.VITE_REACT_APP_API_BASE_URL;

//     if (!baseUrl && req) {
//         baseUrl = `${req.protocol}://${req.get('host')}`;
//     }

//     return `${baseUrl || ''}/api/images/${fileName}`;
// };




// // Helper to delete a file if it exists
// export const deleteFile = (filePath) => {
//     if (filePath && fs.existsSync(filePath)) {
//         try {
//             fs.unlinkSync(filePath);
//             console.log(`Successfully deleted file: ${filePath}`);
//         } catch (e) {
//             console.error(`Error deleting file: ${filePath}`, e);
//             // Continue execution even if file deletion fails
//         }
//     }
// };


import { getImageUrl, uploadFile, deleteFile } from "../services/storageService.js"


export { getImageUrl, uploadFile, deleteFile }