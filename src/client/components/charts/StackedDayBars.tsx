import { For, createMemo, onCleanup, onMount } from "solid-js";
import { animate } from "motion";
import { colorFor } from "@client/lib/colors.ts";
import { fmtTok } from "@client/lib/format.ts";
import { springOrInstant } from "@client/lib/motion.tsx";
import { tokensOf } from "../../../shared/tokens.ts";
import type { TuiDay, TuiModel } from "../../../shared/types.ts";

const SLOT = 10;
const BAR_W = 6.2;
const CHART_H = 148;
const PAD_TOP = 18;
const PAD_X = 6;
const DEPTH_X = 1.7;
const DEPTH_Y = 2.1;

function hexRgb(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith("#") && (color.length === 7 || color.length === 4)) {
    const h = color.length === 4 ? color.replace(/#(.)(.)(.)/, "#$1$1$2$2$3$3") : color;
    return {
      r: parseInt(h.slice(1, 3), 16),
      g: parseInt(h.slice(3, 5), 16),
      b: parseInt(h.slice(5, 7), 16),
    };
  }
  const m = color.match(/hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*\)/);
  if (!m) return null;
  const h = Number(m[1]) / 360;
  const s = Number(m[2]) / 100;
  const l = Number(m[3]) / 100;
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue(p, q, h + 1 / 3) * 255),
    g: Math.round(hue(p, q, h) * 255),
    b: Math.round(hue(p, q, h - 1 / 3) * 255),
  };
}

