import prisma from '../helpers/prisma.js';

// Get System Settings (Create default if not exists)
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await prisma.systemSetting.findFirst();

        if (!settings) {
            settings = await prisma.systemSetting.create({
                data: {
                    foundItemExpiryDays: 90,
                    preArchivalNotificationDays: 7,
                    defaultItemsPerPage: 10
                }
            });
        }

        res.json(settings);
    } catch (error) {
        console.error("Error fetching system settings:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Update System Settings
export const updateSystemSettings = async (req, res) => {
    try {
        const { foundItemExpiryDays, preArchivalNotificationDays, defaultItemsPerPage } = req.body;

        // Find the existing record to get its ID
        let settings = await prisma.systemSetting.findFirst();

        if (settings) {
            // Update existing
            settings = await prisma.systemSetting.update({
                where: { id: settings.id },
                data: {
                    foundItemExpiryDays: parseInt(foundItemExpiryDays),
                    preArchivalNotificationDays: parseInt(preArchivalNotificationDays),
                    defaultItemsPerPage: parseInt(defaultItemsPerPage)
                }
            });
        } else {
            // Create new (rare case)
            settings = await prisma.systemSetting.create({
                data: {
                    foundItemExpiryDays: parseInt(foundItemExpiryDays),
                    preArchivalNotificationDays: parseInt(preArchivalNotificationDays),
                    defaultItemsPerPage: parseInt(defaultItemsPerPage)
                }
            });
        }

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_ITEM', 
                details: `System Settings updated by Super Admin.`,
            }
        });

        res.json({ message: "Settings updated successfully", settings });

    } catch (error) {
        console.error("Error updating system settings:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};