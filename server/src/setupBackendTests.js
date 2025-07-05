process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = require('stream/web').ReadableStream;
}

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

// Mock Supabase client for backend tests
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      auth: {
        getUser: async () => ({
          data: { user: { id: 'test-user' } },
          error: null
        })
      }
    })
  };
}); 