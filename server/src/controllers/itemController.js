import prisma from '../helpers/prisma.js';
import path from 'path';
import fs from 'fs';
import { Prisma, ItemCategory, ItemLocation, ItemStatus, UserRole, NotificationType, AuditAction } from '@prisma/client';
import { sendNotification } from '../services/notificationService.js';
import { fileURLToPath } from 'url';
import { uploadAndCreateFileRecord, deleteFileAndRecord } from '../services/fileService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const createItem = async (req, res) => {
    try {
        // req.body contains text fields
        // req.files contains file information from multer
        const { title, description, category, location, status } = req.body;
        const userId = req.user.id;

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
        if (!validStatuses.includes(status)) {
            // Clean up uploaded files if validation fails
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}` });
        }


        // Process uploaded files using uploadFile
        let fileRecordFront = null;
        let fileRecordBack = null;


        if (req.files?.imageUrlFront?.[0]) {
            fileRecordFront = await uploadAndCreateFileRecord(req, req.files.imageUrlFront[0]);
            console.log('🔼 Uploaded front image record →', fileRecordFront);
        }
        if (req.files?.imageUrlBack?.[0]) {
            fileRecordBack = await uploadAndCreateFileRecord(req, req.files.imageUrlBack[0]);
            console.log('🔼 Uploaded back image record →', fileRecordBack);
        }


        // Calculate expiry date for FOUND items
        let expiresAt = null;
        if (status === ItemStatus.FOUND) {
            // Example: Expires 90 days from creation
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now
        }

        // Prepare data for item creation, connecting the new file records via their IDs
        const newItemData = {
            title,
            description,
            category,
            location,
            status,
            reportedBy: { connect: { id: userId } },
            expiresAt,
        };

        if (fileRecordFront) {
            newItemData.imageUrlFront = { connect: { id: fileRecordFront.id } };
        }
        if (fileRecordBack) {
            newItemData.imageUrlBack = { connect: { id: fileRecordBack.id } };
        }

       
        const newItem = await prisma.item.create({
            data: newItemData,
            include: { // Include relations to get file URLs in the response
                reportedBy: { select: { id: true, name: true } },
                imageUrlFront: true, 
                imageUrlBack: true,  
            }
        });

        // Create Audit Log for CREATE_ITEM action
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId,
                    itemId: newItem.id,
                    action: AuditAction.CREATE_ITEM, // Use the enum value
                    details: `Item "${newItem.title}" reported by user ${userId} with status ${newItem.status}.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        } catch (auditError) {
            console.error("Failed to create audit log for create item:", auditError);
        }


        // --- Implement Notification for new item (e.g., notify admins?) ---
        // Option 1: Notify Admins about a new item
        // This would require fetching admins and looping through them, or having a system notification mechanism.
        // Let's add a simple console log placeholder for now and note that actual admin notification needs implementation.
        console.log(`Notification Idea: Notify admins about new item ${newItem.id} - "${newItem.title}"`);
        // Example if you had a way to get admin IDs:
        // const adminUsers = await prisma.user.findMany({ where: { OR: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }] } });
        // for (const adminUser of adminUsers) {
        //      await sendNotification({
        //          userId: adminUser.id,
        //          itemId: newItem.id,
        //          type: NotificationType.ITEM_REPORTED, // Assuming you add this type
        //          message: `A new item ("${newItem.title}", Status: ${newItem.status}) has been reported.`,
        //          pushTitle: 'New Item Reported',
        //          data: { itemId: newItem.id, status: newItem.status }
        //      });
        // }


        const responseItem = {
            ...newItem,
            imageUrlFront: newItem.imageUrlFront ? newItem.imageUrlFront.url : null,
            imageUrlBack: newItem.imageUrlBack ? newItem.imageUrlBack.url : null,
            // reportedBy: newItem.reportedBy ? { id: newItem.reportedBy.id, name: newItem.reportedBy.name } : null,
        };
        // We no longer need to keep the file ID relations in the final response
        delete responseItem.imageUrlFrontId;
        delete responseItem.imageUrlBackId;


        return res.status(201).json({
            message: "Item reported successfully",
            item: responseItem, // Return the item with public URLs
        });

    } catch (error) {
        console.error("Error creating item:", error);
        // This cleanup logic for temp files is still relevant if multer's diskStorage is used
        if (req.files?.imageUrlFront?.[0]?.path) {
            try { fs.unlinkSync(req.files.imageUrlFront[0].path); } catch (e) { console.error("Error cleaning up front image:", e); }
        }
        if (req.files?.imageUrlBack?.[0]?.path) {
            try { fs.unlinkSync(req.files.imageUrlBack[0].path); } catch (e) { console.error("Error cleaning up back image:", e); }
        }
        return res.status(500).json({ error: "Internal server error while creating item." });
    }
};




