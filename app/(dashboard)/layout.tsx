import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import SignOut from "@/components/SignOut";
import Brand from "@/components/Brand";
import SiteSwitcher from "@/components/SiteSwitcher";

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
    <div className="flex min-h-screen flex-col bg-neo-canvas text-neo-ink">
      <header className="flex h-16 shrink-0 items-center justify-center border-b border-neo-line bg-neo-paper px-6 sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Brand tileFill="var(--field-a)" barFill="#ffffff" />
            <div className="h-6 w-px bg-neo-line" />
            <SiteSwitcher sites={sites ?? []} />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-neo-line pl-4">
              <span className="font-text text-sm text-neo-ink/60 truncate max-w-[150px]">{user.email}</span>
              <SignOut />
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:px-10 flex flex-col">
        <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
