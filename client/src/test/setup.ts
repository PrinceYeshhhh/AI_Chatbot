import '@testing-library/jest-dom'

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3001'
process.env.VITE_OPENAI_MODEL = 'gpt-4o'

// Mock fetch for tests
global.fetch = jest.fn()

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) 