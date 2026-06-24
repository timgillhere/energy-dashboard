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
  gridColor: "#1a1a1a",
  tickColor: "#4b5563",
  tooltipBg: "#1e1e1e",
  tooltipBorder: "#2a2a2a",
  tooltipTitle: "#ededed",
  tooltipBody: "#9ca3af",
};