export const getItemDetails = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Item ID is required." });
        }

        // Fetch the item by ID
        const item = await prisma.item.findUnique({
            where: { id: id },
            include: {
                reportedBy: { select: { id: true, name: true, email: true, phone: true } },
                claimedBy: { select: { id: true, name: true, email: true, phone: true } },
                imageUrlFront: true, // Include the related File object
                imageUrlBack: true,  // Include the related File object
            }
        });

        // Handle item not found
        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        const responseItem = {
            ...item,
            imageUrlFront: item.imageUrlFront ? item.imageUrlFront.url : null,
            imageUrlBack: item.imageUrlBack ? item.imageUrlBack.url : null,
            // Censor reportedBy/claimedBy info if needed for privacy in the detail view
            reportedBy: item.reportedBy ? {
                id: item.reportedBy.id,
                name: item.reportedBy.name,
                email: item.reportedBy.email, 
                phone: item.reportedBy.phone, 
            } : null,
            claimedBy: item.claimedBy ? {
                id: item.claimedBy.id,
                name: item.claimedBy.name,
                email: item.claimedBy.email,
                phone: item.claimedBy.phone,
            } : null,
        };
        delete responseItem.imageUrlFrontId;
        delete responseItem.imageUrlBackId;

        return res.status(200).json(responseItem);

    } catch (error) {
        console.error("Error fetching item details:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Record not found (should be caught by !item check, but defensive)
            if (error.code === 'P2025') {
                return res.status(404).json({ error: "Item not found." });
            }
            // Invalid input data (e.g., malformed ID)
            if (error.code === 'P2000') {
                return res.status(400).json({ error: "Invalid Item ID format." });
            }
        }
        return res.status(500).json({ error: "Internal server error while fetching item details." });
    }
};