function rgba(color: string, a: number): string {
  const rgb = hexRgb(color);
  if (!rgb) return color;
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

function mix(color: string, toward: number, amount: number): string {
  const rgb = hexRgb(color);
  if (!rgb) return color;
  const blend = (c: number) => Math.round(c + (toward - c) * amount);
  return `rgb(${blend(rgb.r)},${blend(rgb.g)},${blend(rgb.b)})`;
}

function gid(key: string): string {
  return `bar-${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

interface Seg {
  key: string;
  y: number;
  h: number;
  color: string;
}

interface Col {
  date: string;
  tip: string;
  x: number;
  segs: Seg[];
  topY: number;
}

export function StackedDayBars(props: { daily: TuiDay[]; models: TuiModel[] }) {
  const top = () =>
    props.models
      .slice()
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
  const keys = () => top().map((m) => m.model);
  const days = () =>
    props.daily
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-75);

  const built = createMemo(() => {
    const ks = keys();
    const series = days().map((day) => {
      const by: Record<string, number> = {};
      for (const [, src] of day.sourceBreakdown || []) {
        for (const [name, info] of src.models || []) {
          const k = info.colorKey || info.displayName || name;
          by[k] = (by[k] || 0) + tokensOf(info.tokens);
        }
      }
      return { date: day.date, by };
    });
    const max = Math.max(1, ...series.map((s) => ks.reduce((n, k) => n + (s.by[k] || 0), 0)));
    const cols: Col[] = series.map((s, i) => {
      const total = ks.reduce((sum, k) => sum + (s.by[k] || 0), 0);
      const when = new Date(s.date + "T12:00:00");
      const tip = `${when.toLocaleDateString(undefined, { weekday: "long" })}, ${when.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · ${fmtTok(total)} tokens`;
      let y = PAD_TOP + CHART_H;
      const segs: Seg[] = [];
      for (const k of [...ks].reverse()) {
        const h = ((s.by[k] || 0) / max) * CHART_H;
        if (h <= 0) continue;
        y -= h;
        segs.push({ key: k, y, h, color: colorFor(k) });
      }
      return {
        date: s.date,
        tip,
        x: PAD_X + i * SLOT + (SLOT - BAR_W) / 2,
        segs,
        topY: segs.length ? segs[segs.length - 1].y : PAD_TOP + CHART_H,
      };
    });
    return { max, cols, n: Math.max(1, series.length) };
  });

  const monthTicks = createMemo(() => {
    const cols = built().cols;
    const ticks: { pct: number; label: string }[] = [];
    let last = "";
    cols.forEach((c, i) => {
      const month = c.date.slice(0, 7);
      if (month === last) return;
      last = month;
      if (i === 0 || i === cols.length - 1) return;
      ticks.push({
        pct: ((i + 0.5) / cols.length) * 100,
        label: new Date(c.date + "T12:00:00").toLocaleDateString(undefined, { month: "short" }),
      });
    });
    return ticks;
  });

  let svg: SVGSVGElement | undefined = undefined;

  onMount(() => {
    if (!svg) return;
    const nodes = [...svg.querySelectorAll<SVGGElement>("[data-col]")];
    const floor = PAD_TOP + CHART_H;
    const reduced =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const plant = (node: SVGGElement, t: number) => {
      const cx = Number(node.dataset.cx);
      node.setAttribute(
        "transform",
        `translate(${cx} ${floor}) scale(1 ${t}) translate(${-cx} ${-floor})`,
      );
    };
    if (reduced) {
      for (const node of nodes) plant(node, 1);
      return;
    }
    const controls = nodes.map((node, i) => {
      const state = { t: 0.04 };
      plant(node, state.t);
      return animate(state, { t: 1 }, {
        ...springOrInstant({ type: "spring", stiffness: 240, damping: 20 }),
        delay: i * 0.014,
        onUpdate: () => plant(node, state.t),
      } as never);
    });
    onCleanup(() => {
      for (const c of controls) c.stop();
    });
  });

  const viewW = () => PAD_X * 2 + built().n * SLOT;
  const viewH = () => PAD_TOP + CHART_H + DEPTH_Y + 4;
  const baseline = () => PAD_TOP + CHART_H;

  return (
    <div class="day-chart">
      <div class="mb-1 flex items-end justify-between px-1">
        <span
          class="font-mono text-[11px] tracking-wide text-[var(--neon)]"
          style={{ "text-shadow": "var(--glow-text)" }}
        >
          {fmtTok(built().max)}
        </span>
      </div>
      <div class="day-chart-well">
        <svg
          ref={(el) => {
            svg = el ?? undefined;
          }}
          viewBox={`0 0 ${viewW()} ${viewH()}`}
          preserveAspectRatio="none"
          class="day-chart-svg"
          height="220"
        >
          <defs>
            <linearGradient id="day-floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--neon)" stop-opacity="0.22" />
              <stop offset="100%" stop-color="var(--neon)" stop-opacity="0" />
            </linearGradient>
            <filter id="day-glow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <For each={keys()}>
              {(k) => (
                <linearGradient id={gid(k)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color={mix(colorFor(k), 255, 0.45)} />
                  <stop offset="42%" stop-color={colorFor(k)} />
                  <stop offset="100%" stop-color={mix(colorFor(k), 0, 0.45)} />
                </linearGradient>
              )}
            </For>
          </defs>
          <rect
            x="0"
            y={PAD_TOP}
            width={viewW()}
            height={CHART_H}
            fill="url(#day-floor)"
            opacity="0.35"
          />
          <line
            x1={PAD_X}
            x2={viewW() - PAD_X}
            y1={baseline()}
            y2={baseline()}
            stroke="var(--neon)"
            stroke-opacity="0.35"
            stroke-width="0.35"
          />
          <For each={built().cols}>
            {(col) => {
              const top = col.segs.at(-1);
              const x = col.x;
              const w = BAR_W;
              const cx = x + w / 2;
              return (
                <g>
                  <g
                    data-col
                    data-cx={String(cx)}
                    transform={`translate(${cx} ${baseline()}) scale(1 0.04) translate(${-cx} ${-baseline()})`}
                  >
                    <For each={col.segs}>
                      {(seg) => (
                        <g filter="url(#day-glow)">
                          <polygon
                            points={`${x + w},${seg.y} ${x + w + DEPTH_X},${seg.y - DEPTH_Y} ${x + w + DEPTH_X},${seg.y + seg.h - DEPTH_Y} ${x + w},${seg.y + seg.h}`}
                            fill={mix(seg.color, 0, 0.35)}
                          />
                          <rect
                            x={x}
                            y={seg.y}
                            width={w}
                            height={Math.max(0.15, seg.h)}
                            fill={`url(#${gid(seg.key)})`}
                          />
                        </g>
                      )}
                    </For>
                    {top ? (
                      <polygon
                        points={`${x},${top.y} ${x + DEPTH_X},${top.y - DEPTH_Y} ${x + w + DEPTH_X},${top.y - DEPTH_Y} ${x + w},${top.y}`}
                        fill={mix(top.color, 255, 0.55)}
                        filter="url(#day-glow)"
                      />
                    ) : null}
                  </g>
                  <rect x={x - 0.6} y={PAD_TOP} width={SLOT} height={CHART_H} fill="transparent">
                    <title>{col.tip}</title>
                  </rect>
                </g>
              );
            }}
          </For>
        </svg>
      </div>
      <div class="day-chart-axis">
        <span class="day-chart-end">{days()[0]?.date || ""}</span>
        <For each={monthTicks()}>
          {(t) => (
            <span class="day-chart-tick" style={{ left: `${t.pct}%` }}>
              {t.label}
            </span>
          )}
        </For>
        <span class="day-chart-end day-chart-end-right">{days().at(-1)?.date || ""}</span>
      </div>
      <div class="mt-3 flex flex-wrap gap-3 text-xs">
        <For each={keys()}>
          {(k) => (
            <span class="inline-flex items-center gap-1.5">
              <span
                class="inline-block size-2 rounded-full"
                style={{
                  background: colorFor(k),
                  "box-shadow": `0 0 8px ${rgba(colorFor(k), 0.75)}`,
                }}
              />
              {k}
            </span>
          )}
        </For>
      </div>
    </div>
  );
}
