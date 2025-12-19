import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
import Login from '../../src/components/Login';

describe('Login Integration', () => {
  it('updates redux on valid login', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Login />);

    // Fill inputs
    await user.type(screen.getByPlaceholderText(/Email/i), 'admin@test.com');
    await user.type(screen.getByPlaceholderText(/Password/i), 'password123');
    
    // FIX: Use ^ and $ to match "Login" exactly, ignoring "Google Login"
    const submitBtn = screen.getByRole('button', { name: /^Login$/ });
    await user.click(submitBtn);

    // Verify Redux state updates
    await waitFor(() => {
      const state = store.getState();
      expect(state.auth.isAuthenticated).toBe(true);
      expect(state.auth.user.id).toBe('admin-id');
    }, { timeout: 2000 });
  });
});