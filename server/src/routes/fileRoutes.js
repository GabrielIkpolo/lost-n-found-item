import { Router } from "express";
import { deleteAFile, getAllFiles, uploadFile } from "../controllers/fileController.js";
import { makeUploader } from "../helpers/fileupload.js";

const router = Router();

const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'local').toLowerCase();


router.post('uploads', makeUploader(STORAGE_TYPE).single('file'), uploadFile);

router.get('files', getAllFiles);

router.delete('files/:id', deleteAFile);


export default router;
