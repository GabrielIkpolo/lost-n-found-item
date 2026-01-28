import express from 'express';
import {
    createItem, getItems, getItemDetails, updateItem, deleteItem, claimItem,
    markItemReturned, confirmItemReceived, cancelItemClaim, reportItem
} from '../controllers/itemController.js';
import { requireSignin, isAdmin, optionalSignin } from '../helpers/authMiddleware.js';
import { publicApiLimiter, itemActionLimiter } from '../middleware/rateLimiter.js';
// import { optionalSignin } from '../helpers/authMiddleware.js';


// We'll export a function that takes the multer upload middleware
const itemRoutes = (upload) => {
    const router = express.Router();

    // Route for creating a new item (POST /api/items)
    router.post(
        '/',
        requireSignin,
        itemActionLimiter, // Apply moderate rate limit
        upload.fields([ // Use .fields() for multiple files with specific field names
            { name: 'imageUrlFront', maxCount: 1 },
            { name: 'imageUrlBack', maxCount: 1 }
        ]),
        createItem
    );

    // Route for getting a list of items (GET /api/items)
    // Uses optionalSignin to populate req.user if token exists, but allows public access.
    // Filtering logic will be inside the controller based on req.user existence/role.
    router.get('/', publicApiLimiter, optionalSignin, getItems); // Apply optionalSignin // linient rates


    // Route for getting details of a single item (GET /api/items/:id)
    router.get('/:id', publicApiLimiter, optionalSignin, getItemDetails);


    // Route for updating an item (PUT/PATCH /api/items/:id)
    // Requires signin. Authorization check (owner or admin) will be inside the controller.
    // Uses multer to handle potential new image uploads
    router.put(
        '/:id',
        requireSignin,
        itemActionLimiter,
        upload.fields([
            { name: 'imageUrlFront', maxCount: 1 },
            { name: 'imageUrlBack', maxCount: 1 }
        ]),
        updateItem
    );

    // Route for deleting an item (DELETE /api/items/:id)
    // Requires signin. Authorization check (owner or admin) will be inside the controller.
    router.delete(
        '/:id',
        requireSignin,
        itemActionLimiter,
        deleteItem // Controller function to handle delete
    );

    // New Route for claiming a FOUND item (POST /api/items/claim/:id)
    router.post(
        '/claim/:id', // Use a descriptive endpoint like /:idS
        requireSignin, // User must be signed in to claim
        itemActionLimiter,
        claimItem // Controller function to handle the claim logic
    );

    // Endpoint to mark an item as RETURNED (typically by the reporter)
    router.put(
        '/:id/status/returned',
        requireSignin,
        itemActionLimiter,
        markItemReturned
    );

    // Endpoint to confirm receiving a claimed item (typically by the claimant)
    router.put(
        '/:id/status/received',
        requireSignin,
        itemActionLimiter,
        confirmItemReceived
    );

    // Endpoint to cancel a claim on an item (typically by the claimant)
    router.put(
        '/:id/status/cancel-claim',
        requireSignin,
        itemActionLimiter,
        cancelItemClaim
    );

    // Route to report an item
    router.post(
        '/:id/report',
        requireSignin,
        itemActionLimiter,
        reportItem
    );

    return router;
};

export default itemRoutes;