// --- updateItem function ---
export const updateItem = async (req, res) => {
    // Ensure req.user is available from requireSignin middleware
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    const newFiles = req.files;

    try {
        const { id } = req.params;
        const { title, description, category, location, status, removeImageUrlFront,
            removeImageUrlBack } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;


        // 1. Fetch the existing item to check ownership, get current image paths, and current status
        const existingItem = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                reportedById: true, title: true, claimedById: true, status: true,
                imageUrlFrontId: true, // Get the ID of the current file record
                imageUrlBackId: true,
            },
        });

        // Handle item not found
        if (!existingItem) {
            // Clean up any newly uploaded files if the item doesn't exist
            // This assumes multer uses diskStorage. If memoryStorage, there's no file to clean.
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(404).json({ error: "Item not found." });
        }

        // 2. Authorization Check: Is the user the owner or an Admin/Super_Admin?
        const isOwner = existingItem.reportedById === userId;
        // Note: UserRole is imported from '@prisma/client'
        const isAdminOrSuperAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

        // Owners can update their items, Admins can update any item
        if (!isOwner && !isAdminOrSuperAdmin) {
            if (req.files?.imageUrlFront?.[0]?.path) fs.unlinkSync(req.files.imageUrlFront[0].path);
            if (req.files?.imageUrlBack?.[0]?.path) fs.unlinkSync(req.files.imageUrlBack[0].path);
            return res.status(403).json({ error: "Forbidden: You do not have permission to update this item." });
        }


        // 3. Prepare update data object and handle image paths
        const updateData = {};
        const fileIdsToDelete = []; // Array to store paths of old files to delete AFTER db update


        const oldStatus = existingItem.status;
        let newStatus = oldStatus;

        // Add other fields if provided after status check
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
                newStatus = status; // Update newStatus tracker

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
                if (newFiles?.imageUrlFront?.[0]?.path) fs.unlinkSync(newFiles.imageUrlFront[0].path);
                if (newFiles?.imageUrlBack?.[0]?.path) fs.unlinkSync(newFiles.imageUrlBack[0].path);
                return res.status(400).json({ error: `Invalid status: ${status}. Must be one of ${Object.values(Prisma.ItemStatus).join(', ')}` });
            }
        }



        if (req.files?.imageUrlFront?.[0]) {
            if (existingItem.imageUrlFrontId) {
                fileIdsToDelete.push(existingItem.imageUrlFrontId);
            }
            const newFileRecord = await uploadAndCreateFileRecord(req, req.files.imageUrlFront[0]);
            updateData.imageUrlFrontId = newFileRecord.id; // Connect the new file by its ID
        } else if (removeImageUrlFront === 'true') {
            if (existingItem.imageUrlFrontId) {
                fileIdsToDelete.push(existingItem.imageUrlFrontId);
                updateData.imageUrlFrontId = null; // Disconnect the file
            }
        }

        if (req.files?.imageUrlBack?.[0]) {
            if (existingItem.imageUrlBackId) {
                fileIdsToDelete.push(existingItem.imageUrlBackId);
            }
            const newFileRecord = await uploadAndCreateFileRecord(req, req.files.imageUrlBack[0]);
            updateData.imageUrlBackId = newFileRecord.id;
        } else if (removeImageUrlBack === 'true') {
            if (existingItem.imageUrlBackId) {
                fileIdsToDelete.push(existingItem.imageUrlBackId);
                updateData.imageUrlBackId = null;
            }
        }

        // Note: If neither a new file is uploaded nor remove flag is true, the existing imageUrlBack remains untouched.
        // If no fields are provided for update, return a 400 or 200 with a message
        if (Object.keys(updateData).length === 0) {
            // Clean up newly uploaded files if no update data was valid
            if (newFiles?.imageUrlFront?.[0]?.path) fs.unlinkSync(newFiles.imageUrlFront[0].path);
            if (newFiles?.imageUrlBack?.[0]?.path) fs.unlinkSync(newFiles.imageUrlBack[0].path);
            return res.status(400).json({ error: "No valid fields provided for update." });
        }


        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: updateData,
            include: {
                reportedBy: { select: { id: true, name: true, email: true, phone: true } },
                claimedBy: { select: { id: true, name: true, email: true, phone: true } },
                imageUrlFront: true,
                imageUrlBack: true,
            },
        });

        // Delete old files from storage and DB AFTER the item update is successful
        for (const fileId of fileIdsToDelete) {
            await deleteFileAndRecord(fileId);
        }

        // Create Audit Log for UPDATE_ITEM action
        try {
            const changedFields = Object.keys(updateData).filter(key => key !== 'updatedAt');
            if (changedFields.length > 0) { // Only log if actual fields were updated (excluding status change handled below)
                await prisma.auditLog.create({
                    data: {
                        userId: userId,
                        itemId: updatedItem.id,
                        action: AuditAction.UPDATE_ITEM, // Using the enum value
                        details: `Item "${updatedItem.title}" updated by user ${userId}. Fields changed: ${changedFields.join(', ')}.`,
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'],
                    }
                });
            }

            // Add a separate audit log for status change if it occurred
            if (oldStatus !== newStatus) {
                try {
                    await prisma.auditLog.create({
                        data: {
                            userId: userId,
                            itemId: updatedItem.id,
                            action: AuditAction.UPDATE_ITEM_STATUS, // Using the enum value
                            details: `Item "${updatedItem.title}" status changed from ${oldStatus} to ${newStatus} by user ${userId}.`,
                            ipAddress: req.ip,
                            userAgent: req.headers['user-agent'],
                        }
                    });
                } catch (statusAuditError) {
                    console.error("Failed to create status update audit log:", statusAuditError);
                }
            }
        } catch (auditError) {
            console.error("Failed to create general update item audit log:", auditError);
        }


        // --- Implement Notification for item status update ---
        // Notify relevant parties if status changes
        if (oldStatus !== newStatus) {
            // Notify reporter if status changes to RETURNED (regardless of original status)
            if (newStatus === ItemStatus.RETURNED && updatedItem.reportedBy) {
                try {
                    const message = oldStatus === ItemStatus.LOST
                        ? `Your lost item "${updatedItem.title}" has been found and marked as RETURNED.` // If it was LOST and now RETURNED
                        : `Your reported item "${updatedItem.title}" has been marked as RETURNED.`; // If it was FOUND/CLAIMED and now RETURNED

                    // Send notification to the original reporter
                    await sendNotification({
                        userId: updatedItem.reportedBy.id,
                        itemId: updatedItem.id,
                        type: NotificationType.ITEM_UPDATED, // ITEM_UPDATED seems appropriate for status changes
                        message: message,
                        pushTitle: `Item Returned: "${updatedItem.title}"`,
                        data: { itemId: updatedItem.id, status: updatedItem.status }
                    });
                    console.log(`Notification sent to reporter ${updatedItem.reportedBy.id} for item ${updatedItem.id} status RETURNED.`);

                } catch (notificationError) {
                    console.error("Failed to trigger notification for item status RETURNED to reporter:", notificationError);
                }
            }
            // Notify claimant if status changes to RETURNED (if item was CLAIMED)
            // Note: This assumes claimedBy is still linked, which it should be unless manually cleared.
            if (newStatus === ItemStatus.RETURNED && oldStatus === ItemStatus.CLAIMED && updatedItem.claimedBy) {
                try {
                    const message = `The item "${updatedItem.title}" you claimed has now been marked as RETURNED.`;
                    // Send notification to the claimant
                    await sendNotification({
                        userId: updatedItem.claimedBy.id,
                        itemId: updatedItem.id,
                        type: NotificationType.ITEM_UPDATED, // Or a specific type like ITEM_RETURN_CONFIRMED
                        message: message,
                        pushTitle: `Item Returned: "${updatedItem.title}"`,
                        data: { itemId: updatedItem.id, status: updatedItem.status }
                    });
                    console.log(`Notification sent to claimant ${updatedItem.claimedBy.id} for item ${updatedItem.id} status RETURNED.`);

                } catch (notificationError) {
                    console.error("Failed to trigger notification for item status RETURNED to claimant:", notificationError);
                }
            }
            // Add notifications for other status changes if needed (e.g., LOST to FOUND, FOUND to LOST, CLAIMED to LOST/FOUND/ARCHIVED by admin override)
            if (newStatus === ItemStatus.FOUND && oldStatus === ItemStatus.LOST && updatedItem.reportedBy) {
                try {
                    const message = `Your lost item "${updatedItem.title}" has been marked as FOUND. Check the app for details.`;
                    await sendNotification({
                        userId: updatedItem.reportedBy.id,
                        itemId: updatedItem.id,
                        type: NotificationType.ITEM_UPDATED, // Or ITEM_FOUND_UPDATE
                        message: message,
                        pushTitle: `Item Status Update: Found`,
                        data: { itemId: updatedItem.id, status: updatedItem.status }
                    });
                    console.log(`Notification sent to reporter ${updatedItem.reportedBy.id} for item ${updatedItem.id} status FOUND.`);
                } catch (notificationError) {
                    console.error("Failed to trigger notification for item status FOUND to reporter:", notificationError);
                }
            }
            // Notify the reporter if their FOUND item is ARCHIVED (by admin or automated task)
            if (newStatus === ItemStatus.ARCHIVED && updatedItem.reportedBy) {
                try {
                    const message = `Your reported item "${updatedItem.title}" has been archived as it was unclaimed.`;
                    await sendNotification({
                        userId: updatedItem.reportedBy.id,
                        itemId: updatedItem.id,
                        type: NotificationType.ITEM_UPDATED, // Or ITEM_ARCHIVED
                        message: message,
                        pushTitle: `Item Archived: "${updatedItem.title}"`,
                        data: { itemId: updatedItem.id, status: updatedItem.status }
                    });
                    console.log(`Notification sent to reporter ${updatedItem.reportedBy.id} for item ${updatedItem.id} status ARCHIVED.`);
                } catch (notificationError) {
                    console.error("Failed to trigger notification for item status ARCHIVED to reporter:", notificationError);
                }
            }

            // You might also want to notify the reporter if their FOUND item is updated by an admin (e.g., description refined, image added/removed)
            // if (isOwner && oldStatus === newStatus && changedFields.length > 0 && updatedItem.reportedBy) {
            //      try {
            //           const message = `Your reported item "${updatedItem.title}" has been updated.`;
            //            await sendNotification({
            //                userId: updatedItem.reportedBy.id,
            //                itemId: updatedItem.id,
            //                type: NotificationType.ITEM_UPDATED, // Or ITEM_DETAILS_UPDATED
            //                message: message,
            //                pushTitle: `Item Updated: "${updatedItem.title}"`,
            //                data: { itemId: updatedItem.id }
            //            });
            //           console.log(`Notification sent to reporter ${updatedItem.reportedBy.id} for item ${updatedItem.id} details update.`);
            //      } catch (notificationError) {
            //           console.error("Failed to trigger notification for item details update to reporter:", notificationError);
            //      }
            // }

        }


        // 6. Format response with public image URLs and potentially censor user info
        const responseItem = {
            ...updatedItem,
            imageUrlFront: updatedItem.imageUrlFront ? updatedItem.imageUrlFront.url : null,
            imageUrlBack: updatedItem.imageUrlBack ? updatedItem.imageUrlBack.url : null,
        };
        delete responseItem.imageUrlFrontId;
        delete responseItem.imageUrlBackId;


        // TODO: Implement Audit Log for UPDATE_ITEM action
        // Example:
        // await prisma.auditLog.create({
        //     data: {
        //         userId: userId,
        //         itemId: updatedItem.id,
        //         action: AuditAction.UPDATE_ITEM, // Or UPDATE_ITEM_STATUS if only status changed
        //         details: `Updated item "${updatedItem.title}". Fields changed: ${Object.keys(updateData).join(', ')}. Updated by User ${userId}.`,
        //         ipAddress: req.ip, // Get IP from request
        //         userAgent: req.headers['user-agent'], // Get user agent from headers
        //     }
        // });

        res.status(200).json({
            message: "Item updated successfully",
            item: responseItem,
        });

    } catch (error) {
        console.error("Error updating item:", error);
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
                title: true, // For audit log
                reportedById: true,
                imageUrlFrontId: true, 
                imageUrlBackId: true,  
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

        // Delete associated files from storage and the database BEFORE deleting the item
        if (existingItem.imageUrlFrontId) {
            await deleteFileAndRecord(existingItem.imageUrlFrontId);
        }
        if (existingItem.imageUrlBackId) {
            await deleteFileAndRecord(existingItem.imageUrlBackId);
        }

        // Delete the item from the database
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
        const { id } = req.params; 
        const userId = req.user.id; 

        // 1. Fetch the item and necessary details
        const item = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true, 
                reportedById: true, 
                claimedById: true, 
                title: true, 
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

        const whereConditions = [];// Array to build up conditions


        // --- Status Filtering Logic ---
        //====================
        if (statusFilter) {
            if (isAdminUser && statusFilter === 'ALL') {
                // If admin and requesting 'ALL', bypass status filtering
                console.log('Admin requesting all item statuses.');
            } else if (Object.values(ItemStatus).includes(statusFilter)) {

                whereConditions.push({ status: statusFilter });
            } else {
                return res.status(400).json({ error: `Invalid status filter: ${statusFilter}. Must be one of ${Object.values(ItemStatus).join(', ')}${isAdminUser ? " or 'ALL' (for admins)." : ""}.` });
            }
        } else {
            console.log('No status filter provided, defaulting to FOUND.');
            whereConditions.push({ status: ItemStatus.FOUND });
        }
        //====================

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

        const finalWhere = whereConditions.length > 0 ? { AND: whereConditions } : {};

        if (searchQuery) {
            whereConditions.push({
                OR: [
                    {
                        title: {
                            contains: searchQuery,
                            mode: 'insensitive'
                        }
                    },
                    {
                        description: {
                            contains: searchQuery,
                            mode: 'insensitive'
                        }
                    }
                ]
            });
        }

       
        const items = await prisma.item.findMany({
            where: finalWhere,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            select: { // Select specific fields plus the related file objects
                id: true,
                title: true,
                description: true,
                category: true,
                location: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                expiresAt: true,
                reportedBy: { select: { id: true, name: true } },
                claimedBy: { select: { id: true, name: true } },
                imageUrlFront: true, // Include the full File object
                imageUrlBack: true,  // Include the full File object
            },
        });

        // Get the total count of items matching the combined filter and search criteria
        const totalItems = await prisma.item.count({ where: finalWhere }); // Use the same 'where'
        const totalPages = Math.ceil(totalItems / limit);

       
        const itemsWithPublicUrls = items.map(item => ({
            ...item,
            imageUrlFront: item.imageUrlFront ? item.imageUrlFront.url : null,
            imageUrlBack: item.imageUrlBack ? item.imageUrlBack.url : null,
        }));


        return res.status(200).json({
            items: itemsWithPublicUrls,
            pagination: {
                totalItems: totalItems,
                totalPages: totalPages,
                currentPage: page,
                itemsPerPage: limit,
                query: searchQuery,
                statusFilter: statusFilter,
                categoryFilter: category,
                locationFilter: location,
            },
        });

    } catch (error) {
        console.error("Error fetching items:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Add checks for specific Prisma error codes related to invalid input
            if (error.code === 'P2011' || error.code === 'P2000') { // P2011: Invalid enum value, P2000: Input data too large/invalid
                return res.status(400).json({ error: "Invalid filter or search value provided." });
            }
        }
        return res.status(500).json({ error: "Internal server error while fetching items." });
    }
};

