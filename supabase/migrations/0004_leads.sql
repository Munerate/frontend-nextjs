-- Email-capture leads from the "Claim" CTA (pre-auth waitlist).

create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  url        text,
  created_at timestamptz not null default now(),
  unique (email, url)
);
create index if not exists leads_created_idx on leads (created_at desc);

-- RLS: inserted directly from the browser (anon key), so allow anon/authenticated
-- INSERT only. No SELECT policy → nobody can read the list back from the client.
alter table leads enable row level security;

drop policy if exists leads_anon_insert on leads;
create policy "leads insert" on leads
  for insert with check (true);
