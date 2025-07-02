-- AI Chatbot Database Initialization
-- This script sets up the production database schema

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ai_chatbot;
USE ai_chatbot;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_archived BOOLEAN DEFAULT false
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender VARCHAR(10) CHECK (sender IN ('user', 'bot')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent',
    intent VARCHAR(100),
    confidence DECIMAL(3,2),
    metadata JSONB
);

-- Training data table
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    intent VARCHAR(100) NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.98,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    source VARCHAR(100) -- file upload, manual entry, etc.
);

-- Embeddings table for vector storage
CREATE TABLE IF NOT EXISTS embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID, -- references training_data or messages
    content_type VARCHAR(50), -- 'training_data', 'message', etc.
    embedding VECTOR(512), -- Requires pgvector extension
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model configurations table
CREATE TABLE IF NOT EXISTS model_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Human feedback table for RLHF
CREATE TABLE IF NOT EXISTS human_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feedback_type VARCHAR(20) CHECK (feedback_type IN ('positive', 'negative', 'neutral')),
    reward DECIMAL(3,2),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- File uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_path VARCHAR(500) NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- Analytics table for usage tracking
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supabase user profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    mobile TEXT,
    username TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);

CREATE INDEX IF NOT EXISTS idx_training_data_user_id ON training_data(user_id);
CREATE INDEX IF NOT EXISTS idx_training_data_intent ON training_data(intent);
CREATE INDEX IF NOT EXISTS idx_training_data_active ON training_data(is_active);

CREATE INDEX IF NOT EXISTS idx_embeddings_content_id ON embeddings(content_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_type ON embeddings(content_type);

CREATE INDEX IF NOT EXISTS idx_human_feedback_message_id ON human_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_human_feedback_user_id ON human_feedback(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_model_configs_updated_at BEFORE UPDATE ON model_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: 'admin123' - change in production!)
INSERT INTO users (email, password_hash, name, role) VALUES 
('admin@example.com', '$2b$10$rQZ9QmSTnIc8nFWoL8l9/.vQZzKZ8qVvKzKZzKZzKZzKZzKZzKZzK', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample training data
INSERT INTO training_data (input, expected_output, intent, user_id) VALUES 
('hello', 'Hello! How can I help you today?', 'greeting', (SELECT id FROM users WHERE email = 'admin@example.com')),
('what can you do', 'I can help you analyze your data, answer questions, and provide insights through natural language conversation.', 'capabilities', (SELECT id FROM users WHERE email = 'admin@example.com')),
('goodbye', 'Goodbye! Feel free to return anytime you need assistance.', 'farewell', (SELECT id FROM users WHERE email = 'admin@example.com'))
ON CONFLICT DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatbot;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatbot;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO chatbot;

-- Enable row level security (optional, for multi-tenant setups)
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE training_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example)
-- CREATE POLICY conversations_user_policy ON conversations
--     FOR ALL TO authenticated
--     USING (user_id = current_user_id());

COMMIT;