import prisma from '../helpers/prisma.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Prisma, ItemCategory, ItemLocation, ItemStatus } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageStoragePath = path.join(__dirname, '../../fileStorage', 'images'); // Adjust path relative to controller

// Helper to get the static URL for a saved file path
const getImageUrl = (filePath) => {
    if (!filePath) return null;
    const fileName = path.basename(filePath);
    // Assumes your static server path is /api/images and files are in fileStorage/images
    return `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/images/${fileName}`;
};

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


export const getItems = async (req, res) => {
    try {
        // Extract query parameters for pagination, filtering, and search
        const page = parseInt(req.query.page, 10) || 1; // Default to page 1
        const limit = parseInt(req.query.limit, 10) || 10; // Default to 10 items per page
        const status = req.query.status; // Filter by status (e.g., 'FOUND', 'LOST')
        const category = req.query.category; // Filter by category
        const location = req.query.location; // Filter by location
        const searchQuery = req.query.q; // Add search query parameter

        const skip = (page - 1) * limit; // Calculate number of items to skip

        // Build the filter (where clause) for the Prisma query
        const where = {};

        // --- Add status filter ---
        // If a status query parameter is provided, validate and add it to the where clause.
        // Otherwise, default to only showing 'FOUND' items.
        if (status) {
            // Ensure the status is a valid enum value before adding to where
            // Correct: Use Prisma.ItemStatus
            if (Object.values(ItemStatus).includes(status)) {
                 where.status = status;
            } else {
                 // Handle invalid status input early
                 return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${Object.values(ItemStatus).join(', ')}` });
            }
        } else {
            // Default behavior: Only show 'FOUND' items publicly if no status filter is provided
             where.status = 'FOUND'; // Keep default filter for browsing
        }

        // --- Add category filter ---
        if (category) {
             // Correct: Use Prisma.ItemCategory
             if (Object.values(ItemCategory).includes(category)) {
                 where.category = category;
            } else {
                 // Handle invalid category input early
                 return res.status(400).json({ error: `Invalid category: ${category}. Must be one of ${Object.values(ItemCategory).join(', ')}` });
            }
        }

        // --- Add location filter ---
        if (location) {
             // Correct: Use Prisma.ItemLocation
             if (Object.values(ItemLocation).includes(location)) {
                 where.location = location;
            } else {
                 // Handle invalid location input early
                 return res.status(400).json({ error: `Invalid location: ${location}. Must be one of ${Object.values(ItemLocation).join(', ')}` });
            }
        }


        // --- Add search condition if searchQuery is provided ---
        if (searchQuery) {
            // Use 'OR' to search across multiple fields
            where.OR = [
                { title: { contains: searchQuery, mode: 'insensitive' } },
                { description: { contains: searchQuery, mode: 'insensitive' } },
                // Searching on enum fields requires matching the exact string value of the enum,
                // not necessarily part of the user-friendly display name. 'contains' might work if the enum value
                // is a substring of the search query (e.g., searching "ELECTRONICS" finds "ELECTRONICS_GADGETS").
                // If you want to search user-friendly names, you might need a mapping or rethink the search strategy for enums.
                { category: { contains: searchQuery, mode: 'insensitive' } }, // These search against the enum string values
                { location: { contains: searchQuery, mode: 'insensitive' } }, // These search against the enum string values
            ];
             // Note: The search here is applied *within* the existing filters (status, category, location).
             // E.g., if status is 'FOUND', search only happens on FOUND items.
        }


        // Build the order by clause (e.g., newest first)
        const orderBy = {
            createdAt: 'desc', // Default sort by newest first
        };

        // Fetch items with pagination, filtering, and sorting
        const items = await prisma.item.findMany({
            where: where, // Use the constructed where object
            orderBy: orderBy,
            skip: skip,
            take: limit, // Use take for the limit
             // Select specific fields for performance and privacy
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
                // Include reportedBy and claimedBy if needed for display in the list view
                 reportedBy: { // Optional: select minimal reporter info for list view privacy
                    select: {
                         id: true,
                         name: true, // Only expose name and ID in list view for privacy
                    }
                 },
                // claimedBy: { // Optional: select minimal claimer info for list view privacy
                //      select: {
                //          id: true,
                //          name: true, // Only expose name and ID
                //      }
                // }
            },
        });

        // Get the total count of items matching the combined filter and search criteria
        // Use the SAME where clause as the findMany query
        const totalItems = await prisma.item.count({
            where: where,
        });

        // Calculate total pages
        const totalPages = Math.ceil(totalItems / limit);

        // Map items to include public image URLs and clean up user info for list view
        const itemsWithPublicUrls = items.map(item => ({
            ...item,
            imageUrlFront: getImageUrl(item.imageUrlFront),
            imageUrlBack: getImageUrl(item.imageUrlBack),
             reportedBy: item.reportedBy ? { // Ensure reportedBy exists before mapping
                 id: item.reportedBy.id,
                 name: item.reportedBy.name // Explicitly include only desired fields
             } : null,
             // claimedBy: item.claimedBy ? { ... map claimedBy fields ... } : null, // Handle claimedBy similarly if included
        }));


       return res.status(200).json({
            items: itemsWithPublicUrls,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
                query: searchQuery // Echo the search query back
            },
        });

    } catch (error) {
        console.error("Error fetching items:", error);
        // Handle specific Prisma errors if needed, otherwise return generic 500
         // Check if it's a known Prisma error, potentially due to invalid input or database issues
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2011' || error.code === 'P2000') { // P2011: Invalid enum value, P2000: Input data too large/invalid
                 return res.status(400).json({ error: "Invalid filter or search value provided." });
            }
             // You could add more specific error handling for other Prisma errors here based on error.code
        }
        // Catch other unexpected errors (network, other code issues)
        return res.status(500).json({ error: "Internal server error while fetching items." });
    }
};


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