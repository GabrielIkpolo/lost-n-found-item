import prisma from '../helpers/prisma.js';
import { ItemStatus, AuditAction, Prisma } from '@prisma/client';
import cron from 'node-cron'; // Import cron library


/**
 * Archives items with status 'FOUND' that have passed their 'expiresAt' date.
 */
const archiveExpiredItems = async () => {
    console.log('Automated Archival Task: Starting...');
    const now = new Date();

    try {
        // Find items that are FOUND and have expired
        const expiredItems = await prisma.item.findMany({
            where: {
                status: ItemStatus.FOUND,
                expiresAt: {
                    lte: now // Less than or equal to the current date/time
                }
            },
             // Select fields needed for logging or audit trail
             select: {
                 id: true,
                 title: true,
                 expiresAt: true,
                 reportedById: true // Include reporter ID for context in logs/audit
             }
        });

        if (expiredItems.length === 0) {
            console.log('Automated Archival Task: No expired items found.');
            return; // Nothing to archive
        }

        console.log(`Automated Archival Task: Found ${expiredItems.length} item(s) to archive.`);

        // Archive each item and create an audit log entry
        const archivePromises = expiredItems.map(async (item) => {
            try {
                // Update item status to ARCHIVED
                await prisma.item.update({
                    where: { id: item.id },
                    data: {
                        status: ItemStatus.ARCHIVED,
                        // Optionally clear expiresAt, though not strictly necessary
                        // expiresAt: null,
                    }
                });

                // Create Audit Log for the archival action
                await prisma.auditLog.create({
                    data: {
                        // userId is null as this is a system action, not user initiated
                        userId: null,
                        itemId: item.id,
                        action: AuditAction.ARCHIVE_ITEM, // Use the enum value
                        details: `Item "${item.title}" (${item.id}) automatically archived. Expired on ${item.expiresAt?.toISOString()}.`,
                        // ipAddress and userAgent can be null for system actions
                        ipAddress: null,
                        userAgent: null,
                    }
                });

                console.log(`Automated Archival Task: Archived item ${item.id} - "${item.title}".`);

            } catch (itemError) {
                console.error(`Automated Archival Task: Failed to archive item ${item.id}:`, itemError);
                // Log the error but continue with other items
            }
        });

        // Wait for all archival operations to complete (or fail individually)
        await Promise.all(archivePromises);

        console.log('Automated Archival Task: Finished processing.');

    } catch (error) {
        console.error('Automated Archival Task: Error during archival process:', error);
        // Log the overall error
    }
};

/**
 * Schedules the automated archival task.
 * Defaults to running once daily at midnight (00:00).
 * You can adjust the cron schedule string as needed.
 * See https://crontab.guru/ for help with cron schedules.
 */
export const scheduleArchivalTask = () => {
    // Schedule: Minute, Hour, Day of Month, Month, Day of Week
    // '0 0 * * *' means 0 minutes, 0 hours (midnight), any day of the month, any month, any day of the week.
    // Use '* * * * *' for every minute (for testing - BE CAREFUL with database operations!)
    // Use '*/5 * * * *' for every 5 minutes (for testing)
    const schedule = process.env.ARCHIVAL_CRON_SCHEDULE || '0 0 * * *'; // Default to daily midnight

    cron.schedule(schedule, () => {
        archiveExpiredItems().catch(error => {
             console.error('Error running scheduled archival task:', error);
             // Ensure any uncaught promise rejections from the task are logged
        });
    }, {
        scheduled: true,
        timezone: process.env.TZ || 'UTC' // Set timezone if needed, default is system timezone or UTC
    });

    console.log(`Automated Archival Task scheduled to run with schedule: "${schedule}" (Timezone: ${process.env.TZ || 'UTC'})`);
};

// Optionally, you can export the function directly if you want to manually trigger it
export { archiveExpiredItems };