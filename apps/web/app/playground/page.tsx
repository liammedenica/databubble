"use client";

import { useState, useEffect } from "react";
import { DashboardSandbox } from "./dashboard-sandbox";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/components/theme-provider";
import { LineChart } from "@/components/arc/line-chart/line-chart";
import { BarChart } from "@/components/arc/bar-chart/bar-chart";
import { Sparkline } from "@/components/arc/sparkline/sparkline";
import { Gauge, type GaugeThreshold } from "@/components/arc/gauge/gauge";
import { MetricCard } from "@/components/arc/metric-card/metric-card";
import { MetricExplorer, type MetricPoint } from "@/components/arc/metric-explorer/metric-explorer";
import { DonutChart, type DonutChartDatum } from "@/components/arc/donut-chart/donut-chart";
import { WaffleChart, type WaffleCategory } from "@/components/arc/waffle-chart/waffle-chart";
import { ActivityHeatmap, type ActivityDay } from "@/components/arc/activity-heatmap/activity-heatmap";
import { Treemap, type TreemapNode } from "@/components/arc/treemap/treemap";
import { BrushChart, type BrushChartDatum, type BrushChartAnnotation } from "@/components/arc/brush-chart/brush-chart";
import { SortableDataTable, type DataColumn } from "@/components/arc/sortable-data-table/sortable-data-table";
import { ColorPicker } from "@/components/arc/color-picker/color-picker";

// ── Deterministic data ─────────────────────────────────────────────────────
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 0x100000000; };
}
function makeDailyData(days: number, base: number, amp: number, seed = 1): MetricPoint[] {
  const rng = seeded(seed);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date("2024-05-01");
    d.setDate(d.getDate() + i);
    return {
      date:  d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: Math.round(base + Math.sin(i / 7) * amp + rng() * amp * 0.4),
    };
  });
}
const DAILY_SIGNUPS  = makeDailyData(90, 240, 55, 1);
const DAILY_REVENUE  = makeDailyData(90, 8200, 2000, 7);
const DAILY_SESSIONS = makeDailyData(90, 4100, 900, 13);
const SPARK_VALUES   = [42, 38, 51, 67, 59, 74, 88, 81, 95, 103, 97, 112];

const RANGE_OPTS = [
  { label: "7d",  days: 7  },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "60d", days: 60 },
  { label: "90d", days: 90 },
];
const COLORS = [
  { label: "Blue",   v: "oklch(0.62 0.22 257)" },
  { label: "Violet", v: "oklch(0.60 0.22 290)" },
  { label: "Teal",   v: "oklch(0.60 0.17 195)" },
  { label: "Rose",   v: "oklch(0.62 0.22 10)"  },
  { label: "Amber",  v: "oklch(0.68 0.18 75)"  },
  { label: "Green",  v: "oklch(0.58 0.18 150)" },
  { label: "Pink",   v: "oklch(0.62 0.20 340)" },
  { label: "Slate",  v: "oklch(0.55 0.04 240)" },
];
type Dataset = "signups" | "revenue" | "sessions";
const DATASETS: { label: string; value: Dataset }[] = [
  { label: "Signups",  value: "signups"  },
  { label: "Revenue",  value: "revenue"  },
  { label: "Sessions", value: "sessions" },
];
function getDataset(d: Dataset) {
  return d === "revenue" ? DAILY_REVENUE : d === "sessions" ? DAILY_SESSIONS : DAILY_SIGNUPS;
}
function sliceData(data: MetricPoint[], days: number) {
  return [...data].sort((a, b) => a.date.localeCompare(b.date)).slice(-days);
}

// ── Shared card wrapper that lives ON the chart ────────────────────────────
function FilterPills({ days, onDaysChange }: { days: number; onDaysChange: (d: number) => void }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
      {RANGE_OPTS.map(r => (
        <button key={r.label} onClick={() => onDaysChange(r.days)}
          className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
            ${days === r.days
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"}`}>
          {r.label}
        </button>
      ))}
    </div>
  );
}

const ANIM_EASE = [0.4, 0, 0.2, 1] as const;

interface ChartCardProps {
  title?: string;
  showTitle: boolean;
  showDateFilter: boolean;
  days: number;
  onDaysChange: (d: number) => void;
  width: number;
  noPad?: boolean;
  children: React.ReactNode;
}
function ChartCard({ title, showTitle, showDateFilter, days, onDaysChange, width, noPad, children }: ChartCardProps) {
  const hasTitle = showTitle && !!title;
  return (
    <div style={{ width: `${width}px`, maxWidth: "100%" }}
      className="rounded-xl border bg-card overflow-hidden">
      <AnimatePresence initial={false}>
        {hasTitle && (
          <motion.div
            key="header"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: ANIM_EASE }}
            style={{ overflow: "hidden" }}
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-0 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              {showDateFilter && <FilterPills days={days} onDaysChange={onDaysChange} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={noPad ? "" : "p-5 pt-4"}>
        {children}
      </div>
    </div>
  );
}

// ── Settings primitives ────────────────────────────────────────────────────
function SLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-5 mb-2 first:mt-0">{children}</p>;
}
function SDivider() { return <div className="border-t my-4" />; }

function SToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer select-none">
      <span className="text-sm text-foreground">{label}</span>
      <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${checked ? "bg-blue-500" : "bg-muted-foreground/25"}`}>
        <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[14px]" : ""}`} />
      </button>
    </label>
  );
}

function SSlider({ label, value, min, max, step = 1, unit = "px", onChange }: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void;
}) {
  return (
    <div className="py-1">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground tabular-nums">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 rounded-full appearance-none bg-border cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-sm" />
    </div>
  );
}

function SInput({ label, value, onChange, type = "text" }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string;
}) {
  return (
    <div className="py-1">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm text-foreground
          outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors" />
    </div>
  );
}


