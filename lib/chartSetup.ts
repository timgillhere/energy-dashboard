import {
  Chart,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

Chart.register(
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
);

export const CHART_DEFAULTS = {
  gridColor: "rgba(255,0,110,0.12)",
  tickColor: "rgba(240,238,255,0.45)",
  tooltipBg: "#0C0C1A",
  tooltipBorder: "rgba(255,0,110,0.60)",
  tooltipTitle: "#F0EEFF",
  tooltipBody: "rgba(240,238,255,0.70)",
};
