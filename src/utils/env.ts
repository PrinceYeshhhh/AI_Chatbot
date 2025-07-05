export function getEnvVar(key: string, fallback?: string): string | undefined {
  // Prefer globalThis.viteEnv for test mocks
  if (typeof globalThis !== 'undefined' && (globalThis as any).viteEnv) {
    return (globalThis as any).viteEnv[key] ?? fallback;
  }
  // Vite (browser) - directly access import.meta.env
  if (import.meta && import.meta.env) {
    return import.meta.env[key] ?? fallback;
  }
  // Node.js/Jest
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] ?? fallback;
  }
  return fallback;
} 