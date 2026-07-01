"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { buildInstallEmail } from "@/lib/install-email";
import { sendMail } from "@/lib/mailer";

function normalizeDomain(input: string): string {
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return d;
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
      if (existing) return { id: existing.id, created: false };
    }
    return { error: error.message };
  }

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
  } catch (err) {
    console.error("Failed to send install email:", err);
  }
}

export async function addDomain(formData: FormData) {
  const result = await createSiteForCurrentUser(String(formData.get("domain") ?? ""));
  if ("error" in result) {
    redirect(`/sites/new?error=${encodeURIComponent(result.error)}`);
  }
  // Email the install instructions once, only for a freshly created site.
  if (result.created) {
    await sendInstallEmail(result.id);
  }
  // Refresh the dashboard layout so the sidebar picks up the new site.
  revalidatePath("/", "layout");
  redirect(`/sites/${result.id}`);
}
