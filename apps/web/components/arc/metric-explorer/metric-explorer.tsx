"use client";

import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { LineChart, type LineChartSeries, type LineChartDatum } from "../line-chart/line-chart";
import styles from "./metric-explorer.module.css";

const RANGES = [
  { label: "7d",  days: 7  },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export interface MetricPoint {
  date: string;   // ISO "YYYY-MM-DD"
  label: string;  // e.g. "Aug 1"
  value: number;
}

export interface MetricExplorerProps {
  title: string;
  metricLabel: string;
  data: MetricPoint[];
  unit?: string;
  formatValue?: (n: number) => string;
  showRangeFilter?: boolean;
  showComparison?: boolean;
  showKpi?: boolean;
  showLegend?: boolean;
  chartHeight?: number;
  seriesColor?: string;
}

function compactFmt(n: number, unit = "") {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M${unit}`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K${unit}`;
  return `${n.toLocaleString()}${unit}`;
}

const EASE = [0.4, 0, 0.2, 1] as const;

export function MetricExplorer({
  title,
  metricLabel,
  data,
  unit = "",
  formatValue,
  showRangeFilter = true,
  showComparison = true,
  showKpi = true,
  showLegend = false,
  chartHeight = 160,
  seriesColor = "oklch(0.62 0.22 257)",
}: MetricExplorerProps) {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [hidden, setHidden] = useState<string[]>([]);
  useEffect(() => { setHidden([]); }, [showComparison]);
  const days = RANGES[rangeIdx]!.days;

  const sorted = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data],
  );

  const current  = useMemo(() => sorted.slice(-days), [sorted, days]);
  const previous = useMemo(() => {
    const end = sorted.length - days;
    return sorted.slice(Math.max(0, end - days), end);
  }, [sorted, days]);

  const total     = current.reduce((s, d) => s + d.value, 0);
  const prevTotal = previous.reduce((s, d) => s + d.value, 0);
  const pct       = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0;
  const isUp      = pct >= 0;
  const display   = formatValue ? formatValue(total) : compactFmt(total, unit);
  const changeStr = `${isUp ? "+" : ""}${pct.toFixed(1)}% vs prev ${RANGES[rangeIdx]!.label}`;

  const step = Math.max(1, Math.floor(current.length / 4));

  const series: LineChartSeries[] = [
    { key: "value", label: metricLabel,       area: true,   color: seriesColor },
    ...(showComparison
      ? [{ key: "prev", label: "Prev. period", dashed: true, color: "oklch(0.50 0 0)" }]
      : []),
  ];

  const lineData: LineChartDatum[] = current.map((d, i) => ({
    key:       d.date,
    label:     d.label,
    axisLabel: i === 0 || i === current.length - 1 || i % step === 0 ? d.label : undefined,
    values: {
      value: d.value,
      ...(showComparison ? { prev: previous[i]?.value ?? 0 } : {}),
    },
  }));

  const hasTitle = !!title;
  // No title + range filter on + KPI on → merge tabs into KPI label row
  const inlineFilter = !hasTitle && showRangeFilter && showKpi;
  // Separate header when title exists OR filter is on but can't merge into KPI
  const showHeaderSection = hasTitle || (showRangeFilter && !inlineFilter);

  const tabsJSX = (
    <div className={styles.tabs} role="group" aria-label="Time range">
      {RANGES.map((r, i) => (
        <button
          key={r.label}
          className={styles.tab}
          data-active={i === rangeIdx || undefined}
          onClick={() => setRangeIdx(i)}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.card}>
      <AnimatePresence initial={false}>
        {showHeaderSection && (
          <motion.div
            key="header"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [...EASE] }}
            style={{ overflow: "hidden", marginBottom: "calc(-1 * var(--space-5))" }}
          >
            <div className={styles.header} style={{ paddingBottom: "var(--space-5)" }}>
              {hasTitle && <span className={styles.title}>{title}</span>}
              {showRangeFilter && tabsJSX}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {showKpi && (
          <motion.div
            key="kpi"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [...EASE] }}
            style={{ overflow: "hidden", marginBottom: "calc(-1 * var(--space-5))" }}
          >
            <div className={styles.kpi} style={{ paddingBottom: "var(--space-5)" }}>
              {inlineFilter ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <p className={styles.kpiLabel}>{metricLabel}</p>
                  {tabsJSX}
                </div>
              ) : (
                <p className={styles.kpiLabel}>{metricLabel}</p>
              )}
              <p className={styles.kpiValue}>{display}</p>
              <p className={styles.kpiChange} data-up={isUp || undefined} data-down={!isUp || undefined}>
                {changeStr}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LineChart
        data={lineData}
        series={series}
        label={metricLabel}
        unit={unit}
        height={chartHeight}
        legend={showLegend}
        hiddenSeries={hidden}
        onHiddenSeriesChange={setHidden}
      />
    </div>
  );
}