// --- New Controller function to mark item as RETURNED ---
export const markItemReturned = async (req, res) => {
    // Ensure req.user is available from requireSignin middleware
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const { id } = req.params; // Item ID from URL parameters
        const userId = req.user.id; // ID of the user attempting the action
        const userRole = req.user.role; // Role of the user

        // 1. Fetch the item and necessary details
        const item = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true,
                reportedById: true, // Need reporter ID
                claimedById: true,  // Need claimant ID if applicable
                title: true,
            },
        });

        // 2. Validate item existence
        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        // 3. Authorization Check: Only the reportedBy user OR Admin/Super_Admin can mark as RETURNED
        const isOwner = item.reportedById === userId;
        const isAdminOrSuperAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;

        if (!isOwner && !isAdminOrSuperAdmin) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to mark this item as returned." });
        }

        // 4. Status Validation: Can only mark as RETURNED if the status is CLAIMED (or maybe LOST if found independently?)
        // Let's enforce that only CLAIMED items can be marked RETURNED via this endpoint for now.
        // If a LOST item is found independently, the reporter would likely use the general /items/:id PUT endpoint to update status.
        if (item.status !== ItemStatus.CLAIMED) {
            return res.status(400).json({ error: `Item cannot be marked as returned. Current status is ${item.status}.` });
        }

        // 5. Update the item status to RETURNED
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: {
                status: ItemStatus.RETURNED,
                // Optionally, clear claimedBy here if you want RETURNED items
                // to no longer be linked to the claimant in the database,
                // or keep it to show who it was returned to. Let's keep it for now.
                // claimedBy: { disconnect: true }, // Example to clear claimedBy
            },
            select: { // Select fields for response and notifications
                id: true,
                title: true,
                status: true,
                reportedBy: { select: { id: true, email: true, name: true } },
                claimedBy: { select: { id: true, email: true, name: true } },
            }
        });

        // 6. Create Audit Log
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId,
                    itemId: updatedItem.id,
                    action: AuditAction.UPDATE_ITEM_STATUS, // Or a new enum like MARK_ITEM_RETURNED
                    details: `Item "${updatedItem.title}" status changed to RETURNED by user ${userId}.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        } catch (auditError) {
            console.error("Failed to create audit log for mark returned:", auditError);
        }

        // 7. Trigger Notifications
        // Notify the claimant that the item has been marked as returned by the reporter
        if (updatedItem.claimedBy && updatedItem.claimedBy.id !== userId) { // Ensure there's a claimant and it's not the user marking it
            try {
                await sendNotification({
                    userId: updatedItem.claimedBy.id, // Notify the claimant
                    itemId: updatedItem.id,
                    type: NotificationType.ITEM_UPDATED, // Or a specific type
                    message: `The item "${updatedItem.title}" you claimed has been marked as RETURNED by the reporter.`,
                    pushTitle: `Item Returned: "${updatedItem.title}"`,
                    data: { itemId: updatedItem.id, status: updatedItem.status }
                });
                console.log(`Notification triggered to claimant ${updatedItem.claimedBy.id} for item ${updatedItem.id} status RETURNED.`);
            } catch (notificationError) {
                console.error("Failed to trigger notification to claimant for mark returned:", notificationError);
            }
        }
        // You might also notify the reporter for confirmation, though less critical

        // 8. Send success response
        return res.status(200).json({
            message: "Item marked as returned successfully.",
            item: { // Return essential info
                id: updatedItem.id,
                title: updatedItem.title,
                status: updatedItem.status,
                claimedBy: updatedItem.claimedBy ? { id: updatedItem.claimedBy.id, name: updatedItem.claimedBy.name } : null,
            },
        });

    } catch (error) {
        console.error("Error marking item as returned:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') return res.status(404).json({ error: "Item not found." });
            if (error.code === 'P2000') return res.status(400).json({ error: "Invalid Item ID format." });
            // Handle other Prisma errors
        }
        return res.status(500).json({ error: "Internal server error while marking item as returned." });
    }
};

// --- New Controller function to confirm receiving a claimed item ---
export const confirmItemReceived = async (req, res) => {
    // Ensure req.user is available from requireSignin middleware
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const { id } = req.params; // Item ID
        const userId = req.user.id; // ID of the user confirming receipt

        // 1. Fetch the item and necessary details
        const item = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true,
                reportedById: true, // Need reporter ID
                claimedById: true,  // Need claimant ID
                title: true,
            },
        });

        // 2. Validate item existence
        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        // 3. Authorization Check: Only the claimedBy user OR Admin/Super_Admin can confirm receipt
        const isClaimant = item.claimedById === userId;
        const isAdminOrSuperAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;

        if (!isClaimant && !isAdminOrSuperAdmin) {
            return res.status(403).json({ error: "Forbidden: You do not have permission to confirm receipt of this item." });
        }
        // Also ensure the item *is* actually claimed by this user if they are the claimant
        if (isClaimant && item.claimedById !== userId) {
            // This is a redundant check if isClaimant is true, but defensive
            return res.status(403).json({ error: "Forbidden: You can only confirm items you have claimed." });
        }


        // 4. Status Validation: Can only confirm receipt if the status is CLAIMED
        if (item.status !== ItemStatus.CLAIMED) {
            return res.status(400).json({ error: `Item cannot be confirmed as received. Current status is ${item.status}.` });
        }

        // 5. Update the item status to RETURNED
        // NOTE: Confirming receipt by the claimant is equivalent to the item being RETURNED.
        // The backend should transition to RETURNED status.
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: {
                status: ItemStatus.RETURNED,
                // Keep claimedBy as is
            },
            select: { // Select fields for response and notifications
                id: true,
                title: true,
                status: true,
                reportedBy: { select: { id: true, email: true, name: true } },
                claimedBy: { select: { id: true, email: true, name: true } },
            }
        });


        // 6. Create Audit Log
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId,
                    itemId: updatedItem.id,
                    action: AuditAction.UPDATE_ITEM_STATUS, // Or a new enum like CONFIRM_ITEM_RECEIVED
                    details: `Item "${updatedItem.title}" status changed to RETURNED (confirmed received) by user ${userId}.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        } catch (auditError) {
            console.error("Failed to create audit log for confirm received:", auditError);
        }


        // 7. Trigger Notifications
        // Notify the reporter that the claimant has confirmed receiving the item
        if (updatedItem.reportedBy && updatedItem.reportedBy.id !== userId) { // Ensure there's a reporter and it's not the user confirming
            try {
                await sendNotification({
                    userId: updatedItem.reportedBy.id, // Notify the reporter
                    itemId: updatedItem.id,
                    type: NotificationType.ITEM_UPDATED, // Or a specific type like ITEM_RECEIPT_CONFIRMED
                    message: `The item "${updatedItem.title}" has been confirmed as received by the claimant, ${updatedItem.claimedBy?.name || 'the claimant'}.`,
                    pushTitle: `Item Confirmed Received: "${updatedItem.title}"`,
                    data: { itemId: updatedItem.id, status: updatedItem.status }
                });
                console.log(`Notification triggered to reporter ${updatedItem.reportedBy.id} for item ${updatedItem.id} confirmed received.`);
            } catch (notificationError) {
                console.error("Failed to trigger notification to reporter for confirm received:", notificationError);
            }
        }
        // You might also send a confirmation notification to the user who confirmed receipt

        // 8. Send success response
        return res.status(200).json({
            message: "Item confirmed as received and marked as returned.",
            item: { // Return essential info
                id: updatedItem.id,
                title: updatedItem.title,
                status: updatedItem.status,
                reportedBy: updatedItem.reportedBy ? { id: updatedItem.reportedBy.id, name: updatedItem.reportedBy.name } : null,
                claimedBy: updatedItem.claimedBy ? { id: updatedItem.claimedBy.id, name: updatedItem.claimedBy.name } : null,
            },
        });

    } catch (error) {
        console.error("Error confirming item received:", error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') return res.status(404).json({ error: "Item not found." });
            if (error.code === 'P2000') return res.status(400).json({ error: "Invalid Item ID format." });
            // Handle other Prisma errors
        }
        return res.status(500).json({ error: "Internal server error while confirming item received." });
    }
};


