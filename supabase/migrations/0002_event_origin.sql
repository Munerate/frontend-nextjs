-- Soft origin signal on ingested events.
--
-- NOT an auth control: events arrive from server-side middleware where the
-- Origin header is often absent and is trivially spoofable by non-browser
-- clients. We record the claimed origin and whether its host matches the
-- registered domain purely for anomaly review / alerting in the dashboard.
-- Authentication remains the secret site_tag (see /api/detect).

alter table events add column if not exists origin text;
alter table events add column if not exists origin_ok boolean;

-- Fast lookup of mismatched/suspicious events per site.
create index if not exists events_site_origin_ok_idx
  on events (site_id, origin_ok)
  where origin_ok is false;
