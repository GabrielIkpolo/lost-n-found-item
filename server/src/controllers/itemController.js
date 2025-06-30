import prisma from '../helpers/prisma.js';
import path from 'path';
import fs from 'fs';
import { Prisma, ItemCategory, ItemLocation, ItemStatus, UserRole, NotificationType } from '@prisma/client';
import { sendNotification } from '../services/notificationService.js';
import { getImageUrl, deleteFile } from '../helpers/imageHelper.js';



export const createItem = async (req, res) => {
    try {
        // req.body contains text fields
        // req.files contains file information from multer
        const { title, description, category, location, status } = req.body;
        const userId = req.user.id; // Assuming req.user is populated by requireSignin

        // Validate required fields (basic check)
        if (!title || !description || !category || !location) {
            // Clean up uploaded files if validation fails
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(400).json({ error: "Title, description, category, and location are required." });
        }

        // Basic validation for enums (Prisma will also validate, but good to check early)
        // Correct: Access enum keys from the imported Prisma namespace

        const validCategories = Object.values(ItemCategory);
        const validLocations = Object.values(ItemLocation);
        const validStatuses = Object.values(ItemStatus);

        if (!validCategories.includes(category)) {
            // Clean up uploaded files if validation fails
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(400).json({ error: `Invalid category: ${category}. Must be one of ${validCategories.join(', ')}` });
        }
        if (!validLocations.includes(location)) {
            // Clean up uploaded files if validation fails
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(400).json({ error: `Invalid location: ${location}. Must be one of ${validLocations.join(', ')}` });
        }

        // Determine the status based on reporting type (Lost/Found)
        // The frontend should ideally send `status` as 'LOST' or 'FOUND'
        // You might enforce this based on the route or add validation here.
        // For simplicity, let's assume the frontend sends a valid status.
        if (!validStatuses.includes(status)) {
            // Clean up uploaded files if validation fails
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}` });
        }

        // Process uploaded files
        const imageUrlFrontPath = req.files?.imageUrlFront?.[0]?.path || null; // Use path saved by multer
        const imageUrlBackPath = req.files?.imageUrlBack?.[0]?.path || null;

        // Calculate expiry date for FOUND items
        let expiresAt = null;
        if (status === 'FOUND') {
            // Example: Expires 90 days from creation
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now
        }

        // Create the item in the database
        const newItem = await prisma.item.create({
            data: {
                title,
                description,
                category, // Ensure these match the Prisma enum values
                location, // Ensure these match the Prisma enum values
                status,   // Ensure these match the Prisma enum values
                reportedBy: { connect: { id: userId } },
                imageUrlFront: imageUrlFrontPath, // Store the internal file path
                imageUrlBack: imageUrlBackPath,   // Store the internal file path
                expiresAt: expiresAt, // Set expiry for found items
                // claimedById will be null initially
            },
        });

        // Optionally, return the public URLs in the response
        const responseItem = {
            ...newItem,
            imageUrlFront: getImageUrl(newItem.imageUrlFront),
            imageUrlBack: getImageUrl(newItem.imageUrlBack),
        };

        // TODO: Implement Audit Log for CREATE_ITEM action
        // TODO: Implement Notification for new item (e.g., notify admins?)

        return res.status(201).json({
            message: "Item reported successfully",
            item: responseItem, // Return the item with public URLs
        });

    } catch (error) {
        console.error("Error creating item:", error);

        // Clean up uploaded files if an error occurred *after* multer saved them
        // Ensure paths are accessed correctly even in catch
        if (req.files?.imageUrlFront?.[0]?.path) {
            try { fs.unlinkSync(req.files.imageUrlFront[0].path); } catch (e) { console.error("Error cleaning up front image:", e); }
        }
        if (req.files?.imageUrlBack?.[0]?.path) {
            try { fs.unlinkSync(req.files.imageUrlBack[0].path); } catch (e) { console.error("Error cleaning up back image:", e); }
        }
        // Handle specific Prisma errors if needed, otherwise return generic 500
        if (error.code === 'P2025') { // Example: User not found (though requireSignin should prevent this)
            return res.status(404).json({ error: "User not found." });
        }
        // Handle other potential errors (e.g., invalid enum value caught by Prisma, network issues)
        // For now, generic server error is fine
        return res.status(500).json({ error: "Internal server error while creating item." });
    }
};


// export const getItems = async (req, res) => {
//     try {
//         // Extract query parameters for pagination, filtering, and search
//         const page = parseInt(req.query.page, 10) || 1; // Default to page 1
//         const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
//         const status = req.query.status; // Filter by status (e.g., 'FOUND', 'LOST')
//         const category = req.query.category; // Filter by category
//         const location = req.query.location; // Filter by location
//         const searchQuery = req.query.q; // Add search query parameter

//         const skip = (page - 1) * limit; // Calculate number of items to skip

//         // Build the filter (where clause) for the Prisma query
//         const where = {};

//         // --- Add status filter ---
//         // If a status query parameter is provided, validate and add it to the where clause.
//         // Otherwise, default to only showing 'FOUND' items.
//         if (status) {
//             // Ensure the status is a valid enum value before adding to where
//             // Correct: Use Prisma.ItemStatus
//             if (Object.values(ItemStatus).includes(status)) {
//                 where.status = status;
//             } else {
//                 // Handle invalid status input early
//                 return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${Object.values(ItemStatus).join(', ')}` });
//             }
//         } else {
//             // Default behavior: Only show 'FOUND' items publicly if no status filter is provided
//             where.status = 'FOUND'; // Keep default filter for browsing
//         }

