import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import SignOut from "@/components/SignOut";

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
    <div className="flex flex-1">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-accent-bg/30 px-3 py-5">
        <Link
          href="/sites"
          className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-text-h"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            M
          </span>
          Munerate
        </Link>

        <nav className="flex flex-col gap-0.5">
          <Link
            href="/sites/new"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-text-h transition-colors hover:bg-accent-bg"
          >
            <svg className="h-4 w-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add domain
          </Link>
        </nav>

        <div className="mt-6 mb-1.5 px-2.5 text-xs font-semibold uppercase tracking-wider text-text">
          Sites
        </div>
        <nav className="flex flex-col gap-0.5">
          {(sites ?? []).map((s) => (
            <Link
              key={s.id}
              href={`/sites/${s.id}`}
              className="group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-text-h transition-colors hover:bg-accent-bg"
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
            <p className="px-2.5 py-2 text-sm text-text">No sites yet.</p>
          )}
        </nav>

        <div className="mt-5 border-t border-border pt-4">
          <div className="mb-2 truncate px-2.5 text-xs text-text">{user.email}</div>
          <SignOut />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
