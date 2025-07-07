-- User memory table
create table if not exists user_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  memory jsonb,
  updated_at timestamp with time zone default now()
);

-- Chat context table
create table if not exists chat_context (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users(id) on delete cascade,
  context jsonb,
  updated_at timestamp with time zone default now()
);

-- LLM feedback table
create table if not exists llm_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text,
  file_id text,
  question text,
  answer text,
  feedback_type text, -- 'thumbs_up', 'thumbs_down', 'correction', etc.
  feedback_text text,
  created_at timestamp with time zone default now()
);

-- LLM logs table
create table if not exists llm_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  provider text,
  model text,
  latency integer,
  cost float,
  task_type text,
  created_at timestamp with time zone default now()
);

-- Fine-tune data table (optional, for RLHF)
create table if not exists fine_tune_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  input jsonb,
  output jsonb,
  label text,
  created_at timestamp with time zone default now()
); 