//         // --- Add category filter ---
//         if (category) {
//             // Correct: Use Prisma.ItemCategory
//             if (Object.values(ItemCategory).includes(category)) {
//                 where.category = category;
//             } else {
//                 // Handle invalid category input early
//                 return res.status(400).json({ error: `Invalid category: ${category}. Must be one of ${Object.values(ItemCategory).join(', ')}` });
//             }
//         }

//         // --- Add location filter ---
//         if (location) {
//             // Correct: Use Prisma.ItemLocation
//             if (Object.values(ItemLocation).includes(location)) {
//                 where.location = location;
//             } else {
//                 // Handle invalid location input early
//                 return res.status(400).json({ error: `Invalid location: ${location}. Must be one of ${Object.values(ItemLocation).join(', ')}` });
//             }
//         }


//         // --- Add search condition if searchQuery is provided ---
//         if (searchQuery) {
//             // Use 'OR' to search across multiple fields
//             where.OR = [
//                 { title: { contains: searchQuery, mode: 'insensitive' } },
//                 { description: { contains: searchQuery, mode: 'insensitive' } },
//                 // Searching on enum fields requires matching the exact string value of the enum,
//                 // not necessarily part of the user-friendly display name. 'contains' might work if the enum value
//                 // is a substring of the search query (e.g., searching "ELECTRONICS" finds "ELECTRONICS_GADGETS").
//                 // If you want to search user-friendly names, you might need a mapping or rethink the search strategy for enums.
//                 { category: { contains: searchQuery, mode: 'insensitive' } }, // These search against the enum string values
//                 { location: { contains: searchQuery, mode: 'insensitive' } }, // These search against the enum string values
//             ];
//             // Note: The search here is applied *within* the existing filters (status, category, location).
//             // E.g., if status is 'FOUND', search only happens on FOUND items.
//         }


//         // Build the order by clause (e.g., newest first)
//         const orderBy = {
//             createdAt: 'desc', // Default sort by newest first
//         };

//         // Fetch items with pagination, filtering, and sorting
//         const items = await prisma.item.findMany({
//             where: where, // Use the constructed where object
//             orderBy: orderBy,
//             skip: skip,
//             take: limit, // Use take for the limit
//             // Select specific fields for performance and privacy
//             select: {
//                 id: true,
//                 title: true,
//                 description: true,
//                 category: true,
//                 location: true,
//                 imageUrlFront: true, // Fetch internal paths
//                 imageUrlBack: true,   // Fetch internal paths
//                 status: true,
//                 createdAt: true,
//                 updatedAt: true,
//                 expiresAt: true,
//                 // Include reportedBy and claimedBy if needed for display in the list view
//                 reportedBy: { // Optional: select minimal reporter info for list view privacy
//                     select: {
//                         id: true,
//                         name: true, // Only expose name and ID in list view for privacy
//                     }
//                 },
//                 // claimedBy: { // Optional: select minimal claimer info for list view privacy
//                 //      select: {
//                 //          id: true,
//                 //          name: true, // Only expose name and ID
//                 //      }
//                 // }
//             },
//         });

//         // Get the total count of items matching the combined filter and search criteria
//         // Use the SAME where clause as the findMany query
//         const totalItems = await prisma.item.count({
//             where: where,
//         });

//         // Calculate total pages
//         const totalPages = Math.ceil(totalItems / limit);

