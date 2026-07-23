import { redirect } from "next/navigation";
import { getCurrentEmail } from "@/lib/auth/session";
import { SectionNav } from "@/components/plan/section-nav";
import { TopBar } from "@/components/plan/top-bar";
import { TimingTracker } from "@/components/analytics/timing-tracker";

export default async function AccessLayout({ children }: { children: React.ReactNode }) {
  const email = await getCurrentEmail();
  if (!email) redirect("/");

  return (
    <div className="min-h-screen bg-ink-900 text-ink-50">
      <TimingTracker />
      <TopBar email={email} />
      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10 sm:px-6">
        <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-60 shrink-0 lg:block">
          <SectionNav />
          <div className="mt-8 px-3 pt-4 border-t hairline font-mono text-[10px] leading-relaxed text-ink-300">
            <div>X-Realm: principal</div>
            <div>X-Requested-By: {email}</div>
          </div>
        </aside>
        <main className="flex-1 min-w-0 pb-24">{children}</main>
      </div>
    </div>
  );
}
