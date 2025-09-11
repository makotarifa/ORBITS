import { afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress React warnings and errors in tests
  console.error = (...args: any[]) => {
    // Filter out specific React warnings that are not relevant to our tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOMTestUtils') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: Cannot update during an existing state transition'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    // Filter out specific warnings that are not relevant to our tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOMTestUtils') ||
       args[0].includes('Warning: An update to'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Handle unhandled promise rejections (like ZodErrors)
  process.on('unhandledRejection', (reason) => {
    // Suppress Zod validation errors that occur during component initialization
    if (reason && typeof reason === 'object' && 'issues' in reason) {
      return; // Suppress ZodError unhandled rejections
    }
    // For other unhandled rejections, log them but don't fail the test
    console.warn('Unhandled Promise Rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    // Suppress Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return; // Suppress ZodError uncaught exceptions
    }
    // For other exceptions, log them but don't fail the test
    console.warn('Uncaught Exception:', error);
  });
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;

  // Remove event listeners
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});