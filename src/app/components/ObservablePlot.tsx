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

      // Rule marks with a numeric constant (or string-numeric) don't need the full dataset
      if (type === "ruleY" && opts.y !== undefined) {
        const yVal = Number(opts.y);
        if (!isNaN(yVal)) {
          const { y: _y, ...rest } = opts;
          return [markFn([yVal], rest)];
        }
      }
      if (type === "ruleX" && opts.x !== undefined) {
        const xVal = Number(opts.x);
        if (!isNaN(xVal)) {
          const { x: _x, ...rest } = opts;
          return [markFn([xVal], rest)];
        }
      }

      // crosshairX/Y already include a built-in tip — drop tip:true to avoid a duplicate
      if (type === "crosshairX" || type === "crosshairY") {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tip: _tip, ...rest } = opts;
        return [markFn(coercedData, rest)];
      }

      try {
        return [markFn(coercedData, opts)];
      } catch (e) {
        console.warn(`Observable Plot mark "${type}" failed:`, e);
        return [];
      }
    });

    // Extract custom hints that must not be forwarded to Plot.plot().
    // _y2Factor: curve_scale = bar_abs_max / curve_abs_max (used for right axis labels)
    // _y2Label:  label text for the right axis
    const rawOptions = options as Record<string, unknown>;
    const y2Factor = typeof rawOptions._y2Factor === "number" ? rawOptions._y2Factor : null;
    const y2Label  = typeof rawOptions._y2Label  === "string" ? rawOptions._y2Label  : null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _y2Factor: _f, _y2Label: _l, ...cleanOptions } = rawOptions;

    // Coerce ISO date string ticks → Date objects so time-scale tickFormat works.
    // Also replace %-d (Linux strftime, unsupported in d3-time-format) with an Intl formatter.
    const coercedOptions = { ...cleanOptions };
    if (coercedOptions.x && typeof coercedOptions.x === "object") {
      const xAxis = { ...(coercedOptions.x as Record<string, unknown>) };
      if (Array.isArray(xAxis.ticks) && typeof xAxis.ticks[0] === "string") {
        xAxis.ticks = (xAxis.ticks as string[]).map((t) => new Date(t));
      }
      if (typeof xAxis.tickFormat === "string" && xAxis.tickFormat.includes("%-d")) {
        const intlFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
        xAxis.tickFormat = (d: unknown) =>
          intlFmt.format(d instanceof Date ? d : new Date(d as string));
      }
      coercedOptions.x = xAxis as Plot.ScaleOptions;
    }

    const chart = Plot.plot({
      ...coercedOptions,
      marks: resolvedMarks as Plot.Markish[],
    });

    // Post-render a custom right axis when _y2Factor is supplied.
    // Observable Plot has no native dual-y-axis; we read chart.scale("y") for
    // tick positions and render scaled labels on the right margin.
    if (y2Factor !== null) {
      const plotAny = chart as unknown as Record<string, unknown>;
      const yScale  = typeof plotAny.scale === "function"
        ? (plotAny.scale as (n: string) => Record<string, unknown>)("y")
        : null;

      if (yScale) {
        const applyFn  = yScale.apply as ((v: number) => number) | undefined;
        const domain   = yScale.domain as number[] | undefined;
        const rawTicks = yScale.ticks;
        const ticks: number[] = typeof rawTicks === "function"
          ? (rawTicks as (n?: number) => number[])(6)
          : Array.isArray(rawTicks)
            ? (rawTicks as number[])
            : domain
              ? Array.from({ length: 7 }, (_, i) =>
                  domain[0] + i * (domain[1] - domain[0]) / 6)
              : [];

        const svg        = chart as unknown as SVGSVGElement;
        const svgWidth   = parseFloat(svg.getAttribute("width")  ?? "640");
        const marginRight = typeof coercedOptions.marginRight === "number"
          ? coercedOptions.marginRight : 20;
        const xPos = svgWidth - marginRight;

        const fmt = new Intl.NumberFormat("en-US", {
          notation: "compact", compactDisplay: "short", maximumFractionDigits: 2,
        });

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("aria-label", "y2 axis");

        for (const tick of ticks) {
          const yPos = applyFn ? applyFn(tick) : NaN;
          if (!isFinite(yPos)) continue;
          const originalValue = tick / y2Factor;

          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(xPos)); line.setAttribute("x2", String(xPos + 5));
          line.setAttribute("y1", String(yPos)); line.setAttribute("y2", String(yPos));
          line.setAttribute("stroke", "#999"); line.setAttribute("stroke-width", "1");
          g.appendChild(line);

          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", String(xPos + 8));
          text.setAttribute("y", String(yPos));
          text.setAttribute("dy", "0.32em");
          text.setAttribute("font-size", "10");
          text.setAttribute("fill", "#555");
          text.setAttribute("text-anchor", "start");
          text.textContent = fmt.format(originalValue);
          g.appendChild(text);
        }

        if (y2Label && domain && applyFn) {
          const midY = applyFn((domain[0] + domain[1]) / 2);
          const lx = xPos + 32;
          const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
          label.setAttribute("x", "0"); label.setAttribute("y", "0");
          label.setAttribute("transform", `translate(${lx},${midY}) rotate(-90)`);
          label.setAttribute("text-anchor", "middle");
          label.setAttribute("font-size", "11");
          label.setAttribute("fill", "#555");
          label.textContent = y2Label;
          g.appendChild(label);
        }

        svg.appendChild(g);
      }
    }

    containerRef.current.appendChild(chart);
    return () => chart.remove();
  }, [data, marks, options]);

  return <div ref={containerRef} className="w-full overflow-x-auto" />;
}
