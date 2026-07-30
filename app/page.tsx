import Link from "next/link";
import Brand from "@/components/Brand";
import LandingForm from "@/components/LandingForm";
import { getSupabaseServer } from "@/lib/supabase/server";
import HeaderAuth from "@/components/HeaderAuth";
import FlowchartAnimation from "@/components/FlowchartAnimation";

export default async function Home() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col bg-white text-gray-900">
      {/* Top bar — clean white sticky header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 px-6 py-4 backdrop-blur-md sm:px-10 md:py-5">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Brand
            href="/"
            size="lg"
            className="text-gray-900"
            tile
            tileFill="#000000"
            barFill="#ffffff"
          />
          <div className="flex items-center gap-4">
            <HeaderAuth user={user} />
          </div>
        </div>
      </header>

      {/* Main minimal hero section */}
      <div className="flex items-center justify-center px-6 py-20 sm:px-10">
        <LandingForm user={user} />
      </div>

      {/* What you get Flowchart */}
      <div className="flex flex-col items-center justify-center px-6 pb-20 sm:px-10">
        <FlowchartAnimation />
      </div>

      <footer className="border-t border-gray-100 bg-white px-6 py-8 text-gray-500 sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Brand
            href="/"
            size="sm"
            className="text-gray-900 opacity-70 grayscale"
            tile
            tileFill="#000000"
            barFill="#ffffff"
          />
          <span className="text-xs font-medium">
            © {2026} AI Traffic Lens
          </span>
        </div>
      </footer>
    </main>
  );
}
