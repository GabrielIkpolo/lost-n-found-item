import { PrismaClient, Provider } from "@prisma/client";
import { saveLocal } from "../helpers/localStorage.js";
import { saveClodinary, saveClodinaryFromPath } from "../helpers/cloudinaryStorage.js";
import { cloudinary } from "../helpers/cloudinary.js";
import prisma from "../helpers/prisma.js";


const buildAbsoluteLocalUrl = (req, filename) => {

    const base = process.env.SERVERURL?.replace(/\/$/, '') || `${req.protocol}://${req.get('host')}`;
    return `${base}/uploads/${filename}`;
}


export const uploadFile = async (re, res, next) => {

    try {

        const STORAGE_TYPE = (process.env.STORAGE_TYPE || 'local').toLowerCase();
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        let stored;
        if (STORAGE_TYPE === 'cloudinary') {
            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
                return res.status(500).json({ error: 'Cloudinary credentials missing in .env' })
            }

            //if using memnoryStorage(recommended)
            if (req.file.buffer) {
                stored = await saveClodinary(req.file)
            } else if (req.file.path) {
                // If you decided to keep diskStorage for all
                stored = await saveClodinaryFromPath(req.file.path);
            } else {
                throw new error('Missing file buffer/path for cloudinary')
            }



        } else if (STORAGE_TYPE === 'local') {
            // Ensure absolute URL for client display
            const url = buildAbsoluteLocalUrl(req, req.file.filename);
            stored = { url, type: 'local', ProviderId: req.file.filename };
        } else {
            return res.status(400).json({ error: ' Invalid STORAGE_TYPE. Use "local" or "cloudinary" ' })
        }



        const record = await prisma.file.create({
            data: {
                filename: req.file.originalname,
                url: stored.url,
                type: stored.type,
                ProviderId: stored.ProviderId,
                uplaodedAt: new Date(),
            }
        });


        res.status(201).json({
            message: `File uploaded to ${stored.type}`,
            file: record,
        });


    } catch (err) {
        console.log(err);
        next(err)
    }

}



export const getAllFiles = async (req, res, next) => {

    try {
        const files = await prisma.file.findMany({
            orderBy: {
                uplaodedAt: 'desc'
            }
        })

        res.json(files)
    } catch (err) {
        console.log(err)
        next(err);
    }
}



export const deleteAFile = async (req, res, next) => {
    try {
        const {id} = req.params;
        const file = await prisma.file.findUnique({where: {id}});
        if (!file) return res.status(404).json({error: 'File not found'})

        if(file.type =='clodinary' && file.ProviderId){
            await cloudinary.uploader.destroy(file.ProviderId);
        }

        await prisma.file.delete({where: {id}})
        res.json({message: 'File deleted successfully'})

    } catch (err) {
        console.log(err)
        next(err)
    }
}
