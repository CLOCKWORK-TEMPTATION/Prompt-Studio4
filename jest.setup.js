// Jest setup file for additional configuration
// This file runs before all tests

// Mock console methods to reduce noise during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  // Keep error for debugging
  error: originalConsole.error,
};
