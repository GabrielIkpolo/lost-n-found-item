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

export const getAuditLogs = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Fetch logs with User and Item details included
        const logs = await prisma.auditLog.findMany({
            skip: skip,
            take: limit,
            orderBy: { timestamp: 'desc' }, // Newest first
            include: {
                user: {
                    select: { name: true, email: true, role: true }
                },
                item: {
                    select: { title: true, id: true }
                }
            }
        });

        const totalLogs = await prisma.auditLog.count();

        res.json({
            logs,
            pagination: {
                totalItems: totalLogs,
                totalPages: Math.ceil(totalLogs / limit),
                currentPage: page,
                itemsPerPage: limit
            }
        });

    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};