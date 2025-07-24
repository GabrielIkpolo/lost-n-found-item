import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer from './features/notifications/notificationsSlice';
import authReducer from './features/auth/authSlice.js'
import itemsReducer from './features/items/itemsSlice.js';
import userReducer from './features/userSlice.js';


export const store = configureStore({
  reducer: {
    // This is the key that useSelector is looking for
    notifications: notificationsReducer,
    // Add other reducers here:
    auth: authReducer,
    items: itemsReducer,
    users: userReducer,

  },
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(thunk),
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools Extension in development
});