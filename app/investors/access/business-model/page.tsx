import { PageShell } from "@/components/plan/page-shell";
import { MetricTable } from "@/components/plan/metric-table";
import CommissionEconomics from "@/components/plan/diagrams/commission-economics";
import ForecastCurve from "@/components/plan/diagrams/forecast-curve";
import { getSection } from "@/lib/plan-data/sections";
import {
  FORECAST_CAPTION,
  FORECAST_COLUMNS,
  FORECAST_ROWS,
  FORECAST_SUMMARY,
} from "@/lib/plan-data/financials";

export default function BusinessModelPage() {
  const section = getSection("business-model");
  if (!section) throw new Error("Missing business-model section");

  return (
    <PageShell section={section}>
      <div className="prose-plan max-w-prose">
        <h2>5.1 What Munerate is, economically</h2>
        <p>
          Munerate is the payment rail between AI assistants and the content they consume.
          Infrastructure, not a marketplace. Platforms integrate once for all their creators
          (YouTube, Spotify, Substack); enterprise publishers install at the edge alongside existing
          paywalls (NYT, Bloomberg, Reuters); structured-data providers onboard with data
          reformatting (ISO, registries, research databases). Agent traffic that was previously
          extracted for free now pays.
        </p>

        <h2>5.2 Commission</h2>
      </div>

      <CommissionEconomics />

      <div className="prose-plan max-w-prose">
        <p>
          The commission structure will be finalised based on market testing and validation of what
          providers and agents will actually pay for — calibrated against payment-infrastructure
          benchmarks rather than marketplace rates. The design principle is clear: the rate has to
          be low enough that no provider has any justification to build their own rail — in the low
          single digits as a percentage of transaction value. Priced correctly, Munerate is
          positioned to become the default layer — a fee no provider has any incentive to route
          around.
        </p>
        <blockquote>Blended gross margin approaches 90% at scale.</blockquote>

        <h2>5.3 Forecast</h2>
      </div>

      <ForecastCurve />

      <MetricTable
        caption={FORECAST_CAPTION}
        columns={FORECAST_COLUMNS}
        rows={FORECAST_ROWS}
      />

      <div className="prose-plan max-w-prose">
        <p>
          Month-24 annualised run-rate: approximately{" "}
          <strong>{FORECAST_SUMMARY.m24Annualised}</strong> (the $540K MRR shown above, annualised). A{" "}
          <strong>{FORECAST_SUMMARY.yearThreeFourTarget}</strong> infrastructure business with the
          incumbent-protocol position is the year-three and year-four outcome.
        </p>
        <p>
          The provider curve compounds across three parallel motions. Months 1–6: three to five
          design partners live across integration modes, proving the payment loop. From month 6,
          enterprise sales adds providers steadily while self-serve long-tail begins contributing
          without sales resource. The month 12–18 GMV inflection assumes one to two mid-scale
          platform integrations landing — each bringing many providers on in a single event. No
          single platform deal is load-bearing; the base case reaches month-24 ARR on enterprise and
          self-serve alone.
        </p>
      </div>
    </PageShell>
  );
}