// --- New Controller function to cancel a claim on an item ---

export const cancelItemClaim = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: "Authentication required." });
    }

    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Fetch item AND the current claimant details before we clear them
        const item = await prisma.item.findUnique({
            where: { id: id },
            select: {
                id: true,
                status: true,
                reportedById: true, 
                claimedById: true, // This is the ID we are about to clear
                title: true,
            },
        });

        if (!item) {
            return res.status(404).json({ error: "Item not found." });
        }

        // 2. Authorization Check
        const isClaimant = item.claimedById === userId;
        const isReporter = item.reportedById === userId;
        const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

        if (!isClaimant && !isReporter && !isAdmin) {
            return res.status(403).json({ error: "Forbidden: Access denied." });
        }

        if (item.status !== 'CLAIMED') {
            return res.status(400).json({ error: `Item is currently ${item.status}` });
        }

        // 3. Reset Expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 90);

        // 4. Update the Item (Clearing the active claim)
        const updatedItem = await prisma.item.update({
            where: { id: id },
            data: {
                status: 'FOUND',
                claimedBy: { disconnect: true }, // This is the only line needed to clear the claim
                expiresAt: expiresAt,
            },
            include: {
                reportedBy: { select: { id: true, email: true, name: true } }
            }
        });

        // 5. THE RECORD: Save the history into the AuditLog
        // This ensures you never lose the record of who previously claimed it.
        try {
            await prisma.auditLog.create({
                data: {
                    userId: userId, // Who performed the cancellation
                    itemId: updatedItem.id,
                    action: 'UPDATE_ITEM_STATUS', 
                    details: `Claim by user (ID: ${item.claimedById}) was cancelled by ${req.user.role} (ID: ${userId}). Item returned to FOUND status.`,
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'],
                }
            });
        } catch (auditError) {
            console.error("Failed to create archival audit log:", auditError);
        }

        // 6. Notifications (Using 'item' from step 1 for the claimant)
        // Notify Reporter
        if (updatedItem.reportedBy?.id && updatedItem.reportedBy.id !== userId) {
            await sendNotification({
                userId: updatedItem.reportedBy.id,
                itemId: updatedItem.id,
                type: 'ITEM_UPDATED',
                message: `The claim on your item "${updatedItem.title}" was cancelled. It is available again.`,
            });
        }

        // Notify the OLD Claimant (using the ID we saved in step 1)
        if (item.claimedById && item.claimedById !== userId) {
             await sendNotification({
                userId: item.claimedById,
                itemId: updatedItem.id,
                type: 'ITEM_UPDATED',
                message: `Your claim on "${updatedItem.title}" has been cancelled.`,
            });
        }

        return res.status(200).json({
            message: "Item claim cancelled successfully. Status reset to FOUND.",
            item: {
                ...updatedItem,
                claimedBy: null, // UI knows it's now available
            },
        });

    } catch (error) {
        console.error("Error in cancelItemClaim:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
};