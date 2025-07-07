require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';

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

// Mock node-fetch for all tests (avoid ESM import issues)
jest.mock('node-fetch', () => jest.fn(() => Promise.resolve({
  ok: true,
  json: async () => ({}),
  text: async () => ''
})));

// Mock @langchain/openai for all tests (avoid ESM import issues)
jest.mock('@langchain/openai', () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedQuery: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    embedDocuments: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]])
  }))
}));

// Mock @langchain/community and @langchain/core if needed
jest.mock('@langchain/community/vectorstores/chroma', () => ({
  Chroma: jest.fn().mockImplementation(() => ({
    addDocuments: jest.fn().mockResolvedValue(undefined),
    similaritySearch: jest.fn().mockResolvedValue([]),
    similaritySearchWithScore: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(undefined),
    collection: { count: jest.fn().mockResolvedValue(0) }
  }))
}));
jest.mock('@langchain/core/documents', () => ({
  Document: jest.fn().mockImplementation((args) => args)
})); 