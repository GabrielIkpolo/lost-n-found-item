import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from './features/notifications/notificationsSlice';
// Import other reducers here as you add more features (e.g., authReducer, itemsReducer)
import authReducer from './features/auth/authSlice.js'

export const store = configureStore({
    reducer: {
    // This is the key that useSelector is looking for
        notifications: notificationsReducer,
        // Add other reducers here:
        auth: authReducer,
        // items: itemsReducer,
    },
  //devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools Extension in development
});
