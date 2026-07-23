import type { MetricRow } from "@/components/plan/metric-table";

export const FORECAST_CAPTION = "Forecast — months from launch";

export const FORECAST_COLUMNS = [
  "M1",
  "M6",
  "M9",
  "M12",
  "M15",
  "M18",
  "M21",
  "M24",
] as const satisfies ReadonlyArray<string>;

export const FORECAST_ROWS = [
  {
    label: "Providers",
    values: ["1", "10", "30", "80", "180", "350", "600", "1K"],
  },
  {
    label: "Queries / month",
    values: ["20K", "200K", "800K", "3M", "10M", "30M", "80M", "180M"],
  },
  {
    label: "GMV / month",
    values: ["$2K", "$20K", "$80K", "$300K", "$1M", "$3M", "$8M", "$18M"],
  },
  {
    label: "MRR",
    values: ["$60", "$600", "$2.4K", "$9K", "$30K", "$90K", "$240K", "$540K"],
    emphasis: true,
  },
] as const satisfies ReadonlyArray<MetricRow>;

export const FORECAST_SUMMARY = {
  m24Annualised: "$6.5M",
  yearThreeFourTarget: "$50–100M ARR",
};
