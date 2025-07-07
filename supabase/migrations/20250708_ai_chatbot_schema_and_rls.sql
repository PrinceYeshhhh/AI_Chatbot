-- AI Chatbot: Vectors and Files Table Schema + RLS Policies

-- Vectors Table
create table if not exists public.vectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_id uuid not null,
  chunk text not null,
  chunk_index integer not null,
  embedding vector(1536), -- adjust dimension if needed
  created_at timestamp with time zone default now()
);
create index if not exists idx_vectors_user_file on public.vectors(user_id, file_id);

-- Files Table
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  filename text not null,
  original_name text,
  size integer,
  mimetype text,
  uploaded_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.vectors enable row level security;
alter table public.files enable row level security;

-- RLS Policies
create policy if not exists "Users can access their own vectors"
  on public.vectors
  for all
  using (user_id = auth.uid());

create policy if not exists "Users can access their own files"
  on public.files
  for all
  using (user_id = auth.uid()); 