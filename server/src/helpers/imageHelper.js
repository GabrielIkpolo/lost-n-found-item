import { fileURLToPath } from 'url';
import fs from 'fs';
import path from "path";
import dotenv from 'dotenv';


dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageStoragePath = path.join(__dirname, '../../fileStorage', 'images'); 


// Helper to get the static URL for a saved file path
// export const getImageUrl = (filePath) => {
//     if (!filePath) return null;
//     const fileName = path.basename(filePath);
//     // Assumes your static server path is /api/images and files are in fileStorage/images
//     return `${process.env.VITE_REACT_APP_API_BASE_URL || 'http://localhost:3000'}/api/images/${fileName}`;
// };



export const getImageUrl = (filePath, req) => {
    if (!filePath) return null;
    
    const fileName = path.basename(filePath);
    
    let baseUrl = process.env.VITE_REACT_APP_API_BASE_URL;
    
    if (!baseUrl && req) {
      baseUrl = `${req.protocol}://${req.get('host')}`;
    }
    
    return `${baseUrl || ''}/api/images/${fileName}`;
  };



// Helper to delete a file if it exists
export const deleteFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`Successfully deleted file: ${filePath}`);
        } catch (e) {
            console.error(`Error deleting file: ${filePath}`, e);
            // Continue execution even if file deletion fails
        }
    }
};