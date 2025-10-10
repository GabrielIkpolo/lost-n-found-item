import { getImageUrl as _getImageUrl, uploadFile, deleteFile } from "../services/storageService.js"
import path from "path";
 

export const getImageUrl = (filePath, req) => {
  if (!filePath) return null;

  // Use the original helper to get the *relative* part (`/api/images/<file>`).
  const relative = _getImageUrl(filePath);

  // If the relative helper already returned a full URL (Cloudinary case) just return it.
  if (relative && (relative.startsWith('http://') || relative.startsWith('https://'))) {
    return relative;
  }

  // Determine the base URL.
  const baseFromEnv = process.env.SERVER_URL?.replace(/\/$/, '');
  const baseFromReq = req ? `${req.protocol}://${req.get('host')}` : null;
  const base = baseFromEnv || baseFromReq || '';

  // Ensure we don’t double‑slash the path.
  return `${base}${relative}`;
};

export { uploadFile, deleteFile };


