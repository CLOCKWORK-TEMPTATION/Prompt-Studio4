/**
 * إعداد بيئة الاختبار
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Setup environment variables for tests
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
}

// Mock OpenAI if not available
if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY not set, using fallback embeddings in tests');
}

export {};

