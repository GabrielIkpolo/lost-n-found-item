import express from 'express';
import { createItem, getItems, getItemDetails, updateItem, deleteItem } from '../controllers/itemController.js';
import { requireSignin, isAdmin } from '../helpers/authMiddleware.js';


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

    // Route for updating an item (PUT/PATCH /api/items/:id)
    // Requires signin. Authorization check (owner or admin) will be inside the controller.
    // Uses multer to handle potential new image uploads
    router.put(
        '/:id',
        requireSignin,
        upload.fields([
            { name: 'imageUrlFront', maxCount: 1 },
            { name: 'imageUrlBack', maxCount: 1 }
        ]),
        updateItem // Controller function to handle update
    );

    // Route for deleting an item (DELETE /api/items/:id)
    // Requires signin. Authorization check (owner or admin) will be inside the controller.
    router.delete(
        '/:id',
        requireSignin,
        deleteItem // Controller function to handle delete
    );



    return router;
};

export default itemRoutes;