//         // Map items to include public image URLs and clean up user info for list view
//         const itemsWithPublicUrls = items.map(item => ({
//             ...item,
//             imageUrlFront: getImageUrl(item.imageUrlFront),
//             imageUrlBack: getImageUrl(item.imageUrlBack),
//             reportedBy: item.reportedBy ? { // Ensure reportedBy exists before mapping
//                 id: item.reportedBy.id,
//                 name: item.reportedBy.name // Explicitly include only desired fields
//             } : null,
//             // claimedBy: item.claimedBy ? { ... map claimedBy fields ... } : null, // Handle claimedBy similarly if included
//         }));


//         return res.status(200).json({
//             items: itemsWithPublicUrls,
//             pagination: {
//                 totalItems: totalItems,
//                 totalPages: totalPages,
//                 currentPage: page,
//                 itemsPerPage: limit,
//                 query: searchQuery // Echo the search query back
//             },
//         });

//     } catch (error) {
//         console.error("Error fetching items:", error);
//         // Handle specific Prisma errors if needed, otherwise return generic 500
//         // Check if it's a known Prisma error, potentially due to invalid input or database issues
//         if (error instanceof Prisma.PrismaClientKnownRequestError) {
//             if (error.code === 'P2011' || error.code === 'P2000') { // P2011: Invalid enum value, P2000: Input data too large/invalid
//                 return res.status(400).json({ error: "Invalid filter or search value provided." });
//             }
//             // You could add more specific error handling for other Prisma errors here based on error.code
//         }
//         // Catch other unexpected errors (network, other code issues)
//         return res.status(500).json({ error: "Internal server error while fetching items." });
//     }
// };


export const getItemDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate the ID format (Prisma's findUnique might handle invalid format, but explicit check is clearer)
        if (!id) {
            return res.status(400).json({ error: "Item ID is required." });
        }
        // Basic check if it looks like a MongoDB ObjectId (Requires importing ObjectId from 'mongodb')
        // If you uncomment this, make sure 'mongodb' is installed (`npm install mongodb`)
        // try {
        //     new ObjectId(id);
        // } catch (e) {
        //      return res.status(400).json({ error: "Invalid Item ID format." });
        // }


        // Fetch the item by ID
        const item = await prisma.item.findUnique({
            where: { id: id },
            // Include reportedBy and claimedBy details. Be MINDFUL OF PRIVACY HERE.
            // Only include sensitive info (email, phone) if the requester is authorized (e.g., reporter, claimant, admin).
            // For a basic detail view accessible to anyone (like FOUND items), you might expose less reporter/claimer info.
            // If you need conditional exposure, fetch the user performing the request (`req.user`), check their role/ID,
            // and then decide which user fields to include in the response based on that.
            // For simplicity in this snippet, we're fetching email/phone but you may want to censor them below.
            include: {
                reportedBy: {
                    select: { id: true, name: true, email: true, phone: true } // Decide what reporter fields to fetch
                },
                claimedBy: { // Include if claimedBy exists
                    select: { id: true, name: true, email: true, phone: true } // Decide what claimer fields to fetch
                }
            }
        });

        // Handle item not found
        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        // Transform the item to include public image URLs and potentially censor user info for detail view
        const itemWithPublicUrls = {
            ...item,
            imageUrlFront: getImageUrl(item.imageUrlFront),
            imageUrlBack: getImageUrl(item.imageUrlBack),
            // Censor reportedBy/claimedBy info if needed for privacy in the detail view
            reportedBy: item.reportedBy ? { // Ensure reportedBy exists before mapping
                id: item.reportedBy.id,
                name: item.reportedBy.name,
                // Example of conditional censoring:
                // email: (req.user && (req.user.id === item.reportedById || req.user.role === 'ADMIN')) ? item.reportedBy.email : '***',
                // phone: (req.user && (req.user.id === item.reportedById || req.user.role === 'ADMIN')) ? item.reportedBy.phone : '***',
                // For now, keeping as per the 'include' select statement:
                email: item.reportedBy.email, // Currently exposing
                phone: item.reportedBy.phone, // Currently exposing
            } : null, // Handle case where reportedBy is null (shouldn't happen with schema config but good practice)
            claimedBy: item.claimedBy ? { // Ensure claimedBy exists before mapping
                id: item.claimedBy.id,
                name: item.claimedBy.name,
                // Censor/expose claimedBy info similarly
                email: item.claimedBy.email, // Currently exposing
                phone: item.claimedBy.phone, // Currently exposing
            } : null, // claimedBy is optional in schema, so can be null

        };


        return res.status(200).json(itemWithPublicUrls); // Return the single item details


    } catch (error) {
        console.error("Error fetching item details:", error);
        // Handle specific Prisma errors if needed, otherwise return generic 500
        if (error instanceof Prisma.PrismaClientKnownRequestError) { // Check if it's a known Prisma error
            // Add checks for specific Prisma error codes related to finding unique records or invalid input
            if (error.code === 'P2025') { // Record not found (should be caught by !item check, but defensive)
                return res.status(404).json({ error: "Item not found." });
            }
            // Example: Invalid ID format passed in params caught by Prisma before ObjectId.isValid check
            if (error.code === 'P2000') { // Invalid input data (e.g., malformed ID)
                return res.status(400).json({ error: "Invalid Item ID format." });
            }
            // You could add more specific error handling for other Prisma errors here based on error.code
        }
        // Catch other unexpected errors (network, other code issues)
        return res.status(500).json({ error: "Internal server error while fetching item details." });
    }
};


