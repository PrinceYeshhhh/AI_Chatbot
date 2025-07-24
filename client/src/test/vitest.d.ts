import 'jest-axe';

declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void, T> {}
} 