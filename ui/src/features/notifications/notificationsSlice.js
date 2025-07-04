import { createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid" // Needed to generate unique IDs

// Define the Notification types enum
export const NotificationType = {
    INFO: 'info',       // Blue/Gray (default)
    SUCCESS: 'success', // Green
    WARNING: 'warning', // Yellow
    ERROR: 'error',     // Red
};

// Define initial state for notification
const initialState = {
    notifications: [],// Array to hold notifications
};


//create the notification
const notificationsSlice = createSlice({
    name: 'notifications', // A name for this slice of state
    initialState,
    reducers: {
        //Reducers to add a notification
        //The payload is expected to be {message, type, duration}
        addNotification: (state, action) => {
            const { message, type = NotificationType.INFO, duration = 5000 } = action.payload; // Use the enum as default
            const id = uuidv4(); //Generate a unique ID for notification

            const newNotification = {
                id,
                message,
                type,
                duration,
            };

            state.notifications.push(newNotification); // Use Immer (built into RTK) for mutation-like updates
        },

        // Reducer to remove a notification by ID
        // The payload is expected to be the notification ID
        removeNotification: (state, action) => {
            const notificationId = action.payload;
            state.notifications = state.notifications.filter(
                (notification) => notification.id !== notificationId
            );
        },

        // Optional: Reducer to clear all notifications
        clearAllNotifications: (state) => {
            state.notifications = [];
        },

    },
});


// Let's redefine the export to include NotificationType clearly:
export const { addNotification, removeNotification, clearAllNotifications } = notificationsSlice.actions;

// The default export is still the reducer
export default notificationsSlice.reducer;
