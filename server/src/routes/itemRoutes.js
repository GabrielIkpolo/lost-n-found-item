import express from 'express';
import { createItem, getItems, getItemDetails } from '../controllers/itemController.js'; 
import { requireSignin } from '../helpers/authMiddleware.js';


// We'll export a function that takes the multer upload middleware
const itemRoutes = (upload) => {
    const router = express.Router();

    // Route for creating a new item (POST /api/items)
    router.post(
        '/',
        requireSignin, // User must be signed in to report
        upload.fields([ // Use .fields() for multiple files with specific field names
            { name: 'imageUrlFront', maxCount: 1 },
            { name: 'imageUrlBack', maxCount: 1 }
        ]),
        createItem // Controller function to handle the request
    );

    // Route for getting a list of items (GET /api/items)
    // This route now handles filtering, sorting, pagination, AND search
    router.get('/', getItems); // getItems controller handles the logic


    // Route for getting details of a single item (GET /api/items/:id)
    router.get('/:id', getItemDetails);


    return router;
};

export default itemRoutes;