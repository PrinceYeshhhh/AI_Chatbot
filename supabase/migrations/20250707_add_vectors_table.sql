-- Vectors table for RAG embeddings
create extension if not exists vector;

create table if not exists vectors (
  id uuid primary key default gen_random_uuid(),
  embedding vector(1536) not null, -- adjust dimension as needed
  content text,
  metadata jsonb,
  file_id uuid references files(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  chunk_index integer,
  file_name text,
  uploaded_at timestamp with time zone default now()
);

-- Ensure files table has user_id and metadata
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  file_name text,
  file_size bigint,
  file_type text,
  metadata jsonb,
  uploaded_at timestamp with time zone default now()
); 