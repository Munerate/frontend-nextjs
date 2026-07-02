-- Munerate PRODUCT analytics: behaviour/funnel events for the Munerate app itself.
-- Distinct from `events` (0001), which records bots hitting CUSTOMER sites.
--
-- Written from the anon key via a first-party ingest endpoint (/api/track) and a
-- few server routes/actions, plus one direct authenticated-client insert (login).
-- RLS is enabled with an insert policy and DELIBERATELY no select policy (write-only
-- for clients). There is NO service-role key in this project, so REPORTING IS DONE
-- IN THE SUPABASE STUDIO SQL EDITOR (role postgres, bypasses RLS). The views are
-- security_invoker so they cannot re-expose rows to anon/authenticated via PostgREST.
--
-- PRIVACY (enforced in lib/track.ts + /api/track, not the DB): no IP is ever stored;
-- no raw user-agent (device_type only); `path` is pathname-only; `referrer_host` is
-- host-only; error strings map to codes; RAG query bodies are never stored. Do NOT
-- add an ip column later.

-- ── analytics_events (behaviour event log) ───────────────────────────────────
create table if not exists analytics_events (
  id            bigint generated always as identity primary key,
  ts            timestamptz not null default now(),
  event_name    text not null,
  event_type    text not null default 'track'
                  check (event_type in ('pageview', 'track', 'identify')),
  source        text not null default 'client'
                  check (source in ('client', 'server')),
  -- durable first-party id for anonymous visitors; uuid-shaped but typed text so a
  -- malformed cookie cannot 22P02-abort a fire-and-forget insert (silent drop).
  anon_id       text check (anon_id is null or anon_id ~ '^[0-9a-fA-F-]{36}$'),
  -- defaults to the caller's uid; null for anon. on delete set null keeps the row
  -- (prevents a dangling fk) but is NOT the erasure mechanism — see
  -- purge_analytics_for_user() below.
  user_id       uuid default auth.uid() references auth.users (id) on delete set null,
  site_id       uuid references sites (id) on delete set null,
  session_id    text check (session_id is null or session_id ~ '^[0-9a-fA-F-]{36}$'),
  path          text,          -- pathname only; never the query string
  referrer_host text,          -- referrer host only; never the full url
  device_type   text,          -- mobile|desktop|tablet|bot; NO raw ua, NO ip
  props         jsonb not null default '{}'::jsonb,
  constraint analytics_events_event_name_len check (char_length(event_name) <= 128),
  constraint analytics_events_props_size check (pg_column_size(props) <= 8192)
);

-- ── indexes (lean B-trees; no GIN at launch — no props @> query exists yet) ───
create index if not exists analytics_events_ts_idx
  on analytics_events (ts desc);
create index if not exists analytics_events_name_ts_idx
  on analytics_events (event_name, ts desc);
create index if not exists analytics_events_user_ts_idx
  on analytics_events (user_id, ts desc) where user_id is not null;
create index if not exists analytics_events_anon_ts_idx
  on analytics_events (anon_id, ts desc) where anon_id is not null;

-- ── analytics_identities (anon_id -> user_id stitch; persisted, not a view) ───
create table if not exists analytics_identities (
  anon_id   text primary key check (anon_id ~ '^[0-9a-fA-F-]{36}$'),
  user_id   uuid not null references auth.users (id) on delete cascade,
  linked_at timestamptz not null default now(),
  source    text not null default 'client' check (source in ('client', 'server'))
);
create index if not exists analytics_identities_user_idx
  on analytics_identities (user_id);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table analytics_events enable row level security;
alter table analytics_identities enable row level security;

-- Anon + authenticated may INSERT events. A row is either anonymous (user_id null)
-- or stamped with the caller's own uid; nobody can spoof another user's uid. Under
-- the anon key auth.uid() is null, forcing user_id null. identify rows must carry a
-- real uid (an anonymous caller cannot assert an identity link).
create policy "analytics_events insert" on analytics_events
  for insert with check (
    (event_type <> 'identify' and (user_id is null or user_id = auth.uid()))
    or
    (event_type = 'identify' and user_id = auth.uid())
  );
