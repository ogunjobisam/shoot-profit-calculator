import { forwardRef, useEffect, useRef, useState } from "react";
import {
  annualLine,
  bandLabel,
  hours,
  money,
  rate,
  verdictLine,
  type TrueRateResults,
} from "@/lib/truerate";

const BAND_STYLES: Record<"red" | "amber" | "green", { bg: string; fg: string; sub: string }> = {
  red: {
    bg: "bg-band-red",
    fg: "text-band-red-foreground",
    sub: "text-band-red-foreground/75",
  },
  amber: {
    bg: "bg-band-amber",
    fg: "text-band-amber-foreground",
    sub: "text-band-amber-foreground/75",
  },
  green: {
    bg: "bg-band-green",
    fg: "text-band-green-foreground",
    sub: "text-band-green-foreground/75",
  },
};

interface VerdictCardProps {
  results: TrueRateResults;
  fee: number;
  shootsPerYear: number;
  hideFee?: boolean;
}


// Eases a numeric value towards its target over ~400ms.
function useAnimatedNumber(target: number, duration = 400) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      fromRef.current = next;
      setValue(next);
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

export const VerdictCard = forwardRef<HTMLDivElement, VerdictCardProps>(
  ({ results, fee, shootsPerYear, hideFee = false }, ref) => {

    const style = BAND_STYLES[results.band];
    const animatedRate = useAnimatedNumber(results.trueHourlyRate ?? 0);
    const bigNumber =
      results.paidToWork || results.trueHourlyRate === null
        ? "You paid to work"
        : `${rate(animatedRate)}`;

    return (
      <div
        ref={ref}
        className={`${style.bg} ${style.fg} relative overflow-hidden rounded-lg p-7 transition-colors duration-300 sm:p-10`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${style.sub}`}>
          {bandLabel(results)}
        </p>

        <p
          className={`mt-6 font-display leading-[0.9] tabular-nums ${
            results.paidToWork ? "text-5xl sm:text-6xl" : "text-7xl sm:text-8xl"
          }`}
        >
          {bigNumber}
        </p>
        {!results.paidToWork && results.trueHourlyRate !== null ? (
          <p className={`mt-1 text-sm font-medium ${style.sub}`}>per hour, all in</p>
        ) : null}

        <p className="mt-7 max-w-md text-lg font-medium leading-snug sm:text-xl">
          {verdictLine(results, fee)}
        </p>

        <p className={`mt-4 text-sm ${style.sub}`}>
          True margin: {results.marginPct === null ? "—" : `${Math.round(results.marginPct)}%`} ·{" "}
          {hours(results.totalHours)} hours of your life · {money(results.trueCost)} real costs
        </p>

        <p className={`mt-2 text-sm ${style.sub}`}>{annualLine(results, shootsPerYear)}</p>

        <div
          className={`mt-9 flex items-baseline justify-between border-t pt-4 text-xs ${style.sub}`}
          style={{ borderColor: "currentColor" }}
        >
          <span className="font-display text-base tracking-tight">TrueShootRate</span>
          <span className="tracking-wide">trueshootrate.app</span>
        </div>
      </div>
    );
  },
);

VerdictCard.displayName = "VerdictCard";
