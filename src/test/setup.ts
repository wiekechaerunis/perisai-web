import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { mockServices } from '@/services/mock';

// Radix memakai API browser yang tidak ada di jsdom.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};

beforeEach(async () => {
  localStorage.clear();
  sessionStorage.clear();
  // Data mock ditanam ulang untuk setiap test.
  await mockServices.dev!.reset();
});

afterEach(() => cleanup());