// --- updateItem function ---
export const updateItem = async (req, res) => {
    // Ensure req.user is available from requireSignin middleware
    if (!req.user) {
        // This should not happen if requireSignin is used on the route
        return res.status(401).json({ error: "Authentication required." });
    }

    const newFiles = req.files; // Files uploaded by multer for this request (if any)

    try {
        const { id } = req.params;
        // Extract fields to update from body. Use object destructuring carefully
        // Only include fields you INTEND to allow updating
        const {
            title,
            description,
            category,
            location,
            status,
            // Flags to explicitly remove images
            removeImageUrlFront, // Should be 'true' or 'false' string from form-data
            removeImageUrlBack   // Should be 'true' or 'false' string from form-data
            // Do NOT allow updating reportedById, claimedById, createdAt, etc. directly
        } = req.body;
        const userId = req.user.id; // User ID from requireSignin
        const userRole = req.user.role; // User role from requireSignin


        // Validate ID format if necessary (optional if Prisma handles it sufficiently)
        // if (!ObjectId.isValid(id)) {
        //      // Clean up newly uploaded files on invalid ID
        //      if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0.path);
        //      if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
        //      return res.status(400).json({ error: "Invalid Item ID format." });
        // }


        // 1. Fetch the existing item to check ownership, get current image paths, and current status
        const existingItem = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                reportedById: true,
                imageUrlFront: true, // Get current image paths
                imageUrlBack: true,   // Get current image paths
                status: true, // Need current status for expiry logic
            },
        });

        // Handle item not found
        if (!existingItem) {
            // Clean up any newly uploaded files if the item doesn't exist
            if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
            if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
            return res.status(404).json({ error: "Item not found." });
        }

        // 2. Authorization Check: Is the user the owner or an Admin/Super_Admin?
        const isOwner = existingItem.reportedById === userId;
        // Note: UserRole is imported from '@prisma/client'
        const isAdminOrSuperAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

        // Owners can update their items, Admins can update any item
        if (!isOwner && !isAdminOrSuperAdmin) {
            // Clean up any newly uploaded files if authorization fails
            if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
            if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
            return res.status(403).json({ error: "Forbidden: You do not have permission to update this item." });
        }

        // Optional: Add more granular permissions (e.g., Owners can only update status, Admins can update anything)
        // For now, assuming owner/admin can update allowed fields.

        // 3. Prepare update data object and handle image paths
        const updateData = {};
        const filesToDelete = []; // Array to store paths of old files to delete AFTER db update

        // Add fields from body to updateData if they are provided (not undefined)
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        // Validate and update enum fields if provided
        if (category !== undefined) {
            if (Object.values(ItemCategory).includes(category)) {
                updateData.category = category;
            } else {
                // Clean up newly uploaded files before returning error
                if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
                if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
                return res.status(400).json({ error: `Invalid category: ${category}. Must be one of ${Object.values(Prisma.ItemCategory).join(', ')}` });
            }
        }
        if (location !== undefined) {
            if (Object.values(ItemLocation).includes(location)) {
                updateData.location = location;
            } else {
                // Clean up newly uploaded files before returning error
                if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
                if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
                return res.status(400).json({ error: `Invalid location: ${location}. Must be one of ${Object.values(Prisma.ItemLocation).join(', ')}` });
            }
        }
        // Allow status update (e.g., FOUND to RETURNED, LOST to FOUND, CLAIMED to RETURNED)
        if (status !== undefined) {
            if (Object.values(ItemStatus).includes(status)) {
                updateData.status = status;

                // Recalculate expiresAt if status changes to FOUND
                if (updateData.status === 'FOUND' && existingItem.status !== 'FOUND') {
                    updateData.expiresAt = new Date();
                    updateData.expiresAt.setDate(updateData.expiresAt.getDate() + 90); // 90 days from now (adjust duration as needed)
                }
                // If status changes FROM FOUND to something else, clear expiresAt
                if (existingItem.status === 'FOUND' && updateData.status !== 'FOUND') {
                    updateData.expiresAt = null;
                }
                // If status changes to CLAIMED, set claimedBy to the current user (if not already set)
                if (updateData.status === 'CLAIMED' && !existingItem.claimedById) {
                    // You might want more complex logic here, e.g., preventing a user from claiming their own item
                    // or requiring confirmation steps. For now, basic assignment.
                    updateData.claimedBy = { connect: { id: userId } };
                }
                // If status changes FROM CLAIMED, maybe clear claimedBy? (Optional, depends on flow)
                // if (existingItem.status === 'CLAIMED' && updateData.status !== 'CLAIMED') {
                //      updateData.claimedBy = { disconnect: true }; // Assuming your schema supports disconnect
                // }


            } else {
                // Clean up newly uploaded files before returning error
                if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
                if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
                return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${Object.values(Prisma.ItemStatus).join(', ')}` });
            }
        }


        // Handle Image Updates/Removal
        // Front Image
        if (newFiles?.imageUrlFront?.[0]?.path) {
            // New front image uploaded, mark old one for deletion if it exists
            if (existingItem.imageUrlFront) filesToDelete.push(existingItem.imageUrlFront);
            updateData.imageUrlFront = newFiles.imageUrlFront[0].path; // Store new internal path
        } else if (removeImageUrlFront === 'true') { // Explicit request to remove front image
            // Mark old one for deletion if it exists, set field to null
            if (existingItem.imageUrlFront) filesToDelete.push(existingItem.imageUrlFront);
            updateData.imageUrlFront = null;
        }
        // Note: If neither a new file is uploaded nor remove flag is true, the existing imageUrlFront remains untouched.

        // Back Image
        if (newFiles?.imageUrlBack?.[0]?.path) {
            // New back image uploaded, mark old one for deletion if it exists
            if (existingItem.imageUrlBack) filesToDelete.push(existingItem.imageUrlBack);
            updateData.imageUrlBack = newFiles.imageUrlBack[0].path; // Store new internal path
        } else if (removeImageUrlBack === 'true') { // Explicit request to remove back image
            // Mark old one for deletion if it exists, set field to null
            if (existingItem.imageUrlBack) filesToDelete.push(existingItem.imageUrlBack);
            updateData.imageUrlBack = null;
        }
        // Note: If neither a new file is uploaded nor remove flag is true, the existing imageUrlBack remains untouched.


        // If no fields are provided for update, return a 400 or 200 with a message
        if (Object.keys(updateData).length === 0) {
            // Clean up newly uploaded files if no update data was valid
            if (newFiles?.imageUrlFront?.[0]?.path) deleteFile(newFiles.imageUrlFront[0].path);
            if (newFiles?.imageUrlBack?.[0]?.path) deleteFile(newFiles.imageUrlBack[0].path);
            return res.status(400).json({ error: "No valid fields provided for update." });
        }

        // 4. Perform the update in the database
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: updateData,
            // Select fields for the response, including reporter/claimer if needed
            select: {
                id: true,
                title: true,
                description: true,
                category: true,
                location: true,
                imageUrlFront: true, // Fetch internal paths
                imageUrlBack: true,   // Fetch internal paths
                status: true,
                createdAt: true,
                updatedAt: true,
                expiresAt: true,
                reportedBy: { // Include reporter details in response
                    select: { id: true, name: true, email: true, phone: true } // Select fields you want to expose
                },
                claimedBy: { // Include claimer details in response if claimedBy exists
                    select: { id: true, name: true, email: true, phone: true } // Select fields you want to expose
                }
            },
        });

        // 5. Delete old files AFTER successful database update
        filesToDelete.forEach(filePath => deleteFile(filePath));

        // 6. Format response with public image URLs and potentially censor user info
        const responseItem = {
            ...updatedItem,
            imageUrlFront: getImageUrl(updatedItem.imageUrlFront),
            imageUrlBack: getImageUrl(updatedItem.imageUrlBack),
            // Censor reportedBy/claimedBy info if needed for privacy in the response
            reportedBy: updatedItem.reportedBy ? { // Ensure reportedBy exists
                id: updatedItem.reportedBy.id, name: updatedItem.reportedBy.name, email: updatedItem.reportedBy.email, phone: updatedItem.reportedBy.phone
            } : null,
            claimedBy: updatedItem.claimedBy ? { // Ensure claimedBy exists
                id: updatedItem.claimedBy.id, name: updatedItem.claimedBy.name, email: updatedItem.claimedBy.email, phone: updatedItem.claimedBy.phone
            } : null,
        };


        // TODO: Implement Audit Log for UPDATE_ITEM action
        // Example:
        // await prisma.auditLog.create({
        //     data: {
        //         userId: userId,
        //         itemId: updatedItem.id,
        //         action: 'UPDATE_ITEM', // Or UPDATE_ITEM_STATUS if only status changed
        //         details: `Updated item "${updatedItem.title}". Fields changed: ${Object.keys(updateData).join(', ')}. Updated by User ${userId}.`,
        //         ipAddress: req.ip, // Get IP from request
        //         userAgent: req.headers['user-agent'], // Get user agent from headers
        //     }
        // });

        // TODO: Implement Notification for item update (e.g., notify claimant if status becomes RETURNED)


        res.status(200).json({
            message: "Item updated successfully",
            item: responseItem,
        });

    } catch (error) {
        console.error("Error updating item:", error);

        // Clean up any NEWLY uploaded files if a database or processing error occurred *after* multer saved them
        // Note: Old files marked for deletion were handled after the successful DB update.
        if (newFiles?.imageUrlFront?.[0]?.path) {
            try { deleteFile(newFiles.imageUrlFront[0].path); } catch (e) { console.error("Error cleaning up newly uploaded front image:", e); }
        }
        if (newFiles?.imageUrlBack?.[0]?.path) {
            try { deleteFile(newFiles.imageUrlBack[0].path); } catch (e) { console.error("Error cleaning up newly uploaded back image:", e); }
        }

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: "Item not found." });
            }
            if (error.code === 'P2002') {
                return res.status(400).json({ error: "Unique constraint violation." });
            }
        }
        return res.status(500).json({ error: "Internal server error while updating item." });
    }
};



export const deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Fetch the existing item to check ownership and get image paths
        const existingItem = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                reportedById: true,
                imageUrlFront: true,
                imageUrlBack: true,
            },
        });

        if (!existingItem) {
            return res.status(404).json({ error: "Item not found." });
        }

        // Authorization Check
        const isOwner = existingItem.reportedById === userId;
        const isAdminOrSuperAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

        if (!isOwner && !isAdminOrSuperAdmin) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to delete this item." });
        }

        // Delete associated files if they exist
        if (existingItem.imageUrlFront) deleteFile(existingItem.imageUrlFront);
        if (existingItem.imageUrlBack) deleteFile(existingItem.imageUrlBack);

        // Delete the item from database
        await prisma.item.delete({
            where: { id: id },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                userId: userId,
                itemId: existingItem.id,
                action: 'DELETE_ITEM',
                details: `Deleted item "${existingItem.title}"`,
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
            }
        });

        return res.status(200).json({ message: "Item deleted successfully" });

    } catch (error) {
        console.error("Error deleting item:", error);

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: "Item not found." });
            }
        }
        return res.status(500).json({ error: "Internal server error while deleting item." });
    }
};


// --- ClaimItem function ---
export const claimItem = async (req, res) => {
    // Ensure req.user is available from requireSignin middleware
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const { id } = req.params; // Item ID from URL parameters
        const userId = req.user.id; // ID of the user attempting to claim

        // 1. Fetch the item and necessary details
        const item = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true, // Need current status
                reportedById: true, // Need reporter ID
                claimedById: true, // Need current claimant ID
                title: true, // For notification/audit logs
            },
        });

        // 2. Validate item existence
        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        // 3. Validate item status - only FOUND items can be claimed
        if (item.status !== ItemStatus.FOUND) {
            return res.status(400).json({ error: `Item cannot be claimed. Current status is ${item.status}.` });
        }

        // 4. Prevent claiming an item that is already CLAIMED
        if (item.claimedById) {
            return res.status(400).json({ error: "This item has already been claimed." });
        }

        // 5. Optional: Prevent the reporter from claiming their own item
        if (item.reportedById === userId) {
            return res.status(400).json({ error: "You cannot claim an item that you reported as found." });
        }


        // 6. Update the item status to CLAIMED and set claimedBy
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: {
                status: ItemStatus.CLAIMED,
                claimedBy: { connect: { id: userId } }, // Link the claiming user
                expiresAt: null, // Clear expiry date once claimed
            },
            select: { // Select fields for the response
                id: true,
                title: true,
                status: true,
                reportedBy: { // Include reporter details for potential notification trigger
                    select: { id: true, email: true, name: true }
                },
                claimedBy: { // Include claimant details in response
                    select: { id: true, name: true }
                }
            }
        });

        // 7. Create Audit Log for CLAIM_ITEM action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId, // User who performed the claim
                    itemId: updatedItem.id,
                    action: 'CLAIM_ITEM',
                    details: `Item "${updatedItem.title}" claimed by user ${userId}.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        } catch (auditError) {
            console.error("Failed to create audit log for claim:", auditError);
            // Continue execution even if audit log fails
        }

        // 8. Trigger Notification(s)
        // Notify the user who *reported* the found item that someone has claimed it
        if (updatedItem.reportedBy && updatedItem.reportedBy.id !== userId) { // Don't notify themselves if somehow they claimed it
            try {
                const claimantName = req.user.name; // Get claimant's name from req.user

                // Call the sendNotification service
                await sendNotification({
                    userId: updatedItem.reportedBy.id, // Notify the reporter
                    itemId: updatedItem.id,
                    type: NotificationType.ITEM_CLAIMED, // Use the correct enum value
                    message: `Your reported item "${updatedItem.title}" has been claimed by ${claimantName}. Please check your notifications for contact details.`, // Message for in-app/email/push body
                    pushTitle: `Item Claimed: "${updatedItem.title}"`, // Specific title for push
                    data: { // Optional data for push/in-app
                        itemId: updatedItem.id,
                        claimantName: claimantName,
                        claimantEmail: req.user.email // Include claimant email in data payload
                    }
                });

                console.log(`Notification triggered for item ${updatedItem.id} claim to reporter ${updatedItem.reportedBy.id}`);

            } catch (notificationError) {
                console.error("Failed to trigger notification/email for claimed item:", notificationError);
                // Continue execution even if notifications fail
            }
        }

        // You might also send a confirmation notification to the claimant
        try {
            await sendNotification({
                userId: userId, // The claimant
                itemId: updatedItem.id,
                type: NotificationType.ITEM_CLAIMED, // A new notification type
                message: `You have successfully claimed "${updatedItem.title}". The reporter has been notified to contact you.`,
            });
        } catch (notificationError) {
            console.error("Failed to trigger confirmation notification for claimant:", notificationError);
        }

        // 9. Send success response
        return res.status(200).json({
            message: "Item claimed successfully. The reporter has been notified.",
            item: { // Return only relevant fields in response
                id: updatedItem.id,
                title: updatedItem.title,
                status: updatedItem.status,
                claimedBy: { // Include minimal claimant details in response
                    id: updatedItem.claimedBy?.id,
                    name: updatedItem.claimedBy?.name
                }
            },
        });

    } catch (error) {
        console.error("Error claiming item:", error);

        // Handle specific Prisma errors
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { // Record not found
                return res.status(404).json({ error: "Item not found." });
            }
            if (error.code === 'P2002') { // Unique constraint violation (less likely here, but good practice)
                return res.status(400).json({ error: "Database constraint violation." });
            }
            // You could add more specific error handling for other Prisma errors here
        }
        return res.status(500).json({ error: "Internal server error while claiming item." });
    }
};




