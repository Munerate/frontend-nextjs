"use client";

// Client-side PRODUCT analytics for the Munerate app (funnel + granular UI events).
// Fire-and-forget: track() enqueues an event and never throws. Events are batched to
// /api/track, which stamps user_id, device_type and ts server-side. Conversion/funnel
// events flush immediately; noisy granular events can be sampled.
//
// Privacy: honours GPC / Do-Not-Track / explicit opt-out (hard no-op). Stores a
// first-party anon id (mun_aid) so anonymous funnel steps can later be stitched to a
// user on sign-in. Never sends user_id (server stamps it), IP, raw UA, or query strings.
//
// NOTE: this is separate from lib/analytics.ts (which charts bot traffic) — do not merge.

import type { SupabaseClient } from "@supabase/supabase-js";

const ANON_COOKIE = "mun_aid";
const SESSION_KEY = "mun_sid";
const SESSION_TS_KEY = "mun_sid_ts";
const CONSENT_COOKIE = "mun_consent";
const ANON_MAX_AGE = 60 * 60 * 24 * 180; // 180 days
const SESSION_IDLE_MS = 30 * 60 * 1000; // rotate the per-tab session after 30 min idle
const FLUSH_INTERVAL_MS = 2000;
const MAX_QUEUE = 50;
const UUID_RE = /^[0-9a-fA-F-]{36}$/;

export type TrackProps = Record<string, string | number | boolean | null>;
export type TrackOptions = { immediate?: boolean; sample?: number };

type QueuedEvent = {
  event_name: string;
  event_type: "pageview" | "track";
  source: "client";
  anon_id: string | null;
  session_id: string | null;
  path: string | null;
  referrer_host: string | null;
  props: TrackProps;
};

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/** GPC / DNT / explicit opt-out => no tracking at all. The DB cannot enforce this. */
export function trackingAllowed(): boolean {
  if (!isBrowser()) return false;
  const nav = navigator as Navigator & {
    globalPrivacyControl?: boolean;
    doNotTrack?: string | null;
  };
  if (nav.globalPrivacyControl === true) return false;
  if (nav.doNotTrack === "1") return false;
  if (readCookie(CONSENT_COOKIE) === "denied") return false;
  return true;
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Read or mint the durable first-party anonymous id. Null if tracking is disabled. */
export function getAnonId(): string | null {
  if (!trackingAllowed()) return null;
  let id = readCookie(ANON_COOKIE);
  if (!id || !UUID_RE.test(id)) {
    id = crypto.randomUUID();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${ANON_COOKIE}=${id}; Max-Age=${ANON_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  }
  return id;
}

/** Per-tab visit id; rotates after 30 min idle. Groups events within one visit. */
export function getSessionId(): string | null {
  if (!trackingAllowed()) return null;
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(SESSION_TS_KEY) || 0);
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id || !UUID_RE.test(id) || now - last > SESSION_IDLE_MS) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    sessionStorage.setItem(SESSION_TS_KEY, String(now));
    return id;
  } catch {
    return null;
  }
}

/** Rotate anon + session ids (call on sign-out so a shared browser isn't mis-stitched). */
export function resetTrackingIdentity(): void {
  if (!isBrowser()) return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ANON_COOKIE}=${crypto.randomUUID()}; Max-Age=${ANON_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  try {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
  } catch {
    // ignore
  }
}

function referrerHost(): string | null {
  if (!document.referrer) return null;
  try {
    const h = new URL(document.referrer).hostname;
    return h === location.hostname ? null : h; // ignore internal navigation
  } catch {
    return null;
  }
}

// Fold a small allowlist of URL context into props (never the raw query string).
function withUrlContext(props: TrackProps): TrackProps {
  try {
    const p = new URLSearchParams(location.search);
    const out: TrackProps = { ...props };
    if (p.has("error") && out.has_error === undefined) out.has_error = true;
    for (const key of ["next", "domain"] as const) {
      const v = p.get(key);
      if (v && out[key] === undefined) out[key] = v;
    }
    return out;
  } catch {
    return props;
  }
}

/**
 * Enqueue a behaviour event. Never throws. Pass { immediate: true } for
 * funnel/conversion events (flush now); pass { sample: 0.25 } for noisy granular
 * events (slider, tab) to keep only a fraction.
 */
export function track(
  eventName: string,
  props: TrackProps = {},
  opts: TrackOptions = {}
): void {
  if (!trackingAllowed()) return;
  if (opts.sample !== undefined && Math.random() > opts.sample) return;
  try {
    queue.push({
      event_name: eventName,
      event_type: eventName === "page_view" ? "pageview" : "track",
      source: "client",
      anon_id: getAnonId(),
      session_id: getSessionId(),
      path: location.pathname,
      referrer_host: referrerHost(),
      props: withUrlContext(props),
    });
    bindLifecycle();
    if (opts.immediate || queue.length >= MAX_QUEUE) flush();
    else scheduleFlush();
  } catch {
    // never throw from tracking
  }
}

function scheduleFlush(): void {
  if (flushTimer !== null) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}

function bindLifecycle(): void {
  if (listenersBound || !isBrowser()) return;
  listenersBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}

function flush(useBeacon = false): void {
  if (!queue.length) return;
  const events = queue;
  queue = [];
  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const body = JSON.stringify({ events });
  try {
    if (useBeacon && typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(
        "/api/track",
        new Blob([body], { type: "application/json" })
      );
      if (!ok) queue = events.concat(queue); // requeue on beacon failure
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // swallow — analytics must never break the app
  }
}

/**
 * Record the anon->user link on the client after a successful OTP-paste sign-in.
 * The server (/auth/callback) is the authoritative writer for the magic-link flow;
 * this covers the code-entry flow, which never reaches /auth/callback. Reuse the
 * caller's post-verify Supabase client (it now holds the session). Fire-and-forget.
 */
export async function clientIdentify(
  supabase: SupabaseClient,
  props: TrackProps = {}
): Promise<void> {
  if (!trackingAllowed()) return;
  const anonId = getAnonId();
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    // Don't send user_id — the column default auth.uid() fills it (RLS requires
    // user_id = auth.uid() for identify rows).
    await supabase.from("analytics_events").insert({
      event_name: "signed_up",
      event_type: "identify",
      source: "client",
      anon_id: anonId,
      session_id: getSessionId(),
      path: location.pathname,
      props,
    });
    if (anonId) {
      await supabase
        .from("analytics_identities")
        .upsert(
          { anon_id: anonId, user_id: user.id, source: "client" },
          { onConflict: "anon_id" }
        );
    }
  } catch {
    // never block sign-in
  }
}
