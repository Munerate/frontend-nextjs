"use client";

import { useState, useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, ChevronLeft, ChevronRight } from "lucide-react";

type EventRow = {
  ts: string;
  category: string;
  bot_name: string | null;
  provider: string | null;
  path: string | null;
  referrer: string | null;
  blocked: boolean;
};

export default function PricingPanel({ events, domain }: { events: EventRow[], domain?: string }) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const {
    currentMonthEarnings,
    percentChange,
    yearlyEstimation,
    topEarnerPath,
    topEarnerEarnings,
    totalEarningPages,
    sparklineData,
    tableData,
    totalPages,
  } = useMemo(() => {
    // 1. Filter events
    const isContentPath = (path: string | null) => {
      if (!path) return false;
      return !path.includes('.');
    };

    const validEvents = events.filter((e) => isContentPath(e.path));

    // Dynamic cost per path (mocking AI/demand logic)
    const getCostForPath = (path: string) => {
      let hash = 0;
      for (let i = 0; i < path.length; i++) {
        hash = path.charCodeAt(i) + ((hash << 5) - hash);
      }
      return 0.001 + (Math.abs(hash) % 50) / 1000;
    };

    // 2. Date ranges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDayOfMonth = now.getDate();

    let cme = 0;
    let pme = 0;
    
    // For the sparkline
    const sparklineMap = new Map<number, number>();
    for (let i = 1; i <= daysInMonth; i++) {
      sparklineMap.set(i, 0);
    }

    const pathCounts: Record<string, number> = {};
    const pathEarnings: Record<string, number> = {};

    validEvents.forEach((e) => {
      const d = new Date(e.ts);
      const m = d.getMonth();
      const y = d.getFullYear();
      const p = e.path || "/";
      const cost = getCostForPath(p);

      // Count for all-time / path
      pathCounts[p] = (pathCounts[p] || 0) + 1;
      pathEarnings[p] = (pathEarnings[p] || 0) + cost;

      if (y === currentYear && m === currentMonth) {
        cme += cost;
        const day = d.getDate();
        sparklineMap.set(day, (sparklineMap.get(day) || 0) + cost);
      } else if (
        (y === currentYear && m === currentMonth - 1) ||
        (currentMonth === 0 && y === currentYear - 1 && m === 11)
      ) {
        pme += cost;
      }
    });

    let pct = 0;
    if (pme === 0) {
      pct = cme > 0 ? 100 : 0;
    } else {
      pct = ((cme - pme) / pme) * 100;
    }

    const avgDaily = cme / Math.max(1, currentDayOfMonth); // avoid div by 0 just in case
    const ye = avgDaily * 365;

    let topPath = "-";
    let maxEarnings = 0;
    for (const [path, earnings] of Object.entries(pathEarnings)) {
      if (earnings > maxEarnings) {
        maxEarnings = earnings;
        topPath = path;
      }
    }

    const sData = Array.from(sparklineMap.entries()).map(([day, earnings]) => ({
      day,
      earnings,
    }));

    const tData = Object.entries(pathCounts)
      .map(([path, count]) => ({
        path,
        count,
        costPerReq: getCostForPath(path),
        earnings: pathEarnings[path],
      }))
      .sort((a, b) => b.earnings - a.earnings);

    const ITEMS_PER_PAGE = 20;
    const totalPages = Math.ceil(tData.length / ITEMS_PER_PAGE);

    return {
      currentMonthEarnings: cme,
      percentChange: pct,
      yearlyEstimation: ye,
      topEarnerPath: topPath,
      topEarnerEarnings: maxEarnings,
      totalEarningPages: tData.length,
      sparklineData: sData,
      tableData: tData,
      totalPages,
    };
  }, [events]);

  const ITEMS_PER_PAGE = 20;
  const paginatedData = tableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-neo border-2 border-neo-frame bg-slate-900 p-6 shadow-neo">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-extrabold uppercase tracking-tight text-slate-50">
              Dynamic Pricing
            </h2>
            <p className="font-text text-sm text-slate-400">
              Assigning a dynamic $ value to your app&apos;s content paths based on demand and bot activity.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {/* Earnings This Month */}
        <div className="flex flex-col gap-4 rounded-neo border-2 border-green-500/30 bg-slate-900 p-6 shadow-neo relative overflow-hidden">
          <div className="relative z-10 flex flex-col gap-1">
            <span className="font-text text-xs font-bold uppercase tracking-wider text-slate-400">Earnings This Month</span>
            <div className="flex items-end gap-2">
              <span className="font-display text-4xl font-extrabold text-slate-50">${currentMonthEarnings.toFixed(2)}</span>
              <div className={`flex items-center text-sm font-bold ${percentChange > 0 ? 'text-green-400' : percentChange < 0 ? 'text-red-400' : 'text-slate-400'} mb-1`}>
                {percentChange > 0 ? <TrendingUp className="mr-1 h-4 w-4" /> : percentChange < 0 ? <TrendingDown className="mr-1 h-4 w-4" /> : <Minus className="mr-1 h-4 w-4" />}
                {Math.abs(percentChange).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 -right-2 h-24 opacity-60 pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <Area type="monotone" dataKey="earnings" stroke="#4ade80" fill="#166534" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Estimation for Year */}
        <div className="flex flex-col gap-4 rounded-neo border-2 border-yellow-500/30 bg-slate-900 p-6 shadow-neo">
          <div className="flex flex-col gap-1">
            <span className="font-text text-xs font-bold uppercase tracking-wider text-slate-400">Estimations (Yearly)</span>
            <span className="font-display text-4xl font-extrabold text-slate-50">${yearlyEstimation.toFixed(2)}</span>
            <span className="font-text text-xs text-slate-500 mt-2">Based on current month run-rate</span>
          </div>
        </div>

        {/* Top Earner */}
        <div className="flex flex-col gap-4 rounded-neo border-2 border-blue-500/30 bg-slate-900 p-6 shadow-neo">
          <div className="flex flex-col gap-1 overflow-hidden">
            <span className="font-text text-xs font-bold uppercase tracking-wider text-slate-400">Top Earner Page</span>
            <span className="font-display text-2xl font-extrabold text-slate-50 truncate" title={topEarnerPath === "/" ? (domain || "Homepage") : topEarnerPath}>
              {topEarnerPath === "/" ? (domain || "Homepage") : topEarnerPath}
            </span>
            <div className="mt-2 inline-flex items-center self-start rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-bold text-slate-200">
              ${topEarnerEarnings.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Total Pages */}
        <div className="flex flex-col gap-4 rounded-neo border-2 border-purple-500/30 bg-slate-900 p-6 shadow-neo">
          <div className="flex flex-col gap-1">
            <span className="font-text text-xs font-bold uppercase tracking-wider text-slate-400">Total Earning Pages</span>
            <span className="font-display text-4xl font-extrabold text-slate-50">{totalEarningPages}</span>
            <span className="font-text text-xs text-slate-500 mt-2">Unique content paths</span>
          </div>
        </div>
      </div>

      <div className="rounded-neo border-2 border-slate-700 bg-slate-900 shadow-neo overflow-hidden flex flex-col">
        <div className="border-b-2 border-slate-700 bg-slate-800 p-4">
          <h3 className="font-display text-md font-bold uppercase tracking-wide text-slate-50">Page Performance</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left font-text text-sm">
            <thead className="border-b-2 border-slate-700 bg-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-bold uppercase text-slate-400">Page</th>
                <th className="p-4 font-bold uppercase text-slate-400 text-right">Cost / Req</th>
                <th className="p-4 font-bold uppercase text-slate-400 text-right">Visits</th>
                <th className="p-4 font-bold uppercase text-slate-400 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No content events recorded yet.</td>
                </tr>
              ) : (
                paginatedData.map((row, i) => (
                  <tr key={row.path} className={`border-b border-slate-700/50 last:border-0 ${i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/40'} hover:bg-slate-800/60 transition-colors`}>
                    <td className="p-4 font-mono text-slate-300 max-w-[300px] truncate" title={row.path === "/" ? (domain || "Homepage") : row.path}>{row.path === "/" ? (domain || "Homepage") : row.path}</td>
                    <td className="p-4 font-bold text-slate-400 text-right">${row.costPerReq.toFixed(3)}</td>
                    <td className="p-4 font-bold text-slate-200 text-right">{row.count.toLocaleString()}</td>
                    <td className="p-4 font-bold text-green-400 text-right">${row.earnings.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t-2 border-slate-700 bg-slate-800 p-4">
            <span className="font-text text-sm text-slate-400">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, tableData.length)} of {tableData.length} entries
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center rounded border border-slate-600 bg-slate-700 p-1 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-text text-sm font-bold text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center rounded border border-slate-600 bg-slate-700 p-1 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:hover:bg-slate-700"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
