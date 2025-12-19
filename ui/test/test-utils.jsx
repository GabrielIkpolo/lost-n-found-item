import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Use relative paths to avoid Alias issues
import authReducer from '../src/features/auth/authSlice';
import itemsReducer from '../src/features/items/itemsSlice';
import notificationsReducer from '../src/features/notifications/notificationsSlice';
import supportReducer from '../src/features/support/supportSlice';
import userReducer from '../src/features/userSlice';

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({
      reducer: { 
        auth: authReducer, 
        items: itemsReducer,
        notifications: notificationsReducer,
        support: supportReducer,
        users: userReducer
      },
      preloadedState,
    }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}