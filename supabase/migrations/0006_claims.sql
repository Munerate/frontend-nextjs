-- Email "Claim" captures from the CTA (pre-auth waitlist).
--
-- Written directly from the client with the anon key, so RLS is enabled with
-- explicit anon policies (mirrors visit_estimates; no service-role key here).

create table if not exists claims (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  url        text,
  created_at timestamptz not null default now()
);
create index if not exists claims_created_idx on claims (created_at desc);

alter table claims enable row level security;

-- Anyone may read (kept consistent with visit_estimates; no PII beyond email).
create policy "claims read" on claims
  for select using (true);

-- Anyone may submit a claim.
create policy "claims insert" on claims
  for insert with check (true);
