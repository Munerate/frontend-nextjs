-- Cached monthly-visit estimates keyed by URL, so repeat estimate lookups for
-- the same URL reuse the stored value instead of re-querying the model.
--
-- Read/written directly from the client with the anon key, so RLS is enabled
-- with explicit anon policies (there is no service-role key in this project).

create table if not exists visit_estimates (
  url        text primary key,
  visits     bigint not null,
  created_at timestamptz not null default now()
);

alter table visit_estimates enable row level security;

-- Anyone may read a cached estimate.
create policy "visit_estimates read" on visit_estimates
  for select using (true);

-- Anyone may cache a new estimate. Updates are disallowed (insert-only cache).
create policy "visit_estimates insert" on visit_estimates
  for insert with check (true);
