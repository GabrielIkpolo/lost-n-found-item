import authReducer, { logout } from '../../src/features/auth/authSlice'; // Relative path
import { describe, it, expect } from 'vitest';

describe('Auth Reducer', () => {
  it('handles logout', () => {
    const state = { isAuthenticated: true, user: { name: 'Test' } };
    const result = authReducer(state, logout());
    expect(result.isAuthenticated).toBe(false);
  });
});