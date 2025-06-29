import prisma from '../helpers/prisma.js';
import { NotificationType } from '@prisma/client';
import { sendEmail } from './emailService.js'; 

// Import Firebase Admin SDK and path module
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url'; // Needed to resolve __dirname in ESM

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK (only once)
// Check if the SDK is already initialized to prevent errors in development hot-reloading
if (!admin.apps.length) {
    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

        if (!serviceAccountPath) {
            console.error('FIREBASE_SERVICE_ACCOUNT_PATH environment variable is not set.');
        } else {
            // Resolve the absolute path to the service account file
            const absoluteServiceAccountPath = path.resolve(__dirname, '../../', serviceAccountPath); // Adjust '../..' based on your file structure

            // Check if the file exists
            if (!fs.existsSync(absoluteServiceAccountPath)) {
                console.error(`Firebase service account file not found at path: ${absoluteServiceAccountPath}`);
                // Log and disable FCM
            } else {
                const serviceAccount = JSON.parse(fs.readFileSync(absoluteServiceAccountPath, 'utf8'));
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    // Add other options if needed, e.g., databaseURL for other Firebase services
                });
                console.log('Firebase Admin SDK initialized successfully.');
            }
        }
    } catch (error) {
        console.error('Error initializing Firebase Admin SDK:', error);
        // Log the error, but the app might still function without push notifications
    }
}
/**
 * Sends a notification to a specific user based on their preferences.
 *
 * @param {object} params
 * @param {string} params.userId - The ID of the user to notify.
 * @param {string | null} [params.itemId=null] - The ID of the item related to the notification (optional).
 * @param {NotificationType} params.type - The type of notification (from Prisma enum).
 * @param {string} params.message - The main message content for the notification (used for in-app and email).
 * @param {string} [params.pushTitle] - The title for the push notification (optional, defaults to message).
 * @param {string} [params.pushBody] - The body for the push notification (optional, defaults to message).
 * @param {object | null} [params.data=null] - Optional structured data payload for the push notification.
 */
export const sendNotification = async ({
    userId,
    itemId = null,
    type,
    message,
    pushTitle = 'New Notification', // Default push title
    pushBody = message, // Default push body
    data = null // Data payload for push notifications
}) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                fcmToken: true, // Needed for push notifications
                emailNotificationsEnabled: true,
                inAppNotificationsEnabled: true,
                pushNotificationsEnabled: true,
            },
        });

        if (!user) {
            console.warn(`sendNotification: User with ID ${userId} not found.`);
            return;
        }

        // 2. Create In-App Notification (if enabled)
        if (user.inAppNotificationsEnabled) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: user.id,
                        itemId: itemId,
                        type: type,
                        message: message,
                        read: false,
                        // Store relevant details if needed for displaying the notification in the UI
                        // details: details ? JSON.stringify(details) : null,
                    },
                });
                console.log(`sendNotification: Created in-app notification for user ${user.id}, type ${type}.`);
            } catch (inAppError) {
                console.error(`sendNotification: Failed to create in-app notification for user ${user.id}:`, inAppError);
            }
        }

        // 3. Send Email Notification (if enabled)
        if (user.emailNotificationsEnabled) {
            try {
                // Customize email content based on type if needed, otherwise use generic message
                let emailSubject = `Notification: ${type}`;
                let emailBody = message;

                switch (type) {
                    case NotificationType.ITEM_CLAIMED:
                        emailSubject = `Your Found Item Has Been Claimed!`;
                        // Example of building a slightly more specific email body
                        emailBody = `Hello ${user.name},\n\nYour reported item "${message.split('"')[1] || 'a found item'}" has been claimed. The claimant should contact you soon to arrange the return.\n\nThanks,\nLAFI Team`;
                        // You might want to pass claimant details to this function's 'details' or fetch them here if needed
                        break;
                    // Add cases for other notification types
                }

                await sendEmail(user.email, emailSubject, emailBody); // Use the generic sendEmail function
                console.log(`sendNotification: Sent email notification to ${user.email} for type ${type}.`);

            } catch (emailError) {
                console.error(`sendNotification: Failed to send email notification to user ${user.email}:`, emailError);
            }
        }

        // 4. Send Push Notification (if enabled, FCM token exists, and SDK is initialized)
        if (user.pushNotificationsEnabled && user.fcmToken && admin.apps.length > 0) {
            try {
                const fcmMessage = {
                    notification: {
                        title: pushTitle,
                        body: pushBody,
                    },
                    data: { // Optional data payload for the app to handle (e.g., navigate to item details)
                        type: type,
                        itemId: itemId || '',
                        ...data // Include any extra data passed to sendNotification
                    },
                    token: user.fcmToken, // Send to the specific user's device
                };

                const response = await admin.messaging().send(fcmMessage);
                console.log('sendNotification: Successfully sent FCM message:', response);

            } catch (pushError) {
                console.error(`sendNotification: Failed to send push notification to user ${user.id} (token: ${user.fcmToken}):`, pushError);
                // Handle specific FCM errors:
                // if (pushError.code === 'messaging/invalid-registration-token' || pushError.code === 'messaging/registration-token-not-registered') {
                //     console.warn(`Removing invalid or expired FCM token for user ${user.id}`);
                //     // You might want to remove the invalid token from the database here
                //     await prisma.user.update({
                //         where: { id: user.id },
                //         data: { fcmToken: null },
                //     });
                // }
            }
        }

        console.log(`sendNotification: Finished processing notification for user ${user.id}, type ${type}.`);

    } catch (error) {
        console.error('sendNotification: Unexpected error:', error);
    }
};

// ... You might remove or keep the commented-out specific notification functions ...
// export const notifyItemClaimed = async (item, claimant) => { ... }