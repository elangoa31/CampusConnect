import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, vi } from 'vitest';

beforeEach(() => {
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  if (typeof localStorage !== 'undefined') localStorage.clear();
});

