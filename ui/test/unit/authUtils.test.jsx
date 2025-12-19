import { describe, it, expect } from 'vitest';

// Example: imagine a helper function that masks emails
const maskEmail = (email) => email.replace(/^(.)(.*)(.@.*)$/, "$1***$3");

describe('maskEmail Utility', () => {
  it('should obscure the middle of the email', () => {
    const result = maskEmail('angelis@example.com');
    expect(result).toBe('a***s@example.com');
  });
});