-- NO select/update/delete policy: write-only for clients. Reporting = Studio SQL editor.

-- Identity link: only the authenticated caller may assert (anon_id -> their uid).
create policy "analytics_identities upsert" on analytics_identities
  for insert with check (user_id = auth.uid());
create policy "analytics_identities update" on analytics_identities
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── grants (explicit; independent of Supabase defaults) ──────────────────────
revoke all on analytics_events from anon, authenticated;
revoke all on analytics_identities from anon, authenticated;
grant insert on analytics_events to anon, authenticated;
grant insert, update on analytics_identities to anon, authenticated;

-- ── erasure (real GDPR path; on-delete-set-null is only a dangling-fk safety net)
create or replace function purge_analytics_for_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target is null or (auth.uid() is not null and auth.uid() <> target) then
    raise exception 'not allowed';
  end if;
  delete from analytics_events
    where user_id = target
       or anon_id in (select anon_id from analytics_identities where user_id = target);
  delete from analytics_identities where user_id = target;
end;
$$;
revoke all on function purge_analytics_for_user(uuid) from public;
grant execute on function purge_analytics_for_user(uuid) to authenticated;

-- ── retention purge (90 days). Schedule with pg_cron if available; otherwise run
-- this delete on a scheduled Supabase function. The (ts desc) index makes it cheap.
--   select cron.schedule('purge-analytics', '17 3 * * *',
--     $$delete from analytics_events where ts < now() - interval '90 days'$$);

-- ── reporting views (security_invoker => honour querying role's RLS; anon/auth
-- read zero rows; usable in Studio SQL editor as postgres) ────────────────────

-- (a) resolved events: attach a stable visitor_key. Priority: explicit user_id ->
-- user_id from the identity table -> raw anon_id. Stitches pre/post-login.
create or replace view analytics_events_resolved
  with (security_invoker = on) as
select e.*,
       coalesce(e.user_id, i.user_id, e.anon_id) as visitor_key
from analytics_events e
left join analytics_identities i on i.anon_id = e.anon_id;

-- (b) daily rollup: per-day per-event counts + unique visitors.
create or replace view analytics_daily
  with (security_invoker = on) as
select date_trunc('day', ts) as day,
       event_name,
       source,
       count(*)                    as event_count,
       count(distinct visitor_key) as unique_visitors
from analytics_events_resolved
group by 1, 2, 3
order by 1 desc, 2;

-- (c) funnel: distinct visitors reaching each canonical stage.
create or replace view analytics_funnel
  with (security_invoker = on) as
with per_visitor as (
  select visitor_key,
         bool_or(event_name = 'scanned')    as scanned,
         bool_or(event_name = 'estimated')  as estimated,
         bool_or(event_name = 'claimed')    as claimed,
         bool_or(event_name = 'signed_up')  as signed_up,
         bool_or(event_name = 'site_added') as site_added,
         bool_or(event_name = 'verified')   as verified,
         bool_or(event_name = 'crawled')    as crawled
  from analytics_events_resolved
  where visitor_key is not null
  group by visitor_key
)
select stage, step, visitors from (
  select 'scanned'    as stage, 1 as step, count(*) filter (where scanned)    as visitors from per_visitor
  union all select 'estimated',  2, count(*) filter (where estimated)  from per_visitor
  union all select 'claimed',    3, count(*) filter (where claimed)    from per_visitor
  union all select 'signed_up',  4, count(*) filter (where signed_up)  from per_visitor
  union all select 'site_added', 5, count(*) filter (where site_added) from per_visitor
  union all select 'verified',   6, count(*) filter (where verified)   from per_visitor
  union all select 'crawled',    7, count(*) filter (where crawled)    from per_visitor
) s
order by step;

revoke all on analytics_events_resolved, analytics_daily, analytics_funnel
  from anon, authenticated;