function SSegment<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { label: string; value: T }[]; onChange: (v: T) => void;
}) {
  return (
    <div className="py-1">
      {label && <p className="text-xs text-muted-foreground mb-1.5">{label}</p>}
      <div className="flex gap-1">
        {options.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors
              ${value === o.value ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReplayBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full py-1.5 rounded-lg border text-xs font-medium text-muted-foreground
        hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M10.5 2A5 5 0 1 0 11 6.5"/><path d="M11 2v3h-3"/>
      </svg>
      Replay animations
    </button>
  );
}

function Settings({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-60 shrink-0 border-l bg-card flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Settings</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
    </aside>
  );
}

function Preview({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-auto p-10 bg-muted/20 flex items-start justify-center">
      {children}
    </div>
  );
}

// ── Shared size + card controls (used by every sandbox) ────────────────────
interface CardControls {
  title: string; setTitle: (v: string) => void;
  showTitle: boolean; setShowTitle: (v: boolean) => void;
  showDateFilter: boolean; setShowDateFilter: (v: boolean) => void;
  days: number; setDays: (v: number) => void;
  width: number; setWidth: (v: number) => void;
  height: number; setHeight: (v: number) => void;
}
function useCardControls(defaults?: { title?: string; width?: number; height?: number }): CardControls {
  const [title,          setTitle]          = useState(defaults?.title  ?? "Chart");
  const [showTitle,      setShowTitle]      = useState(true);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [days,           setDays]           = useState(30);
  const [width,          setWidth]          = useState(defaults?.width  ?? 560);
  const [height,         setHeight]         = useState(defaults?.height ?? 220);
  return { title, setTitle, showTitle, setShowTitle, showDateFilter, setShowDateFilter, days, setDays, width, setWidth, height, setHeight };
}
function CardSettings({ c, children }: { c: CardControls; children?: React.ReactNode }) {
  return (
    <>
      <SLabel>Card</SLabel>
      <SInput label="Title" value={c.title} onChange={c.setTitle} />
      <SToggle label="Show title"        checked={c.showTitle}      onChange={c.setShowTitle}      />
      <SToggle label="Date range filter" checked={c.showDateFilter} onChange={c.setShowDateFilter} />
      {children}
    </>
  );
}
function SizeSettings({ c }: { c: CardControls }) {
  return (
    <>
      <SLabel>Size</SLabel>
      <SSlider label="Width"  value={c.width}  min={280} max={900} onChange={c.setWidth}  />
      <SSlider label="Height" value={c.height} min={100} max={480} onChange={c.setHeight} />
    </>
  );
}

// ── METRIC EXPLORER ────────────────────────────────────────────────────────
function ExplorerSandbox() {
  const [key,        setKey]       = useState(0);
  const [ds,         setDs]        = useState<Dataset>("signups");
  const [comp,       setComp]      = useState(true);
  const [showKpi,    setShowKpi]   = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [color,      setColor]     = useState(COLORS[0]!.v);
  const c = useCardControls({ title: "Daily signups", width: 520, height: 160 });

  return (
    <>
      <Preview>
        <div style={{ width: `${c.width}px`, maxWidth: "100%" }}>
          <MetricExplorer key={key}
            title={c.showTitle ? c.title : ""}
            metricLabel={ds === "revenue" ? "Revenue" : ds === "sessions" ? "Sessions" : "Signups"}
            data={getDataset(ds)}
            showRangeFilter={c.showDateFilter}
            showComparison={comp}
            showKpi={showKpi}
            showLegend={showLegend}
            chartHeight={c.height}
            seriesColor={color}
          />
        </div>
      </Preview>
      <Settings>
        <CardSettings c={c} />
        <SDivider />
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={DATASETS} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="KPI readout"     checked={showKpi}    onChange={setShowKpi}    />
        <SToggle label="Legend"          checked={showLegend} onChange={setShowLegend} />
        <SToggle label="Comparison line" checked={comp}       onChange={setComp}       />
        <SDivider />
        <ColorPicker className="w-full" label="Series colour" value={color} onValueChange={setColor} />
        <SDivider />
        <SizeSettings c={c} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── LINE CHART ─────────────────────────────────────────────────────────────
function LineChartSandbox() {
  const [key, setKey]             = useState(0);
  const c                         = useCardControls({ title: "Revenue trend", width: 580 });
  const [ds, setDs]               = useState<Dataset>("revenue");
  const [curve, setCurve]         = useState<"smooth" | "linear">("smooth");
  const [showArea, setShowArea]   = useState(true);
  const [showKpi, setShowKpi]     = useState(false);
  const [showLegend, setLeg]      = useState(true);
  const [showS2, setS2]           = useState(true);
  const [s1Label, setS1L]         = useState("This period");
  const [s2Label, setS2L]         = useState("Prev. period");
  const [s1Color, setS1C]         = useState(COLORS[0]!.v);
  const [s2Color, setS2C]         = useState(COLORS[7]!.v);
  const [hidden, setHidden]       = useState<string[]>([]);

  const all    = getDataset(ds);
  const sorted = [...all].sort((a, b) => a.date.localeCompare(b.date));
  const curr   = sorted.slice(-c.days);
  const prev   = sorted.slice(Math.max(0, sorted.length - c.days * 2), sorted.length - c.days);
  const step   = Math.max(1, Math.floor(curr.length / 5));

  const lineData = curr.map((d, i) => ({
    key: d.date, label: d.label,
    axisLabel: i === 0 || i === curr.length - 1 || i % step === 0 ? d.label : undefined,
    values: { s1: d.value, ...(showS2 ? { s2: prev[i]?.value ?? 0 } : {}) },
  }));
  const series = [
    { key: "s1", label: s1Label, area: showArea, color: s1Color },
    ...(showS2 ? [{ key: "s2", label: s2Label, dashed: true, color: s2Color }] : []),
  ];

  const kpiTotal = curr.reduce((s, d) => s + d.value, 0);
  const prevTotal = prev.reduce((s, d) => s + d.value, 0);
  const kpiPct = prevTotal > 0 ? ((kpiTotal - prevTotal) / prevTotal) * 100 : 0;
  const kpiIsUp = kpiPct >= 0;
  const kpiFmt = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}K` : String(Math.round(n));

  const hasTitle = c.showTitle && !!c.title;
  const mergeFilterIntoKpi = c.showDateFilter && !hasTitle && showKpi;
  const floatFilter        = c.showDateFilter && !hasTitle && !showKpi;

  return (
    <>
      <Preview>
        <ChartCard {...c} onDaysChange={c.setDays}>
          <AnimatePresence initial={false}>
            {floatFilter && (
              <motion.div key="float-filter"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: ANIM_EASE }} style={{ overflow: "hidden" }}>
                <div className="flex justify-end mb-3">
                  <FilterPills days={c.days} onDaysChange={c.setDays} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {showKpi && (
              <motion.div key="kpi"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: ANIM_EASE }} style={{ overflow: "hidden" }}>
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{s1Label}</p>
                    {mergeFilterIntoKpi && <FilterPills days={c.days} onDaysChange={c.setDays} />}
                  </div>
                  <p className="text-2xl font-semibold tabular-nums text-foreground leading-none mt-0.5">{kpiFmt(kpiTotal)}</p>
                  <p className={`text-xs font-medium mt-1 ${kpiIsUp ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    {kpiIsUp ? "+" : ""}{kpiPct.toFixed(1)}% vs prev {c.days}d
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <LineChart key={key} data={lineData} series={series}
            label={s1Label} height={c.height} curve={curve}
            legend={showLegend}
            hiddenSeries={hidden}
            onHiddenSeriesChange={setHidden} />
        </ChartCard>
      </Preview>
      <Settings>
        <CardSettings c={c} />
        <SDivider />
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={DATASETS} />
        <SDivider />
        <SLabel>Series 1</SLabel>
        <SInput label="Label" value={s1Label} onChange={setS1L} />
        <SToggle label="Area fill" checked={showArea} onChange={setShowArea} />
        <ColorPicker className="w-full" label="Colour" value={s1Color} onValueChange={setS1C} />
        <SDivider />
        <SLabel>Series 2</SLabel>
        <SToggle label="Show comparison" checked={showS2} onChange={setS2} />
        {showS2 && <>
          <SInput label="Label" value={s2Label} onChange={setS2L} />
          <ColorPicker className="w-full" label="Colour" value={s2Color} onValueChange={setS2C} />
        </>}
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="KPI readout"    checked={showKpi}    onChange={setShowKpi} />
        <SSegment label="Curve" value={curve} onChange={setCurve}
          options={[{ label: "Smooth", value: "smooth" }, { label: "Linear", value: "linear" }]} />
        <SToggle label="Legend" checked={showLegend} onChange={v => { setLeg(v); if (!v) setHidden([]); }} />
        <SDivider />
        <SizeSettings c={c} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── BAR CHART ──────────────────────────────────────────────────────────────
function BarChartSandbox() {
  const [key,     setKey]    = useState(0);
  const c                    = useCardControls({ title: "Daily signups", width: 580, height: 200 });
  const [ds,      setDs]     = useState<Dataset>("signups");
  const [showAvg, setShowAvg] = useState(true);
  const [showKpi, setShowKpi] = useState(true);
  const [unit,    setUnit]   = useState("signups");

  const slice  = sliceData(getDataset(ds), c.days);
  const step   = Math.max(1, Math.floor(slice.length / 6));
  const bars   = slice.map((d, i) => ({
    key: d.date, label: d.label,
    axisLabel: i === 0 || i === slice.length - 1 || i % step === 0 ? d.label : undefined,
    value: d.value,
  }));
  const period = slice.length ? `${slice[0]!.label} – ${slice[slice.length - 1]!.label}` : "";

  const barHasTitle    = c.showTitle && !!c.title;
  const barMergeFilter = c.showDateFilter && !barHasTitle && showKpi;
  const barFloatFilter = c.showDateFilter && !barHasTitle && !showKpi;

  return (
    <>
      <Preview>
        <ChartCard {...c} onDaysChange={c.setDays}>
          <AnimatePresence initial={false}>
            {barFloatFilter && (
              <motion.div key="bar-filter"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: ANIM_EASE }} style={{ overflow: "hidden" }}>
                <div className="flex justify-end mb-3">
                  <FilterPills days={c.days} onDaysChange={c.setDays} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <BarChart key={key} data={bars} label={c.title} period={period}
            unit={unit} showAverage={showAvg} height={c.height} showHeader={showKpi}
            headerRight={barMergeFilter ? <FilterPills days={c.days} onDaysChange={c.setDays} /> : undefined} />
        </ChartCard>
      </Preview>
      <Settings>
        <CardSettings c={c} />
        <SDivider />
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={DATASETS} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="KPI headline" checked={showKpi} onChange={setShowKpi} />
        <SToggle label="Average line" checked={showAvg} onChange={setShowAvg} />
        <SDivider />
        <SLabel>Labels</SLabel>
        <SInput label="Unit" value={unit} onChange={setUnit} />
        <SDivider />
        <SizeSettings c={c} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── JOINED KPI CARDS ──────────────────────────────────────────────────────
interface JoinedCard { label: string; value: number; change?: string; context: string }
function JoinedKpiCards({ cards, showLabel, showChange, showContext, suffix, width, cellHeight }: {
  cards: JoinedCard[]; showLabel: boolean; showChange: boolean; showContext: boolean;
  suffix: string; width: number; cellHeight: number;
}) {
  return (
    <div style={{ width: `${width}px`, maxWidth: "100%" }}
      className="rounded-xl border bg-card overflow-hidden">
      <div className="flex divide-x">
        {cards.map((card, i) => (
          <div key={i} style={{ minHeight: `${cellHeight}px` }} className="flex-1 p-5 min-w-0 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2 mb-5">
              {showLabel
                ? <span className="text-sm text-muted-foreground truncate">{card.label}</span>
                : <span />}
              {showChange && card.change && (
                <span className={`flex-shrink-0 inline-flex text-xs font-medium px-2 py-0.5 rounded-full border border-transparent
                  ${card.change.startsWith('+')
                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                  {card.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-foreground leading-none">
                {card.value.toLocaleString()}{suffix && <span className="text-base font-normal text-muted-foreground ml-1">{suffix}</span>}
              </p>
              {showContext && (
                <p className="text-sm text-muted-foreground mt-3 truncate">{card.context}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── METRIC CARD ────────────────────────────────────────────────────────────
function MetricCardSandbox() {
  const [label,       setLabel]       = useState("Monthly Revenue");
  const [value,       setValue]       = useState(81420);
  const [suffix,      setSuffix]      = useState("");
  const [context,     setContext]     = useState("August 2024");
  const [change,      setChange]      = useState("+9.2%");
  const [width,       setWidth]       = useState(320);
  const [cellHeight,  setCellHeight]  = useState(140);
  const [cardCount,   setCardCount]   = useState(1);
  const [showLabel,   setShowLabel]   = useState(true);
  const [showChange,  setShowChange]  = useState(true);
  const [showContext, setShowContext] = useState(true);

  const allCards: JoinedCard[] = [
    { label: label,           value,                           change: change || undefined, context },
    { label: "Avg. order",    value: Math.round(value * 0.012), change: "+3.4%",            context },
    { label: "New customers", value: Math.round(value * 0.08),  change: "-1.2%",            context },
    { label: "Churn rate",    value: Math.round(value * 0.034), change: "+0.8%",            context },
  ];
  const cards = allCards.slice(0, cardCount);

  const joinedWidth = Math.max(width, cardCount * 160);

  return (
    <>
      <Preview>
        {cardCount === 1 ? (
          <div style={{ width: `${width}px`, maxWidth: "100%" }}>
            <MetricCard
              label={showLabel ? label : ""}
              value={value}
              suffix={suffix || undefined}
              context={showContext ? context : ""}
              change={showChange && change ? change : undefined}
            />
          </div>
        ) : (
          <JoinedKpiCards
            cards={cards}
            showLabel={showLabel}
            showChange={showChange}
            showContext={showContext}
            suffix={suffix}
            width={joinedWidth}
            cellHeight={cellHeight}
          />
        )}
      </Preview>
      <Settings>
        <SLabel>Content</SLabel>
        <SInput label="Label"               value={label}   onChange={setLabel}   />
        <SInput label="Value"               value={value}   onChange={v => setValue(Number(v))} type="number" />
        <SInput label="Change (e.g. +9.2%)" value={change}  onChange={setChange}  />
        <SInput label="Context"             value={context} onChange={setContext} />
        <SInput label="Suffix (e.g. %)"     value={suffix}  onChange={setSuffix}  />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Show label"   checked={showLabel}   onChange={setShowLabel}   />
        <SToggle label="Show change"  checked={showChange}  onChange={setShowChange}  />
        <SToggle label="Show context" checked={showContext} onChange={setShowContext} />
        <SDivider />
        <SLabel>Layout</SLabel>
        <SSlider label="Cards"  value={cardCount}  min={1} max={4} unit=""   onChange={setCardCount}  />
        <SSlider label="Width"  value={width}      min={200} max={900}       onChange={setWidth}      />
        {cardCount > 1 && <SSlider label="Height" value={cellHeight} min={100} max={320} onChange={setCellHeight} />}
        <SDivider />
        <SLabel>Try it</SLabel>
        <SSlider label="Value" value={value} min={0} max={500000} step={1000} unit="" onChange={setValue} />
      </Settings>
    </>
  );
}

// ── SPARKLINE ──────────────────────────────────────────────────────────────
function SparklineSandbox() {
  const [key, setKey]           = useState(0);
  const c                       = useCardControls({ title: "Revenue trend", width: 320, height: 80 });
  const [ds, setDs]             = useState<Dataset>("revenue");
  const [tone, setTone]         = useState<"success" | "danger" | "warning">("success");
  const [showArea, setShowArea] = useState(true);
  const [interactive, setInt]   = useState(true);
  const [displayVal, setDVal]   = useState("$112K");
  const [displayChg, setDChg]   = useState("+19.2%");

  const slice  = sliceData(getDataset(ds), c.days);
  const values = slice.length ? slice.map(d => d.value) : SPARK_VALUES;
  const labels = slice.length ? slice.map(d => d.label) : undefined;

  const sparkHasTitle    = c.showTitle && !!c.title;
  const sparkFloatFilter = c.showDateFilter && !sparkHasTitle;

  return (
    <>
      <Preview>
        <ChartCard {...c} onDaysChange={c.setDays}>
          <AnimatePresence initial={false}>
            {sparkFloatFilter && (
              <motion.div key="spark-filter"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: ANIM_EASE }} style={{ overflow: "hidden" }}>
                <div className="flex justify-end mb-3">
                  <FilterPills days={c.days} onDaysChange={c.setDays} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Sparkline key={key} data={values} labels={labels}
            label={c.title} value={displayVal} change={displayChg}
            tone={tone} area={showArea} interactive={interactive} height={c.height} />
        </ChartCard>
      </Preview>
      <Settings>
        <CardSettings c={c} />
        <SDivider />
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={DATASETS} />
        <SDivider />
        <SLabel>Labels</SLabel>
        <SInput label="Value"  value={displayVal} onChange={setDVal} />
        <SInput label="Change" value={displayChg} onChange={setDChg} />
        <SDivider />
        <SLabel>Tone</SLabel>
        <SSegment label="" value={tone} onChange={setTone} options={[
          { label: "Success", value: "success" },
          { label: "Warning", value: "warning" },
          { label: "Danger",  value: "danger"  },
        ]} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Area fill"   checked={showArea}    onChange={setShowArea} />
        <SToggle label="Interactive" checked={interactive} onChange={setInt}      />
        <SDivider />
        <SizeSettings c={c} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── GAUGE ──────────────────────────────────────────────────────────────────
function GaugeSandbox() {
  const [key, setKey]       = useState(0);
  const [value, setValue]   = useState(72);
  const [label, setLabel]   = useState("Server load");
  const [detail, setDetail] = useState("of capacity");
  const [width, setWidth]   = useState(320);
  const [t1, setT1] = useState(0);  const [l1, setL1] = useState("Normal");
  const [t2, setT2] = useState(70); const [l2, setL2] = useState("High");
  const [t3, setT3] = useState(90); const [l3, setL3] = useState("Critical");

  const thresholds: GaugeThreshold[] = [
    { from: t1, tone: "success", label: l1 },
    { from: t2, tone: "warning", label: l2 },
    { from: t3, tone: "danger",  label: l3 },
  ];

  return (
    <>
      <Preview>
        <div style={{ width: `${width}px`, maxWidth: "100%" }}
          className="rounded-xl border bg-muted/30 dark:bg-card p-8 flex justify-center">
          <Gauge key={key} value={value} label={label} detail={detail} thresholds={thresholds} />
        </div>
      </Preview>
      <Settings>
        <SLabel>Labels</SLabel>
        <SInput label="Title"  value={label}  onChange={setLabel}  />
        <SInput label="Detail" value={detail} onChange={setDetail} />
        <SDivider />
        <SLabel>Value</SLabel>
        <SSlider label="Current %" value={value} min={0} max={100} unit="%" onChange={setValue} />
        <SDivider />
        <SLabel>Thresholds</SLabel>
        {([
          ["Normal",   t1, setT1, l1, setL1, "text-green-600"],
          ["High",     t2, setT2, l2, setL2, "text-amber-500"],
          ["Critical", t3, setT3, l3, setL3, "text-red-500" ],
        ] as [string, number, (v: number) => void, string, (v: string) => void, string][]).map(([zone, from, setFrom, lbl, setLbl, cls]) => (
          <div key={zone} className="py-1">
            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${cls}`}>{zone}</p>
            <div className="flex gap-2">
              <div className="w-20 shrink-0">
                <SInput label="From %" value={from} onChange={v => setFrom(Number(v))} type="number" />
              </div>
              <div className="flex-1">
                <SInput label="Label" value={lbl} onChange={setLbl} />
              </div>
            </div>
          </div>
        ))}
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width" value={width} min={220} max={500} onChange={setWidth} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── DONUT DATA ─────────────────────────────────────────────────────────────
const P = ["oklch(0.62 0.22 257)","oklch(0.60 0.22 290)","oklch(0.68 0.18 75)","oklch(0.60 0.17 195)","oklch(0.62 0.22 10)","oklch(0.58 0.18 150)"] as const;
const DONUT_TRAFFIC: DonutChartDatum[] = [
  { key: "direct",   label: "Direct",   value: 4320, color: P[0] },
  { key: "organic",  label: "Organic",  value: 3180, color: P[1] },
  { key: "referral", label: "Referral", value: 1890, color: P[2] },
  { key: "email",    label: "Email",    value: 1240, color: P[3] },
  { key: "social",   label: "Social",   value:  980, color: P[4] },
  { key: "paid",     label: "Paid",     value:  680, color: P[5] },
];
const DONUT_REVENUE: DonutChartDatum[] = [
  { key: "online",    label: "Online Store",  value: 58200, color: P[0] },
  { key: "instore",   label: "In-store",      value: 31400, color: P[1] },
  { key: "wholesale", label: "Wholesale",     value: 18700, color: P[2] },
  { key: "subs",      label: "Subscriptions", value:  9300, color: P[3] },
];
const DONUT_DEVICES: DonutChartDatum[] = [
  { key: "mobile",  label: "Mobile",  value: 5840, color: P[0] },
  { key: "desktop", label: "Desktop", value: 3210, color: P[1] },
  { key: "tablet",  label: "Tablet",  value: 1120, color: P[2] },
  { key: "other",   label: "Other",   value:  340, color: P[3] },
];
type DonutDs = "traffic" | "revenue" | "devices";
const DONUT_SETS: { label: string; value: DonutDs }[] = [
  { label: "Traffic", value: "traffic" },
  { label: "Revenue", value: "revenue" },
  { label: "Devices", value: "devices" },
];
function getDonutData(d: DonutDs): DonutChartDatum[] {
  return d === "revenue" ? DONUT_REVENUE : d === "devices" ? DONUT_DEVICES : DONUT_TRAFFIC;
}

// ── WAFFLE DATA ────────────────────────────────────────────────────────────
const WAFFLE_REVENUE: WaffleCategory[] = [
  { key: "online",    label: "Online Store",  value: 58200, color: P[0] },
  { key: "instore",   label: "In-store",      value: 31400, color: P[1] },
  { key: "wholesale", label: "Wholesale",     value: 18700, color: P[2] },
  { key: "subs",      label: "Subscriptions", value:  9300, color: P[3] },
];
const WAFFLE_TEAM: WaffleCategory[] = [
  { key: "eng",    label: "Engineering", value: 24, color: P[0] },
  { key: "sales",  label: "Sales",       value: 18, color: P[1] },
  { key: "ops",    label: "Operations",  value: 12, color: P[2] },
  { key: "design", label: "Design",      value:  8, color: P[3] },
  { key: "other",  label: "Other",       value:  6, color: P[4] },
];
const WAFFLE_BUDGET: WaffleCategory[] = [
  { key: "product", label: "Product",   value: 42, color: P[0] },
  { key: "growth",  label: "Growth",    value: 28, color: P[1] },
  { key: "infra",   label: "Infra",     value: 16, color: P[2] },
  { key: "support", label: "Support",   value:  9, color: P[3] },
  { key: "admin",   label: "Admin",     value:  5, color: P[4] },
];
type WaffleDs = "revenue" | "team" | "budget";
const WAFFLE_SETS: { label: string; value: WaffleDs }[] = [
  { label: "Revenue", value: "revenue" },
  { label: "Team",    value: "team"    },
  { label: "Budget",  value: "budget"  },
];
function getWaffleData(d: WaffleDs): WaffleCategory[] {
  return d === "team" ? WAFFLE_TEAM : d === "budget" ? WAFFLE_BUDGET : WAFFLE_REVENUE;
}

// ── HEATMAP DATA ───────────────────────────────────────────────────────────
function makeHeatmapData(seed = 42): ActivityDay[] {
  const rng = seeded(seed);
  const days: ActivityDay[] = [];
  const start = new Date("2024-01-01");
  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    const weekday = d.getDay();
    const base = weekday === 0 || weekday === 6 ? 0.3 : 1;
    const spike = rng() < 0.08 ? 3 : 1;
    const count = Math.round(base * spike * rng() * 18);
    days.push({ date, count });
  }
  return days;
}
const HEATMAP_DAYS = makeHeatmapData(42);

// ── DONUT CHART ────────────────────────────────────────────────────────────
function DonutChartSandbox() {
  const [key, setKey]           = useState(0);
  const [ds, setDs]             = useState<DonutDs>("traffic");
  const [size, setSize]         = useState(220);
  const [thickness, setThickness] = useState(28);
  const [legend, setLegend]     = useState(true);
  const [legendAction, setLegendAction] = useState<"toggle" | "select">("toggle");
  const [unit, setUnit]         = useState("visits");
  const [totalLabel, setTotalLabel] = useState("Total");
  const [width, setWidth]       = useState(480);

  const data = getDonutData(ds);

  return (
    <>
      <Preview>
        <div className="rounded-xl border bg-card p-8" style={{ width: `${width}px`, maxWidth: "100%" }}>
          <DonutChart
            key={key}
            data={data}
            label={ds === "revenue" ? "Revenue by channel" : ds === "devices" ? "Visits by device" : "Visits by source"}
            unit={unit}
            size={size}
            thickness={thickness}
            legend={legend}
            legendAction={legendAction}
            totalLabel={totalLabel}
          />
        </div>
      </Preview>
      <Settings>
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={DONUT_SETS} />
        <SDivider />
        <SLabel>Labels</SLabel>
        <SInput label="Unit"         value={unit}       onChange={setUnit}       />
        <SInput label="Center label" value={totalLabel} onChange={setTotalLabel} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Legend" checked={legend} onChange={setLegend} />
        {legend && (
          <SSegment label="Legend action" value={legendAction} onChange={setLegendAction}
            options={[{ label: "Toggle", value: "toggle" }, { label: "Select", value: "select" }]} />
        )}
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Card width" value={width}     min={260} max={800} onChange={setWidth}     />
        <SSlider label="Diameter"   value={size}      min={140} max={360} onChange={setSize}      />
        <SSlider label="Thickness"  value={thickness} min={12}  max={60}  onChange={setThickness} />
        <SDivider />
        <ReplayBtn onClick={() => setKey(k => k + 1)} />
      </Settings>
    </>
  );
}

// ── WAFFLE CHART ───────────────────────────────────────────────────────────
function WaffleChartSandbox() {
  const [ds, setDs]       = useState<WaffleDs>("revenue");
  const [rows, setRows]   = useState(10);
  const [cols, setCols]   = useState(10);
  const [legend, setLeg]  = useState(true);
  const [unit, setUnit]   = useState("");
  const [width, setWidth] = useState(500);

  const data = getWaffleData(ds);

  return (
    <>
      <Preview>
        <div style={{ width: `${width}px`, maxWidth: "100%" }}
          className="rounded-xl border bg-card p-8">
          <WaffleChart
            data={data}
            label={ds === "team" ? "Team headcount" : ds === "budget" ? "Budget allocation" : "Revenue by channel"}
            unit={unit}
            rows={rows}
            columns={cols}
            legend={legend}
          />
        </div>
      </Preview>
      <Settings>
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={setDs} options={WAFFLE_SETS} />
        <SDivider />
        <SLabel>Labels</SLabel>
        <SInput label="Unit (e.g. TWh)" value={unit} onChange={setUnit} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Legend" checked={legend} onChange={setLeg} />
        <SDivider />
        <SLabel>Grid</SLabel>
        <SSlider label="Rows"    value={rows} min={4} max={20} onChange={setRows} unit="" />
        <SSlider label="Columns" value={cols} min={4} max={20} onChange={setCols} unit="" />
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width" value={width} min={260} max={700} onChange={setWidth} />
      </Settings>
    </>
  );
}

// ── ACTIVITY HEATMAP ───────────────────────────────────────────────────────
type WeekStart = "0" | "1";
const HEATMAP_YEARS = [...new Set(HEATMAP_DAYS.map(d => d.date.slice(0, 4)))].sort();
function ActivityHeatmapSandbox() {
  const [key, setKey]             = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState<WeekStart>("1");
  const [unit, setUnit]           = useState<{ one: string; other: string }>({ one: "contribution", other: "contributions" });
  const [color, setColor]         = useState(COLORS[0]!.v);
  const [width, setWidth]         = useState(720);
  const [year, setYear]           = useState(HEATMAP_YEARS[HEATMAP_YEARS.length - 1]!);

  const yearDays = HEATMAP_DAYS.filter(d => d.date.startsWith(year));

  const yearActions = HEATMAP_YEARS.length > 1 ? (
    <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
      {HEATMAP_YEARS.map(y => (
        <button key={y} onClick={() => { setYear(y); setSelected(null); }}
          className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
            ${year === y
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"}`}>
          {y}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <Preview>
        <div
          className="rounded-xl border bg-card p-6"
          style={{ width: `${width}px`, maxWidth: "100%", "--accent": color, "--heatmap-surface": "var(--card)" } as React.CSSProperties}
        >
          <ActivityHeatmap
            key={key}
            days={yearDays}
            label={`Contributions in ${year}`}
            period={year}
            unit={unit}
            weekStartsOn={weekStart === "0" ? 0 : 1}
            selectedDate={selected}
            onSelectDate={setSelected}
            actions={yearActions}
          />
        </div>
      </Preview>
      <Settings>
        <SLabel>Labels</SLabel>
        <SInput label="Unit (singular)" value={unit.one}   onChange={v => setUnit(u => ({ ...u, one: v }))}   />
        <SInput label="Unit (plural)"   value={unit.other} onChange={v => setUnit(u => ({ ...u, other: v }))} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SSegment label="Week starts on" value={weekStart} onChange={setWeekStart}
          options={[{ label: "Sunday", value: "0" as WeekStart }, { label: "Monday", value: "1" as WeekStart }]} />
        {selected && (
          <p className="text-xs text-muted-foreground mt-3">Selected: <span className="font-medium text-foreground">{selected}</span></p>
        )}
        <SDivider />
        <ColorPicker className="w-full" label="Accent colour" value={color} onValueChange={setColor} />
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width" value={width} min={320} max={900} onChange={setWidth} />
        <SDivider />
        <ReplayBtn onClick={() => { setKey(k => k + 1); setSelected(null); }} />
      </Settings>
    </>
  );
}

// ── TREEMAP DATA ───────────────────────────────────────────────────────────
const TREEMAP_REVENUE: TreemapNode = {
  id: "root", label: "Revenue",
  children: [
    { id: "na", label: "North America", children: [
      { id: "us", label: "United States", value: 48200, color: 12.4 },
      { id: "ca", label: "Canada",        value:  8900, color:  8.1 },
      { id: "mx", label: "Mexico",        value:  3100, color: -2.3 },
    ]},
    { id: "eu", label: "Europe", children: [
      { id: "uk",     label: "UK",      value: 18400, color:  5.2 },
      { id: "de",     label: "Germany", value: 14200, color:  9.8 },
      { id: "fr",     label: "France",  value:  9800, color:  3.1 },
      { id: "eu_oth", label: "Other",   value:  8100, color:  1.4 },
    ]},
    { id: "apac", label: "Asia Pacific", children: [
      { id: "jp", label: "Japan",     value: 12300, color: 18.2 },
      { id: "au", label: "Australia", value:  7200, color: 11.5 },
      { id: "sg", label: "Singapore", value:  4100, color: 24.8 },
    ]},
    { id: "latam", label: "Latin America", children: [
      { id: "br", label: "Brazil",    value: 5400, color: -1.2 },
      { id: "ar", label: "Argentina", value: 2100, color: -8.4 },
    ]},
  ],
};
const TREEMAP_PRODUCTS: TreemapNode = {
  id: "root", label: "Revenue by product",
  children: [
    { id: "starter",  label: "Starter",    value: 42800, color:  8.4 },
    { id: "pro",      label: "Pro",        value: 31200, color: 22.1 },
    { id: "ent",      label: "Enterprise", value: 18900, color: 14.6 },
    { id: "addon_ai", label: "AI add-on",  value:  7400, color: 41.2 },
    { id: "addon_wh", label: "Webhooks",   value:  2900, color: 18.8 },
    { id: "addon_ss", label: "SSO",        value:  1600, color:  6.2 },
  ],
};
const TREEMAP_SPEND: TreemapNode = {
  id: "root", label: "Operating spend",
  children: [
    { id: "eng", label: "Engineering", children: [
      { id: "eng_sal",  label: "Salaries",    value: 38000, color: 4.2 },
      { id: "eng_tool", label: "Tools",       value:  4200, color: 9.1 },
      { id: "eng_inf",  label: "Infra",       value:  8100, color: 2.8 },
    ]},
    { id: "sales", label: "Sales & Marketing", children: [
      { id: "sal_sal",  label: "Salaries", value: 22000, color: 6.1 },
      { id: "sal_ads",  label: "Ads",      value: 14000, color: 18.4 },
      { id: "sal_evt",  label: "Events",   value:  3200, color: -4.2 },
    ]},
    { id: "ops", label: "Operations", children: [
      { id: "ops_sal", label: "Salaries", value: 12000, color: 3.1 },
      { id: "ops_leg", label: "Legal",    value:  4800, color: 1.0 },
      { id: "ops_fac", label: "Facilities",value: 3600, color: 0.2 },
    ]},
  ],
};
type TreemapDs = "revenue" | "products" | "spend";
const TREEMAP_SETS: { label: string; value: TreemapDs }[] = [
  { label: "Revenue",  value: "revenue"  },
  { label: "Products", value: "products" },
  { label: "Spend",    value: "spend"    },
];
function getTreemapData(d: TreemapDs): TreemapNode {
  return d === "products" ? TREEMAP_PRODUCTS : d === "spend" ? TREEMAP_SPEND : TREEMAP_REVENUE;
}

// ── BRUSH DATA ─────────────────────────────────────────────────────────────
function makeBrushData(days: number, base: number, amp: number, seed = 1): BrushChartDatum[] {
  const rng = seeded(seed);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date("2024-01-01");
    d.setDate(d.getDate() + i);
    const trend = 1 + (i / days) * 0.4;
    return { date: d, value: Math.max(0, Math.round((base + Math.sin(i / 14) * amp + rng() * amp * 0.5) * trend)) };
  });
}
const BRUSH_SIGNUPS  = makeBrushData(730, 180,  60, 1);
const BRUSH_REVENUE  = makeBrushData(730, 6000, 2000, 7);
const BRUSH_SESSIONS = makeBrushData(730, 3200, 800, 13);
const BRUSH_ANNOTATIONS: BrushChartAnnotation[] = [
  { date: new Date("2024-03-10"), label: "Beta launch",   description: "Public beta opened" },
  { date: new Date("2024-07-22"), label: "v2.0",          description: "Dashboard v2 released" },
  { date: new Date("2024-11-29"), label: "Black Friday",  description: "Promo campaign" },
  { date: new Date("2025-01-06"), label: "New year push", description: "January campaign" },
  { date: new Date("2025-06-01"), label: "Series A",      description: "Funding announced" },
];
type BrushDs = "signups" | "revenue" | "sessions";
const BRUSH_SETS: { label: string; value: BrushDs }[] = [
  { label: "Signups",  value: "signups"  },
  { label: "Revenue",  value: "revenue"  },
  { label: "Sessions", value: "sessions" },
];
function getBrushData(d: BrushDs): BrushChartDatum[] {
  return d === "revenue" ? BRUSH_REVENUE : d === "sessions" ? BRUSH_SESSIONS : BRUSH_SIGNUPS;
}

// ── TREEMAP ────────────────────────────────────────────────────────────────
function TreemapSandbox() {
  const [ds,        setDs]       = useState<TreemapDs>("products");
  const [showColor, setShowColor] = useState(true);
  const [height,    setHeight]   = useState(420);
  const [width,     setWidth]    = useState(660);
  const [focus,     setFocus]    = useState<string>("root");

  // Reset focus when dataset changes
  const handleDsChange = (next: TreemapDs) => { setDs(next); setFocus("root"); };

  const data = getTreemapData(ds);
  const colorLabel = ds === "revenue" || ds === "spend" ? "YoY growth %" : "MoM growth %";

  // Branch filter pills — top-level children of root
  const branches = data.children ?? [];

  return (
    <>
      <Preview>
        <div style={{ width: `${width}px`, maxWidth: "100%" }}
          className="rounded-xl border bg-card">
          {branches.length > 0 && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-0 flex-wrap">
              <button
                onClick={() => setFocus("root")}
                className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                  ${focus === "root" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                All
              </button>
              {branches.map(b => (
                <button key={b.id} onClick={() => setFocus(b.id)}
                  className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                    ${focus === b.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {b.label}
                </button>
              ))}
            </div>
          )}
          <div className="px-4 pt-3 pb-4">
          <Treemap
            data={data}
            label={data.label}
            height={height}
            focus={focus}
            onFocusChange={setFocus}
            colorLabel={showColor ? colorLabel : undefined}
            formatValue={v => `$${(v / 1000).toFixed(0)}K`}
            formatColor={v => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
          />
          </div>
        </div>
      </Preview>
      <Settings>
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={handleDsChange} options={TREEMAP_SETS} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Growth shading" checked={showColor} onChange={setShowColor} />
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width"  value={width}  min={300} max={900} onChange={setWidth}  />
        <SSlider label="Height" value={height} min={200} max={600} onChange={setHeight} />
      </Settings>
    </>
  );
}

// ── BRUSH CHART ────────────────────────────────────────────────────────────
const BRUSH_WINDOW_OPTS = [
  { label: "30d",  days: 30  },
  { label: "90d",  days: 90  },
  { label: "6m",   days: 182 },
  { label: "1y",   days: 365 },
  { label: "All",  days: 730 },
];
function BrushChartSandbox() {
  const [ds,        setDs]        = useState<BrushDs>("signups");
  const [showAnnot, setShowAnnot] = useState(true);
  const [unit,      setUnit]      = useState("signups");
  const [height,    setHeight]    = useState(200);
  const [overviewH, setOverviewH] = useState(48);
  const [width,     setWidth]     = useState(660);
  const [windowDays, setWindowDays] = useState(90);

  const data = getBrushData(ds);
  const lastMs  = (data[data.length - 1]!.date as Date).getTime();
  const range: [number, number] = windowDays === 730
    ? [(data[0]!.date as Date).getTime(), lastMs]
    : [lastMs - windowDays * 24 * 60 * 60 * 1000, lastMs];

  const handleDsChange = (next: BrushDs) => {
    setDs(next);
    setUnit(next === "revenue" ? "revenue" : next === "sessions" ? "sessions" : "signups");
  };

  return (
    <>
      <Preview>
        <div style={{ width: `${width}px`, maxWidth: "100%" }}
          className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {ds === "revenue" ? "Daily revenue" : ds === "sessions" ? "Daily sessions" : "Daily signups"}
            </p>
            <div className="flex gap-0.5 p-0.5 rounded-full bg-muted">
              {BRUSH_WINDOW_OPTS.map(o => (
                <button key={o.label} onClick={() => setWindowDays(o.days)}
                  className={`px-2.5 py-[3px] rounded-full text-xs font-medium transition-colors whitespace-nowrap
                    ${windowDays === o.days ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <BrushChart
            data={data}
            label={ds === "revenue" ? "Daily revenue" : ds === "sessions" ? "Daily sessions" : "Daily signups"}
            unit={unit}
            height={height}
            overviewHeight={overviewH}
            range={range}
            annotations={showAnnot ? BRUSH_ANNOTATIONS : undefined}
          />
        </div>
      </Preview>
      <Settings>
        <SLabel>Dataset</SLabel>
        <SSegment label="" value={ds} onChange={handleDsChange} options={BRUSH_SETS} />
        <SDivider />
        <SLabel>Labels</SLabel>
        <SInput label="Unit" value={unit} onChange={setUnit} />
        <SDivider />
        <SLabel>Display</SLabel>
        <SToggle label="Event annotations" checked={showAnnot} onChange={setShowAnnot} />
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width"           value={width}     min={320} max={900} onChange={setWidth}     />
        <SSlider label="Chart height"    value={height}    min={120} max={400} onChange={setHeight}    />
        <SSlider label="Overview height" value={overviewH} min={28}  max={100} onChange={setOverviewH} />
      </Settings>
    </>
  );
}

// ── TABLE ──────────────────────────────────────────────────────────────────
type ProjectRow = {
  id: string;
  name: string;
  owner: string;
  status: "Active" | "Paused" | "Archived" | "Draft";
  updated: Date;
  revenue: number;
  seats: number;
};
const PROJECT_ROWS: ProjectRow[] = [
  { id: "p1",  name: "Atlas Payments",   owner: "Priya Shah",     status: "Active",   updated: new Date("2026-10-02"), revenue: 184200, seats: 42 },
  { id: "p2",  name: "Comet Analytics",  owner: "Marcus Lee",     status: "Active",   updated: new Date("2026-10-07"), revenue: 92450,  seats: 18 },
  { id: "p3",  name: "Horizon CRM",      owner: "Elena García",   status: "Paused",   updated: new Date("2026-09-12"), revenue: 48900,  seats: 24 },
  { id: "p4",  name: "Lumen Billing",    owner: "Daniel Okafor",  status: "Active",   updated: new Date("2026-10-10"), revenue: 221340, seats: 56 },
  { id: "p5",  name: "Nebula Insights",  owner: "Ava Chen",       status: "Draft",    updated: new Date("2026-09-30"), revenue: 0,      seats: 4  },
  { id: "p6",  name: "Orbit Checkout",   owner: "Tomás Rivera",   status: "Active",   updated: new Date("2026-10-11"), revenue: 136800, seats: 31 },
  { id: "p7",  name: "Pulse Alerts",     owner: "Sofia Nakamura", status: "Archived", updated: new Date("2026-07-18"), revenue: 11200,  seats: 7  },
  { id: "p8",  name: "Quill Docs",       owner: "Marcus Lee",     status: "Active",   updated: new Date("2026-10-06"), revenue: 73580,  seats: 22 },
  { id: "p9",  name: "Relay Mail",       owner: "Priya Shah",     status: "Paused",   updated: new Date("2026-08-22"), revenue: 29400,  seats: 11 },
  { id: "p10", name: "Spark Workflows",  owner: "Elena García",   status: "Draft",    updated: new Date("2026-10-01"), revenue: 0,      seats: 3  },
  { id: "p11", name: "Tide Feedback",    owner: "Daniel Okafor",  status: "Active",   updated: new Date("2026-10-09"), revenue: 54720,  seats: 15 },
  { id: "p12", name: "Vista Reports",    owner: "Ava Chen",       status: "Active",   updated: new Date("2026-10-04"), revenue: 108650, seats: 27 },
];
const STATUS_TONE: Record<ProjectRow["status"], string> = {
  Active:   "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Paused:   "bg-amber-500/15  text-amber-600  dark:text-amber-400",
  Draft:    "bg-blue-500/15   text-blue-600   dark:text-blue-400",
  Archived: "bg-muted         text-muted-foreground",
};
const CURRENCY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const DATE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

function TableSandbox() {
  const [showCaption, setShowCaption] = useState(true);
  const [selectable,  setSelectable ] = useState(true);
  const [showStatusPill, setShowStatusPill] = useState(true);
  const [showRevenue,  setShowRevenue]  = useState(true);
  const [showSeats,    setShowSeats]    = useState(true);
  const [showOwner,    setShowOwner]    = useState(true);
  const [emptyMode,    setEmptyMode]    = useState(false);
  const [rowCount,     setRowCount]     = useState(12);
  const [width,        setWidth]        = useState(820);
  const [sortKey,      setSortKey]      = useState<string>("updated");
  const [sortDir,      setSortDir]      = useState<"asc" | "desc">("desc");
  const [title,        setTitle]        = useState("Active projects");
  const [showTitle,    setShowTitle]    = useState(true);

  const rows = emptyMode ? [] : PROJECT_ROWS.slice(0, rowCount);
  const columns: DataColumn<ProjectRow>[] = [
    { key: "name",    label: "Project", sortable: true },
    ...(showOwner    ? [{ key: "owner",   label: "Owner",   sortable: true } as DataColumn<ProjectRow>] : []),
    { key: "status",  label: "Status",  sortable: true,
      render: showStatusPill
        ? (value) => (
            <span className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium ${STATUS_TONE[value as ProjectRow["status"]]}`}>
              {String(value)}
            </span>
          )
        : undefined,
    },
    { key: "updated", label: "Updated", sortable: true,
      render: (value) => <span className="tabular-nums">{DATE_FMT.format(value as Date)}</span>,
    },
    ...(showRevenue ? [{ key: "revenue", label: "Revenue", sortable: true, numeric: true,
      render: (value: unknown) => (value as number) === 0
        ? <span className="text-muted-foreground">—</span>
        : <span>{CURRENCY.format(value as number)}</span>,
    } as DataColumn<ProjectRow>] : []),
    ...(showSeats ? [{ key: "seats", label: "Seats", sortable: true, numeric: true, width: 90 } as DataColumn<ProjectRow>] : []),
  ];

  return (
    <>
      <Preview>
        <div style={{ width: `${width}px`, maxWidth: "100%" }}
          className="rounded-xl border bg-card overflow-hidden">
          <AnimatePresence initial={false}>
            {showTitle && !!title && (
              <motion.div key="table-title"
                initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: ANIM_EASE }} style={{ overflow: "hidden" }}>
                <div className="px-5 pt-4 pb-0">
                  <span className="text-sm font-semibold text-foreground">{title}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="p-5">
            <SortableDataTable
              rows={rows}
              columns={columns}
              rowKey="id"
              caption={showCaption ? "Projects — Q4 2026 snapshot" : undefined}
              emptyMessage="No projects to show. Create one to get started."
              defaultSort={{ key: sortKey, direction: sortDir }}
              onSortChange={s => { setSortKey(s.key); setSortDir(s.direction); }}
              selectable={selectable}
              itemName={{ one: "project", other: "projects" }}
            />
          </div>
        </div>
      </Preview>
      <Settings>
        <SLabel>Card</SLabel>
        <SInput label="Title" value={title} onChange={setTitle} />
        <SToggle label="Show title" checked={showTitle} onChange={setShowTitle} />
        <SDivider />
        <SLabel>Content</SLabel>
        <SToggle label="Caption"      checked={showCaption}    onChange={setShowCaption} />
        <SToggle label="Status pill"  checked={showStatusPill} onChange={setShowStatusPill} />
        <SToggle label="Empty state"  checked={emptyMode}      onChange={setEmptyMode} />
        <SDivider />
        <SLabel>Columns</SLabel>
        <SToggle label="Owner"   checked={showOwner}   onChange={setShowOwner} />
        <SToggle label="Revenue" checked={showRevenue} onChange={setShowRevenue} />
        <SToggle label="Seats"   checked={showSeats}   onChange={setShowSeats} />
        <SDivider />
        <SLabel>Behaviour</SLabel>
        <SToggle label="Row selection" checked={selectable} onChange={setSelectable} />
        <SDivider />
        <SLabel>Rows</SLabel>
        <SSlider label="Count" value={rowCount} min={1} max={PROJECT_ROWS.length} unit="" onChange={setRowCount} />
        <SDivider />
        <SLabel>Size</SLabel>
        <SSlider label="Width" value={width} min={420} max={1200} onChange={setWidth} />
      </Settings>
    </>
  );
}

// ── TABS + ROOT ────────────────────────────────────────────────────────────
const TABS = [
  { id: "explorer",  label: "Metric Explorer"  },
  { id: "line",      label: "Line Chart"        },
  { id: "bar",       label: "Bar Chart"         },
  { id: "metric",    label: "Metric Card"       },
  { id: "sparkline", label: "Sparkline"         },
  { id: "gauge",     label: "Gauge"             },
  { id: "donut",     label: "Donut Chart"       },
  { id: "waffle",    label: "Waffle Chart"      },
  { id: "heatmap",   label: "Activity Heatmap"  },
  { id: "treemap",   label: "Treemap"           },
  { id: "brush",     label: "Brush Chart"       },
  { id: "table",     label: "Data Table"        },
  { id: "dashboard", label: "Dashboard"         },
] as const;
type TabId = typeof TABS[number]["id"];

export default function PlaygroundPage() {
  const [active, setActive] = useState<TabId>("explorer");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  const sandboxes: Record<TabId, React.ReactNode> = {
    explorer:  <ExplorerSandbox        />,
    line:      <LineChartSandbox       />,
    bar:       <BarChartSandbox        />,
    metric:    <MetricCardSandbox      />,
    sparkline: <SparklineSandbox       />,
    gauge:     <GaugeSandbox           />,
    donut:     <DonutChartSandbox      />,
    waffle:    <WaffleChartSandbox     />,
    heatmap:   <ActivityHeatmapSandbox />,
    treemap:   <TreemapSandbox        />,
    brush:     <BrushChartSandbox     />,
    table:     <TableSandbox          />,
    dashboard: <DashboardSandbox      />,
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="flex items-center border-b px-4 shrink-0 h-11 bg-background gap-0">
        <span className="text-[11px] font-semibold text-muted-foreground pr-3 border-r mr-1.5 shrink-0">Playground</span>
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap
                ${active === tab.id
                  ? "bg-blue-500/10 text-blue-500"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={() => setTheme(isDark ? "light" : "dark")}
          className="shrink-0 ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium
            text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {isDark
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {sandboxes[active]}
      </div>
    </div>
  );
}
