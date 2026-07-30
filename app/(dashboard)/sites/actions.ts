"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { buildInstallEmail } from "@/lib/install-email";
import { sendMail } from "@/lib/mailer";
import { logServerEvent } from "@/lib/track-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return d;
}

function resolveOrigin(): Promise<string> {
  return headers().then((h) => {
    const envOrigin = process.env.NEXT_PUBLIC_MUNERATE_ORIGIN;
    return (
      envOrigin ||
      `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`
    );
  });
}

/**
 * Claim-flow entry point. Runs entirely server-side with the service-role client
 * so the visitor never needs a session yet: it provisions the user, creates the
 * site + tag, generates a one-click magic login link (WITHOUT sending Supabase's
 * own OTP/confirmation email), and emails a single install message that carries
 * that login link. The result: the user receives ONLY the install email — no
 * separate sign-in email.
 */
export async function claimSite(
  rawEmail: string,
  rawDomain: string
): Promise<{ ok: true } | { error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { error: "invalid_email" };

  const domain = normalizeDomain(rawDomain);
  if (!domain || !domain.includes(".")) return { error: "invalid_domain" };

  const admin = getSupabaseAdmin();

  // Record the claim (waitlist analytics). Non-fatal if it fails.
  await admin.from("claims").insert({ email, url: rawDomain });

  const origin = await resolveOrigin();

  // Generate a magic-link token server-side. generateLink RETURNS the link (and
  // hashed_token) instead of emailing it, so no OTP email is sent. It also
  // provisions the user; if the account somehow doesn't exist yet, create it and
  // retry so the token verifies.
  let link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (link.error || !link.data?.user) {
    await admin.auth.admin.createUser({ email, email_confirm: true });
    link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/auth/callback` },
    });
  }
  if (link.error || !link.data?.user || !link.data.properties?.hashed_token) {
    return { error: link.error?.message || "Could not start the claim." };
  }
  const userId = link.data.user.id;
  const hashedToken = link.data.properties.hashed_token;

  // Create the site (service-role insert; the user has no session yet).
  const site_tag = `fl_pub_${randomBytes(16).toString("hex")}`;
  const verify_token = `munerate-verify-${randomBytes(16).toString("hex")}`;
  let siteId: string;
  const { data: inserted, error: insertErr } = await admin
    .from("sites")
    .insert({ owner_id: userId, domain, site_tag, verify_token })
    .select("id, site_tag")
    .single();
  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: existing } = await admin
        .from("sites")
        .select("id")
        .eq("owner_id", userId)
        .eq("domain", domain)
        .single();
      if (!existing) return { error: insertErr.message };
      siteId = existing.id;
    } else {
      return { error: insertErr.message };
    }
  } else {
    siteId = inserted!.id;
  }

  // Build our own callback link carrying the token hash. verifyOtp on the
  // callback signs the user in without a PKCE code verifier (which we can't have
  // for a server-generated link), landing them straight on their site dashboard.
  const next = `/sites/${siteId}`;
  const loginUrl = `${origin}/auth/callback?token_hash=${encodeURIComponent(
    hashedToken
  )}&type=magiclink&next=${encodeURIComponent(next)}`;

  const { data: site } = await admin
    .from("sites")
    .select("domain, site_tag")
    .eq("id", siteId)
    .single();

  const { subject, html, text } = buildInstallEmail({
    domain: site?.domain ?? domain,
    siteId,
    siteTag: site?.site_tag ?? site_tag,
    origin,
    loginUrl,
  });
  await sendMail({ to: email, subject, html, text });

  await logServerEvent(
    {
      event_name: "install_email_sent",
      user_id: userId,
      site_id: siteId,
      props: { domain, flow: "claim" },
    },
    { supabase: admin }
  );

  return { ok: true };
}

/**
 * Creates a site (with a fresh site_tag) for the signed-in user, or returns the
 * existing site id if they already added this domain. Pure data — no redirects —
 * so it can be called from both the form action and the auto-create page.
 */
export async function createSiteForCurrentUser(
  rawDomain: string
): Promise<{ id: string; created: boolean } | { error: string }> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const domain = normalizeDomain(rawDomain);
  if (!domain || !domain.includes(".")) return { error: "invalid" };

  const site_tag = `fl_pub_${randomBytes(16).toString("hex")}`;
  const verify_token = `munerate-verify-${randomBytes(16).toString("hex")}`;

  const { data, error } = await supabase
    .from("sites")
    .insert({ owner_id: user.id, domain, site_tag, verify_token })
    .select("id")
    .single();

  if (error) {
    // Unique (owner_id, domain) violation — the user already has this domain.
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("sites")
        .select("id")
        .eq("owner_id", user.id)
        .eq("domain", domain)
        .single();
      if (existing) {
        await logServerEvent(
          {
            event_name: "site_added",
            user_id: user.id,
            site_id: existing.id,
            props: { domain, created: false },
          },
          { supabase }
        );
        return { id: existing.id, created: false };
      }
    }
    return { error: error.message };
  }

  await logServerEvent(
    {
      event_name: "site_added",
      user_id: user.id,
      site_id: data!.id,
      props: { domain, created: true },
    },
    { supabase }
  );
  return { id: data!.id, created: true };
}

/**
 * Emails the signed-in user the bot-id install snippet + middleware instructions
 * + a link to their site dashboard. Best-effort: never throws (so it can't break
 * the post-claim redirect); logs and returns on failure.
 */
export async function sendInstallEmail(siteId: string): Promise<void> {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    const { data: site } = await supabase
      .from("sites")
      .select("domain, site_tag")
      .eq("id", siteId)
      .single();
    if (!site) return;

    const envOrigin = process.env.NEXT_PUBLIC_MUNERATE_ORIGIN;
    const h = await headers();
    const origin =
      envOrigin ||
      `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`;

    const { subject, html, text } = buildInstallEmail({
      domain: site.domain,
      siteId,
      siteTag: site.site_tag,
      origin,
    });
    await sendMail({ to: user.email, subject, html, text });
    await logServerEvent(
      {
        event_name: "install_email_sent",
        user_id: user.id,
        site_id: siteId,
        props: { domain: site.domain },
      },
      { supabase }
    );
  } catch (err) {
    console.error("Failed to send install email:", err);
  }
}

export async function deleteSite(siteId: string): Promise<{ error?: string }> {
  const supabase = await getSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("sites")
    .delete()
    .eq("id", siteId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/sites");
  redirect("/sites");
}


