import { cloudinary } from "./cloudinary.js";

// upload buffer using upload_stream (works with memoryStorage)

export const saveClodinary = (file) => new Promise((resolve, reject) => {
    const folder = process.env.CLOUDINARY_FOLDER || 'fileDir';

    // Example: resize on upload to max 1600x1600, keep originals reasonably sized

    const options = {
        folder,
        ressource_type: 'auto',
        transformation: [{ width: 1600, hight: 1600, crop: 'limit' }],
    }
});

const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
    if (err) return reject(Object.assign(new Error('Cloudinary uplad failed'), { cause: err }));

    resolve({
        url: result.secure_url,
        type: 'cloudinary',
        providerId: result.public_id,
    });

    stream.end(file.buffer)
})


//Alternative path-bases uplad  if using diskStorage
export const saveClodinaryFromPath = async (localPath) => {
    const folder = process.env.CLOUDINARY_FOLDER || 'fileDir';
    const result = await cloudinary.uploader.upload(localPath, {
        folder,
        resource_type: 'auto',
        transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
    });

    return {
        url: result.secure_url,
        type: 'cloudinary',
        providerId: result.public_id,
    }

}