// --- getItems function (Finalized for Public/Admin Filtering) ---
// optionalSignin middleware ensures req.user is available if token is present
export const getItems = async (req, res) => {
    try {
        const userId = req.user?.id; // User ID (will be null for guests)
        const userRole = req.user?.role; // User Role (will be null for guests)
        const isAdminUser = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;


        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        let statusFilter = req.query.status; // Query param for status filtering
        const category = req.query.category; // Query param for category filtering
        const location = req.query.location; // Query param for location filtering
        const searchQuery = req.query.q; // Query param for search

        const skip = (page - 1) * limit;

        const whereConditions = [ ];// Array to build up conditions

        // --- Status Filtering Logic ---
        if (statusFilter) {
             if (Object.values(ItemStatus).includes(statusFilter)) {
                 whereConditions.push({ status: statusFilter }); // Add valid status filter
             } else if (isAdminUser && statusFilter === 'ALL') {
                 // Admin requested ALL statuses - do not add a status filter to whereConditions
             } else {
                 // Invalid status provided for a non-admin or status is not 'ALL' for an admin
                 return res.status(400).json({ error: `Invalid status filter: ${statusFilter}. Must be one of ${Object.values(ItemStatus).join(', ')}${isAdminUser ? " or 'ALL' (for admins)." : ""}.` });
             }
        } else {
             // No status filter provided in the query
             // Default behavior: Only show 'FOUND' items (for public or if admin doesn't specify)
             whereConditions.push({ status: ItemStatus.FOUND });
        }


        // --- Category Filtering ---
        if (category) {
             if (Object.values(ItemCategory).includes(category)) {
                  whereConditions.push({ category: category }); // Add valid category filter
             } else {
                  return res.status(400).json({ error: `Invalid category filter: ${category}. Must be one of ${Object.values(ItemCategory).join(', ')}` });
             }
        }


        // --- Location Filtering ---
        if (location) {
             if (Object.values(ItemLocation).includes(location)) {
                  whereConditions.push({ location: location }); // Add valid location filter
             } else {
                  return res.status(400).json({ error: `Invalid location filter: ${location}. Must be one of ${Object.values(ItemLocation).join(', ')}` });
             }
        }


        // --- Search Query ---
        if (searchQuery) {
            const searchCondition = {
                OR: [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { category: { contains: searchQuery, mode: 'insensitive' } },
                    { location: { contains: searchQuery, mode: 'insensitive' } },
                ]
            };
            whereConditions.push(searchCondition); // Add the search condition
        }

        // Combine all conditions using AND if there's more than one condition
        // If there's only one condition (or none if status='ALL' and no other filters),
        // Prisma uses it directly without needing `AND`.
        const finalWhere = whereConditions.length > 0 ? { AND: whereConditions } : {};
        // If statusFilter was 'ALL' and no other filters were provided, whereConditions will be empty, resulting in {} which is correct for fetching all items.


        // Fetch items with pagination, filtering, and sorting
        const items = await prisma.item.findMany({
            where: finalWhere, // Use the constructed 'where' object
            orderBy: { createdAt: 'desc' }, // Default sort
            skip: skip,
            take: limit,
            select: { // Select fields for performance and privacy
                id: true,
                title: true,
                description: true,
                category: true,
                location: true,
                imageUrlFront: true,
                imageUrlBack: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                expiresAt: true,
                reportedBy: { select: { id: true, name: true } }, // Minimal info
                // Consider adding claimedBy if needed in the list view for some roles/contexts
                // claimedBy: { select: { id: true, name: true } }
            },
        });

        // Get the total count of items matching the combined filter and search criteria
        const totalItems = await prisma.item.count({ where: finalWhere }); // Use the same 'where'
        const totalPages = Math.ceil(totalItems / limit);

        // Map items to include public image URLs
        const itemsWithPublicUrls = items.map(item => ({
            ...item,
            imageUrlFront: getImageUrl(item.imageUrlFront),
            imageUrlBack: getImageUrl(item.imageUrlBack),
            // Ensure reportedBy is not null before spreading/selecting
             reportedBy: item.reportedBy ? { id: item.reportedBy.id, name: item.reportedBy.name } : null,
             // Add claimedBy similarly if selected above
             // claimedBy: item.claimedBy ? { id: item.claimedBy.id, name: item.claimedBy.name } : null,
        }));


        return res.status(200).json({
            items: itemsWithPublicUrls,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
                query: searchQuery, // Echo search query
                statusFilter: statusFilter, // Echo status filter
                categoryFilter: category, // Echo category filter
                locationFilter: location, // Echo location filter
            },
        });

    } catch (error) {
        console.error("Error fetching items:", error);
         if (error instanceof Prisma.PrismaClientKnownRequestError) {
             // Add checks for specific Prisma error codes related to invalid input
             if (error.code === 'P2011' || error.code === 'P2000') { // P2011: Invalid enum value, P2000: Input data too large/invalid
                  return res.status(400).json({ error: "Invalid filter or search value provided." });
             }
             // You could add more specific error handling for other Prisma errors here
         }
        return res.status(500).json({ error: "Internal server error while fetching items." });
    }
};