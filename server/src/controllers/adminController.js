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


// --- Get All Reports ---
export const getReports = async (req, res) => {
    try {
        const reports = await prisma.report.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } }, // Who reported it
                item: { select: { id: true, title: true, status: true, imageUrlFront: true } } // The item reported
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// --- Resolve Report (Dismiss) ---
// If the item is bad, the admin uses deleteItem. If the report is bad, they use this to delete the report.
export const dismissReport = async (req, res) => {
    try {
        const { id } = req.params; // Report ID
        await prisma.report.delete({ where: { id } });
        res.json({ message: "Report dismissed." });
    } catch (error) {
        console.error("Error dismissing report:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// --- Get System Analytics ---
export const getSystemStats = async (req, res) => {
    try {
        // Run queries in parallel for performance
        const [
            totalUsers,
            totalItems,
            itemsByStatus,
            itemsByCategory,
            totalReports,
            recentActivity
        ] = await prisma.$transaction([
            // 1. Total Users
            prisma.user.count(),
            
            // 2. Total Items
            prisma.item.count(),
            
            // 3. Items grouped by Status (e.g., LOST: 10, FOUND: 5, CLAIMED: 2)
            prisma.item.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),

            // 4. Items grouped by Category
            prisma.item.groupBy({
                by: ['category'],
                _count: { _all: true }
            }),

            // 5. Pending Reports
            prisma.report.count(),

            // 6. Recent Audit Logs (Last 5 actions)
            prisma.auditLog.findMany({
                take: 5,
                orderBy: { timestamp: 'desc' },
                include: { user: { select: { name: true } } }
            })
        ]);

        // Calculate "Success Rate" (Items Returned / Total Items)
        const returnedCount = itemsByStatus.find(s => s.status === 'RETURNED')?._count._all || 0;
        const claimedCount = itemsByStatus.find(s => s.status === 'CLAIMED')?._count._all || 0;
        const successRate = totalItems > 0 ? Math.round(((returnedCount + claimedCount) / totalItems) * 100) : 0;

        res.json({
            counts: {
                users: totalUsers,
                items: totalItems,
                reports: totalReports,
                successRate: successRate
            },
            statusDistribution: itemsByStatus.map(s => ({ name: s.status, value: s._count._all })),
            categoryDistribution: itemsByCategory.map(c => ({ name: c.category, value: c._count._all })),
            recentActivity
        });

    } catch (error) {
        console.error("Error fetching system stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};