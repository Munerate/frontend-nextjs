-- Munerate schema: sites, events, documents, chunks + pgvector + owner-scoped RLS.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- ── sites ────────────────────────────────────────────────────────────────
create table if not exists sites (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users (id) on delete cascade,
  domain       text not null,
  site_tag     text not null unique,
  verified_at  timestamptz,
  verify_method text check (verify_method in ('dns', 'meta')),
  verify_token text not null,
  crawl_status text not null default 'idle'
    check (crawl_status in ('idle', 'crawling', 'ready', 'error')),
  created_at   timestamptz not null default now(),
  unique (owner_id, domain)
);
create index if not exists sites_owner_idx on sites (owner_id);

-- ── events (ingested bot/scan hits) ──────────────────────────────────────
create table if not exists events (
  id          bigint generated always as identity primary key,
  site_id     uuid not null references sites (id) on delete cascade,
  ts          timestamptz not null default now(),
  category    text not null check (category in ('ai','search','seo','scraper','vuln_scan')),
  bot_name    text,
  provider    text,
  path        text,
  blocked     boolean not null default false,
  ua          text,
  referrer    text,
  cf_snapshot jsonb
);
create index if not exists events_site_ts_idx on events (site_id, ts desc);
create index if not exists events_site_cat_idx on events (site_id, category);

-- ── documents + chunks (RAG corpus) ──────────────────────────────────────
create table if not exists documents (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references sites (id) on delete cascade,
  url        text not null,
  title      text,
  content    text,
  updated_at timestamptz not null default now(),
  unique (site_id, url)
);
create index if not exists documents_site_idx on documents (site_id);

create table if not exists chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  site_id     uuid not null references sites (id) on delete cascade,
  content     text not null,
  embedding   vector(1024),
  token_count int
);
create index if not exists chunks_site_idx on chunks (site_id);
-- ANN index for cosine similarity search.
create index if not exists chunks_embedding_idx on chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── RLS: owner-scoped reads on everything ────────────────────────────────
alter table sites enable row level security;
alter table events enable row level security;
alter table documents enable row level security;
alter table chunks enable row level security;

create policy sites_owner_all on sites
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy events_owner_read on events
  for select using (exists (
    select 1 from sites s where s.id = events.site_id and s.owner_id = auth.uid()
  ));

create policy documents_owner_read on documents
  for select using (exists (
    select 1 from sites s where s.id = documents.site_id and s.owner_id = auth.uid()
  ));

create policy chunks_owner_read on chunks
  for select using (exists (
    select 1 from sites s where s.id = chunks.site_id and s.owner_id = auth.uid()
  ));
-- Ingestion (/api/detect) and crawl writes use the service role, which bypasses RLS.

-- ── similarity search RPC (owner-scoped via site_id passed by verified caller) ──
create or replace function match_chunks(
  p_site_id uuid,
  p_query_embedding vector(1024),
  p_match_count int default 8
)
returns table (id uuid, document_id uuid, content text, url text, title text, similarity float)
language sql stable
as $$
  select c.id, c.document_id, c.content, d.url, d.title,
         1 - (c.embedding <=> p_query_embedding) as similarity
  from chunks c
  join documents d on d.id = c.document_id
  where c.site_id = p_site_id and c.embedding is not null
  order by c.embedding <=> p_query_embedding
  limit p_match_count;
$$;
