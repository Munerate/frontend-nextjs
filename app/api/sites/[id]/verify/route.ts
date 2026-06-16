import { resolveTxt } from "dns/promises";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request, ctx: RouteContext<"/api/sites/[id]/verify">) {
  const { id } = await ctx.params;
  const { method } = (await request.json().catch(() => ({}))) as {
    method?: "dns" | "meta";
  };
  if (method !== "dns" && method !== "meta") {
    return Response.json({ ok: false, error: "method must be 'dns' or 'meta'" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  // RLS scopes this to the signed-in owner.
  const { data: site } = await supabase
    .from("sites")
    .select("id, domain, verify_token")
    .eq("id", id)
    .single();
  if (!site) {
    return Response.json({ ok: false, error: "Site not found" }, { status: 404 });
  }

  let verified = false;
  let detail = "";

  try {
    if (method === "dns") {
      const records = await resolveTxt(`_munerate.${site.domain}`);
      const flat = records.map((r) => r.join("")).map((s) => s.trim());
      verified = flat.includes(site.verify_token);
      detail = verified
        ? "TXT record matched."
        : `No matching TXT record at _munerate.${site.domain}.`;
    } else {
      const res = await fetch(`https://${site.domain}`, {
        headers: { "user-agent": "munerate-verifier" },
        redirect: "follow",
      });
      const html = await res.text();
      const re = new RegExp(
        `<meta[^>]+name=["']munerate-site-verification["'][^>]+content=["']${escapeRe(
          site.verify_token
        )}["']`,
        "i"
      );
      // Also match attribute order reversed (content before name).
      const reAlt = new RegExp(
        `<meta[^>]+content=["']${escapeRe(
          site.verify_token
        )}["'][^>]+name=["']munerate-site-verification["']`,
        "i"
      );
      verified = re.test(html) || reAlt.test(html);
      detail = verified ? "Meta tag matched." : "No matching meta tag found on the homepage.";
    }
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Verification check failed" },
      { status: 502 }
    );
  }

  if (!verified) {
    return Response.json({ ok: false, error: detail });
  }

  const { error } = await supabase
    .from("sites")
    .update({ verified_at: new Date().toISOString(), verify_method: method })
    .eq("id", id);
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, detail });
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
