import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.VITE_API_URL = 'http://localhost:3001'
// process.env.VITE_OPENAI_MODEL = 'gpt-4o' // Removed: now using Google AI Studio as backup

// Mock fetch for tests
global.fetch = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) 