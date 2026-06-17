-- Demo data lives in its own world-readable tables, fully decoupled from the
-- RLS-protected sites/events. The public /demo/[id] page reads these with the
-- anon client — no service-role key, no chance of exposing customer data.

-- ── demo_sites ───────────────────────────────────────────────────────────
create table if not exists demo_sites (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null,
  site_tag     text not null,
  crawl_status text not null default 'ready'
    check (crawl_status in ('idle', 'crawling', 'ready', 'error')),
  created_at   timestamptz not null default now()
);

-- ── demo_events ──────────────────────────────────────────────────────────
create table if not exists demo_events (
  id          bigint generated always as identity primary key,
  site_id     uuid not null references demo_sites (id) on delete cascade,
  ts          timestamptz not null default now(),
  category    text not null check (category in ('ai','search','seo','scraper','vuln_scan')),
  bot_name    text,
  provider    text,
  path        text,
  blocked     boolean not null default false,
  referrer    text
);
create index if not exists demo_events_site_ts_idx on demo_events (site_id, ts desc);

-- ── RLS: anyone may read, nobody writes through the API ──────────────────
alter table demo_sites enable row level security;
alter table demo_events enable row level security;

create policy demo_sites_public_read on demo_sites for select using (true);
create policy demo_events_public_read on demo_events for select using (true);

-- ── seed: one demo site at a fixed id + lively sample traffic ────────────
insert into demo_sites (id, domain, site_tag, crawl_status)
values ('00000000-0000-0000-0000-0000000000de', 'demo.com', 'fl_pub_demo00000000000000000000000', 'ready')
on conflict (id) do nothing;

insert into demo_events (site_id, ts, category, bot_name, provider, path, blocked)
select
  '00000000-0000-0000-0000-0000000000de',
  now() - (random() * interval '7 days'),
  cat,
  (array['GPTBot','ClaudeBot','Googlebot','Bingbot','PerplexityBot','AhrefsBot'])[1 + floor(random()*6)],
  (array['openai','anthropic','google','microsoft','perplexity','ahrefs'])[1 + floor(random()*6)],
  (array['/','/pricing','/docs','/blog/launch','/about','/api/v1'])[1 + floor(random()*6)],
  random() < 0.2
from (
  select (array['ai','search','seo','scraper','vuln_scan'])[1 + floor(random()*5)] as cat
  from generate_series(1, 300)
) s;
