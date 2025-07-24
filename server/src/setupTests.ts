// Test setup file for Jest
import '@testing-library/jest-dom';

// Mock environment variables
process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '3001';
process.env['GROQ_API_KEY'] = 'test-groq-key';
process.env['TOGETHER_API_KEY'] = 'test-together-key';
process.env['QDRANT_URL'] = 'https://test.qdrant.io';
process.env['QDRANT_API_KEY'] = 'test-qdrant-key';
process.env['CLERK_SECRET_KEY'] = 'test-clerk-key';
process.env['NEON_HOST'] = 'test.neon.tech';
process.env['NEON_DATABASE'] = 'test_db';
process.env['NEON_USER'] = 'test_user';
process.env['NEON_PASSWORD'] = 'test_password';
process.env['CLOUDINARY_CLOUD_NAME'] = 'test-cloud';
process.env['CLOUDINARY_API_KEY'] = 'test-cloudinary-key';
process.env['CLOUDINARY_API_SECRET'] = 'test-cloudinary-secret';
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['ENCRYPTION_KEY'] = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fs module
jest.mock('fs/promises', () => ({
  readdir: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  access: jest.fn(),
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(),
  basename: jest.fn(),
}));

// Mock winston logger
jest.mock('./utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  wrapAsync: jest.fn((fn) => fn),
}));

// Mock localStorage for frontend tests
(global as any).localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
// Mock document for frontend tests
(global as any).document = {
  createElement: jest.fn(),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  body: {},
};

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
}); 