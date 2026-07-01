import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import SignOut from "@/components/SignOut";
import Brand from "@/components/Brand";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sites } = await supabase
    .from("sites")
    .select("id, domain")
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 bg-neo-canvas text-neo-ink">
      <aside className="flex w-64 shrink-0 flex-col border-r border-neo-line bg-neo-paper px-3 py-5">
        <Brand className="mb-6 px-2" tileFill="var(--field-a)" barFill="#ffffff" />

        <nav className="flex flex-col gap-0.5">
          <Link
            href="/sites/new"
            className="font-text flex items-center gap-2.5 rounded-neo px-2.5 py-2 text-sm font-semibold text-neo-ink transition-colors hover:bg-neo-card"
          >
            <svg className="h-4 w-4 text-field-b" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add domain
          </Link>
        </nav>

        <div className="font-text mt-6 mb-1.5 px-2.5 text-xs font-bold uppercase tracking-wider text-neo-ink/50">
          Sites
        </div>
        <nav className="flex flex-col gap-0.5">
          {(sites ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/sites/${s.id}`}
              className="font-text group flex items-center gap-2.5 rounded-neo px-2.5 py-2 text-sm text-neo-ink transition-colors hover:bg-neo-card"
            >
              <img
                src={`https://favicon.im/${s.domain}`}
                alt={`${s.domain} favicon`}
                loading="lazy"
                width={16}
                height={16}
                className="h-4 w-4 shrink-0 rounded-sm"
              />
              <span className="truncate">{s.domain}</span>
            </Link>
          ))}
          {(sites ?? []).length === 0 && (
            <p className="font-text px-2.5 py-2 text-sm text-neo-ink/60">No sites yet.</p>
          )}
        </nav>

        <div className="mt-5 border-t border-neo-line pt-4">
          <div className="font-text mb-2 truncate px-2.5 text-xs text-neo-ink/60">{user.email}</div>
          <SignOut />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
