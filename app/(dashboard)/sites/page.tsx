import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Default dashboard entry: jump to the first site, or the add-domain form.
export default async function SitesIndexPage() {
  const supabase = await getSupabaseServer();
  const { data: sites } = await supabase
    .from("sites")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (sites && sites.length > 0) redirect(`/sites/${sites[0].id}`);
  redirect("/sites/new");
}
