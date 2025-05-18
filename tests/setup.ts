import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Globalne mocki, które mogą być potrzebne we wszystkich testach
beforeAll(() => {
  // Przykładowe globalne ustawienia, np. dla fetch API
  global.fetch = vi.fn();
});

// Czyszczenie po każdym teście
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Czyszczenie po wszystkich testach
afterAll(() => {
  vi.clearAllMocks();
}); 