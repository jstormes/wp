require('@testing-library/jest-dom');

// Setup global test environment
global.console = {
  ...console,
  // Suppress console errors in tests unless needed
  error: jest.fn(),
  warn: jest.fn(),
};
