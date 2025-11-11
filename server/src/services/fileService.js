import prisma from "../helpers/prisma.js";
import { saveCloudinary, saveCloudinaryFromPath } from "../helpers/cloudinaryStorage.js";
import { cloudinary } from "../helpers/cloudinary.js";
import * as fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function (extracted from fileController.js)
const buildAbsoluteLocalUrl = (req, filename) => {
    const base = process.env.SERVERURL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    return `${base}/uploads/${filename}`;
}


/**
 * Uploads a file (either to local storage or Cloudinary) and creates a File database record.
 * This function handles the core file storage logic.
 * @param {object} req - The Express request object (needed for local URL construction and host info)
 * @param {object} file - The file object from Multer (req.file or req.files[0])
 * @returns {Promise<object>} The newly created File database record.
 */
export const uploadAndCreateFileRecord = async (req, file) => {
    const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'local').toLowerCase();

    let stored;
    if (STORAGE_TYPE === 'cloudinary') {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Cloudinary credentials missing in .env');
        }

        if (file.buffer) {
            stored = await saveCloudinary(file)
        } else if (file.path) {
            stored = await saveCloudinaryFromPath(file.path);
        } else {
            console.error('Missing file buffer/path for cloudinary');
            throw new Error('Missing file buffer/path for cloudinary');
        }

    } else if (STORAGE_TYPE === 'local') {
        const url = buildAbsoluteLocalUrl(req, file.filename);
        stored = { url, type: 'local', providerId: file.filename };
    } else {
        throw new Error('Invalid STORAGE_TYPE. Use "local" or "cloudinary"');
    }

    const record = await prisma.file.create({
        data: {
            filename: file.originalname,
            url: stored.url,
            type: stored.type,
            providerId: stored.providerId,
            uploadedAt: new Date(),
        }
    });

    return record;
}


/**
 * Deletes a file from storage and removes its corresponding File database record.
 * @param {string} fileId - The ID of the File record to delete.
 */
export const deleteFileAndRecord = async (fileId) => {
    if (!fileId) return;

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return;

    // 1. Delete from storage (local or cloudinary)
    try {
        if (file.type === 'local' && file.providerId) {
            const filePath = path.join(__dirname, "..", "..", 'fileStorage', 'images', file.providerId);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        if (file.type === 'cloudinary' && file.providerId) {
            await cloudinary.uploader.destroy(file.providerId);
        }
    } catch (storageError) {
        // Log the storage deletion error but continue to delete the DB record
        console.error(`Error deleting file from storage (ID: ${fileId}, Type: ${file.type}):`, storageError);
    }

    // 2. Delete the database record
    await prisma.file.delete({ where: { id: fileId } });
}


/**
 * Helper to construct the public URL for a file record.
 * @param {object | null} fileRecord - The File database record object.
 * @returns {string | null} The public URL or null.
 */
export const getFileUrl = (fileRecord) => {
    if (!fileRecord) return null;
    return fileRecord.url;
}