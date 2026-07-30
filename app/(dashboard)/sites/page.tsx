import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import AddDomainDialog from "@/components/AddDomainDialog";

export const runtime = "nodejs";

async function getSeoMetadata(domain: string) {
  try {
    const res = await fetch(`https://${domain}`, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { title: null, description: null };
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) 
                   || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
    
    // Decode basic HTML entities for cleaner display
    const decodeHtml = (str: string) => str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

    return {
      title: titleMatch ? decodeHtml(titleMatch[1].trim()) : null,
      description: descMatch ? decodeHtml(descMatch[1].trim()) : null
    };
  } catch (err) {
    return { title: null, description: null };
  }
}

export default async function SitesIndexPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const modeParam = searchParams?.mode;

  const supabase = await getSupabaseServer();
  const { data: sites } = await supabase
    .from("sites")
    .select("id, domain, created_at")
    .order("created_at", { ascending: true });

  const sitesWithSeo = await Promise.all(
    (sites || []).map(async (site) => {
      const seo = await getSeoMetadata(site.domain);
      return { ...site, ...seo };
    })
  );

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-neo-ink">
            All Sites
          </h1>
          <p className="font-text mt-2 text-sm text-neo-ink/70">
            Select a site to view its analytics and configuration.
          </p>
        </div>
        <AddDomainDialog defaultOpen={modeParam === "new"} />
      </div>

      {sitesWithSeo.length === 0 ? (
        <div className="rounded-neo border-2 border-dashed border-neo-frame bg-neo-card p-8 text-center">
          <p className="font-text text-sm text-neo-ink/80">
            You haven&apos;t added any sites yet.
          </p>
          <p className="font-text mt-1 text-xs text-neo-ink/50">
            Click &quot;Add Site&quot; above to get started.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-6">
          {sitesWithSeo.map((site) => (
            <Link
              key={site.id}
              href={`/sites/${site.id}`}
              className="group flex w-120 flex-col gap-3 rounded-neo border-2 border-neo-frame bg-neo-card p-4 shadow-neo transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-neo-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://favicon.im/${site.domain}`}
                  alt={`${site.domain} favicon`}
                  loading="lazy"
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-sm"
                />
                <h2 className="font-display truncate text-base font-bold text-neo-ink">
                  {site.domain}
                </h2>
              </div>
              <div className="flex-1">
                {site.title && (
                  <p className="font-text text-sm font-semibold text-neo-ink line-clamp-1">
                    {site.title}
                  </p>
                )}
                {site.description && (
                  <p className="font-text mt-1 text-xs text-neo-ink/60 line-clamp-2">
                    {site.description}
                  </p>
                )}
              </div>
              <div className="mt-2 pt-3 border-t-2 border-neo-line flex items-center justify-between">
                <span className="font-text text-[10px] uppercase tracking-widest text-neo-ink/40">
                  {new Date(site.created_at).toLocaleDateString()}
                </span>
                <span className="font-text text-xs font-bold uppercase tracking-wider text-neo-main group-hover:underline">
                  View &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
