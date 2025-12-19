import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import FoundItems from '../../src/components/FoundItems'; // Relative path

describe('Items Integration', () => {
  it('loads and displays items from MSW', async () => {
    renderWithProviders(<FoundItems />);
    await waitFor(() => {
      expect(screen.getByText('Test Phone')).toBeTruthy();
    });
  });
});