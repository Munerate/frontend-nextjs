"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Settings, Activity, AlertCircle, Terminal, Trash2, Key, Link2 } from "lucide-react";
import MiddlewarePanel from "@/components/MiddlewarePanel";
import TestMiddlewarePanel from "@/components/TestMiddlewarePanel";
import RefreshButton from "@/components/RefreshButton";
import AnalyticsPanel from "@/components/AnalyticsPanel";
import { deleteSite } from "@/app/(dashboard)/sites/actions";

export default function SiteDashboardClient({
  site,
  rows,
  exactCounts,
  defaultTab,
}: {
  site: any;
  rows: any[];
  exactCounts: any;
  defaultTab: string;
}) {
  // If there are no rows, the user hasn't successfully sent an event yet.
  const hasEvents = rows.length > 0;
  
  // Local state to toggle between Installation steps and the placeholder
  const [markedInstalled, setMarkedInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab);

  const [isPending, startTransition] = useTransition();

  const navItems = [
    { id: "installation", label: "Installation", icon: Terminal, actionRequired: !hasEvents },
    { id: "events", label: "Events", icon: Activity },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // If no events and NOT marked installed, we force them to see the installation flow (no sidebar).
  if (!hasEvents && !markedInstalled) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
          Install AI Traffic Lens on {site.domain}
        </h1>
        <p className="mt-2 mb-10 text-center text-gray-500">
          Follow the steps below to add the tracking snippet to your site.
        </p>

        <div className="w-full flex flex-col gap-8">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <MiddlewarePanel siteId={site.id} tag={site.site_tag} domain={site.domain} />
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <TestMiddlewarePanel siteId={site.id} domain={site.domain} />
          </div>

          <div className="flex justify-center pt-6">
            <button
              onClick={() => setMarkedInstalled(true)}
              className="rounded-md bg-neo-main px-8 py-3 text-lg font-medium text-white shadow-sm transition-colors hover:bg-black/80"
            >
              I have Installed
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Once marked installed (but no events yet) OR has events, show the standard dashboard layout.
  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <div className="flex items-center gap-3">
          <img
            src={`https://favicon.im/${site.domain}`}
            alt={`${site.domain} favicon`}
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-sm"
          />
          <h1 className="text-2xl font-extrabold uppercase leading-[0.95] tracking-tight text-gray-900">
            {site.domain}
          </h1>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Site tag: <span className="font-mono text-gray-800">{site.site_tag}</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          🔒 This tag authenticates your traffic — keep it private.
        </p>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        {/* Left Side Bar */}
        <aside className="w-full shrink-0 md:w-48 lg:w-56">
          <nav className="flex flex-row overflow-x-auto border-b border-gray-200 md:flex-col md:overflow-visible md:border-b-0 gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex shrink-0 w-full items-center whitespace-nowrap rounded-md px-4 py-3 text-sm font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="mr-3 h-4 w-4 shrink-0" />
                  {item.label}
                  {item.actionRequired && (
                    <AlertCircle className="ml-auto h-4 w-4 text-red-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1">
          {activeTab === "installation" && (
            <div className="flex flex-col gap-8">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <MiddlewarePanel siteId={site.id} tag={site.site_tag} domain={site.domain} />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <TestMiddlewarePanel siteId={site.id} domain={site.domain} />
              </div>
            </div>
          )}

          {activeTab === "events" && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Analytics</h2>
                <RefreshButton />
              </div>

              {!hasEvents ? (
                // Placeholder with vibrant fake chart since they clicked "I have Installed"
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] z-10">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-neo-main mb-4" />
                    <p className="text-lg font-semibold text-gray-900">Listening for events...</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Your charts will appear here as soon as we detect bot activity.
                    </p>
                  </div>
                  {/* Vibrant placeholder UI underneath */}
                  <div className="p-8 opacity-40 grayscale pointer-events-none">
                    <div className="flex items-end gap-2 h-64 w-full">
                      {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-1 bg-neo-main rounded-t-sm" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <AnalyticsPanel events={rows} domain={site.domain} exactCounts={exactCounts} />
              )}
            </section>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col gap-8">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
                <h2 className="text-lg font-bold tracking-tight text-gray-900">Project Details</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Link2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 w-20">Domain:</span> {site.domain}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Key className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900 w-20">Site Tag:</span> <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{site.site_tag}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-4 w-4" />
                    <span className="font-medium text-gray-900 w-20">Site ID:</span> <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{site.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-red-900">Danger Zone</h2>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete this project and all of its associated data. This action cannot be undone.
                  </p>
                </div>
                <div className="pt-2 flex">
                  <button
                    disabled={isPending}
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this project?")) {
                        startTransition(() => {
                          deleteSite(site.id);
                        });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isPending ? "Deleting..." : "Delete Project"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
