"use client";

import { useEffect, useRef } from "react";
import * as Plot from "@observablehq/plot";

export interface PlotMark {
  type: string;
  x?: string;
  y?: string;
  fill?: string;
  stroke?: string;
  r?: number;
  text?: string;
  [key: string]: unknown;
}

export interface ObservablePlotProps {
  data: Record<string, unknown>[];
  marks: PlotMark[];
  options?: Omit<Plot.PlotOptions, "marks" | "document">;
}

export function ObservablePlot({ data, marks, options = {} }: ObservablePlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Coerce ISO date strings → Date objects so Observable Plot uses a time scale.
    // Without this, string dates produce an ordinal/point scale and Date tick objects are ignored.
    const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;
    const coercedData = data.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) {
        out[k] = typeof v === "string" && ISO_DATE_RE.test(v) ? new Date(v) : v;
      }
      return out;
    });

    const resolvedMarks = marks.flatMap(({ type, ...opts }) => {
      const markFn = (Plot as unknown as Record<string, (...args: unknown[]) => unknown>)[type];
      if (typeof markFn !== "function") {
        console.warn(`Unknown Observable Plot mark type: "${type}"`);
        return [];
      }

      // Rule marks with a numeric constant don't need the full dataset
      if (type === "ruleY" && typeof opts.y === "number") {
        const { y, ...rest } = opts;
        return [markFn([y], rest)];
      }
      if (type === "ruleX" && typeof opts.x === "number") {
        const { x, ...rest } = opts;
        return [markFn([x], rest)];
      }

      // crosshairX/Y already include a built-in tip — drop tip:true to avoid a duplicate
      if (type === "crosshairX" || type === "crosshairY") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tip: _tip, ...rest } = opts;
        return [markFn(coercedData, rest)];
      }

      return [markFn(coercedData, opts)];
    });

    // Coerce ISO date string ticks → Date objects so time-scale tickFormat works.
    // Also replace %-d (Linux strftime, unsupported in d3-time-format) with an Intl formatter.
    const coercedOptions = { ...options };
    if (coercedOptions.x && typeof coercedOptions.x === "object") {
      const xAxis = { ...(coercedOptions.x as Record<string, unknown>) };
      if (Array.isArray(xAxis.ticks) && typeof xAxis.ticks[0] === "string") {
        xAxis.ticks = (xAxis.ticks as string[]).map((t) => new Date(t));
      }
      if (typeof xAxis.tickFormat === "string" && xAxis.tickFormat.includes("%-d")) {
        const intlFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
        // d may be a Date (time scale) or an ISO string (band/ordinal scale)
        xAxis.tickFormat = (d: unknown) =>
          intlFmt.format(d instanceof Date ? d : new Date(d as string));
      }
      coercedOptions.x = xAxis as Plot.ScaleOptions;
    }

    const chart = Plot.plot({
      ...coercedOptions,
      marks: resolvedMarks as Plot.Markish[],
    });

    containerRef.current.appendChild(chart);
    return () => chart.remove();
  }, [data, marks, options]);

  return <div ref={containerRef} className="w-full overflow-x-auto" />;
}
