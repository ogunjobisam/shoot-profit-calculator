import { forwardRef } from "react";
import {
  BAND_LABEL,
  hours,
  money,
  rate,
  verdictLine,
  type TrueRateResults,
} from "@/lib/truerate";

const BAND_STYLES: Record<string, { bg: string; fg: string; sub: string }> = {
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
}

export const VerdictCard = forwardRef<HTMLDivElement, VerdictCardProps>(
  ({ results, fee }, ref) => {
    const style = BAND_STYLES[results.band];
    const bigNumber =
      results.paidToWork || results.trueHourlyRate === null
        ? "You paid to work"
        : `${rate(results.trueHourlyRate)}`;

    return (
      <div
        ref={ref}
        className={`${style.bg} ${style.fg} relative overflow-hidden rounded-lg p-7 sm:p-10`}
      >
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${style.sub}`}>
          {BAND_LABEL[results.band]}
        </p>

        <p
          className={`mt-6 font-display leading-[0.9] ${
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

        <div
          className={`mt-9 flex items-baseline justify-between border-t pt-4 text-xs ${style.sub}`}
          style={{ borderColor: "currentColor" }}
        >
          <span className="font-display text-base tracking-tight">TrueRate</span>
          <span className="tracking-wide">truerate.uk</span>
        </div>
      </div>
    );
  },
);

VerdictCard.displayName = "VerdictCard";
