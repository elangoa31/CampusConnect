import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { OfflineBanner } from '../components/common/OfflineBanner';
import * as networkHook from '../hooks/useNetworkStatus';
import React from 'react';

describe('Android Native Experience & Offline Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. OfflineBanner renders alert when disconnected from internet', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: false,
      connectionType: 'none',
    });

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();
  });

  it('2. OfflineBanner does not render when online', () => {
    vi.spyOn(networkHook, 'useNetworkStatus').mockReturnValue({
      isConnected: true,
      connectionType: 'wifi',
    });

    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('3. OfflineBanner shows restored status when connection returns', () => {
    const hookSpy = vi.spyOn(networkHook, 'useNetworkStatus');

    // Start offline
    hookSpy.mockReturnValue({
      isConnected: false,
      connectionType: 'none',
    });

    const { rerender } = render(<OfflineBanner />);
    expect(screen.getByText(/You are currently offline/i)).toBeInTheDocument();

    // Reconnect
    hookSpy.mockReturnValue({
      isConnected: true,
      connectionType: 'wifi',
    });

    act(() => {
      rerender(<OfflineBanner />);
    });

    expect(screen.getByText(/Internet connection restored/i)).toBeInTheDocument();
  });
});
