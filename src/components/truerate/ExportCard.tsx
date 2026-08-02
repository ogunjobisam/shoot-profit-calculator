import { forwardRef } from "react";
import {
  annualLine,
  bandLabel,
  hours,
  money,
  rate,
  verdictLine,
  type Band,
  type TrueRateResults,
} from "@/lib/truerate";

const BAND_CLASS: Record<Band, string> = {
  red: "bg-band-red text-band-red-foreground",
  amber: "bg-band-amber text-band-amber-foreground",
  green: "bg-band-green text-band-green-foreground",
};

export const EXPORT_SIZES = {
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
} as const;

interface ExportCardProps {
  variant: "feed" | "story";
  results: TrueRateResults;
  fee: number;
  shootsPerYear: number;
  hideFee?: boolean;
}

/**
 * Full-bleed poster used only for image export (and its live preview).
 * The band colour fills the entire canvas — no card edges, no cream margin.
 */
export const ExportCard = forwardRef<HTMLDivElement, ExportCardProps>(
  ({ variant, results, fee, shootsPerYear, hideFee = false }, ref) => {
    const isStory = variant === "story";
    const size = EXPORT_SIZES[variant];
    const loss = results.paidToWork || results.trueHourlyRate === null;
    const rateSize = isStory ? 280 : 230;

    return (
      <div
        ref={ref}
        className={BAND_CLASS[results.band]}
        style={{
          width: size.width,
          height: size.height,
          padding: isStory ? "250px 80px" : "80px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: isStory ? "center" : "space-between",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: isStory ? "center" : "space-between",
            flex: 1,
            gap: isStory ? 48 : 0,
          }}
        >
          <p
            style={{
              fontSize: 30,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              opacity: 0.75,
              margin: 0,
            }}
          >
            {bandLabel(results)}
          </p>

          <div>
            <p
              className="font-display"
              style={{
                fontSize: loss ? Math.round(rateSize * 0.42) : rateSize,
                lineHeight: 0.9,
                margin: 0,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {loss ? "You paid to work" : rate(results.trueHourlyRate ?? 0)}
            </p>
            {!loss ? (
              <p style={{ fontSize: 36, fontWeight: 500, opacity: 0.75, margin: "16px 0 0" }}>
                per hour, all in
              </p>
            ) : null}
          </div>

          <p
            style={{
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.15,
              margin: 0,
              maxWidth: 880,
            }}
          >
            {verdictLine(results, fee, hideFee)}
          </p>

          <div>
            <p style={{ fontSize: 34, opacity: 0.75, margin: 0, lineHeight: 1.35 }}>
              True margin: {results.marginPct === null ? "—" : `${Math.round(results.marginPct)}%`}{" "}
              · {hours(results.totalHours)} hours of your life · {money(results.trueCost)} real
              costs
            </p>
            <p style={{ fontSize: 34, opacity: 0.75, margin: "16px 0 0", lineHeight: 1.35 }}>
              {annualLine(results, shootsPerYear)}
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: isStory ? 64 : 48,
            paddingTop: 28,
            borderTop: "2px solid currentColor",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <span className="font-display" style={{ fontSize: 40, letterSpacing: "-0.01em" }}>
            TrueShootRate
          </span>
          <span style={{ fontSize: 30, opacity: 0.75, letterSpacing: "0.04em" }}>
            trueshootrate.app
          </span>
        </div>
      </div>
    );
  },
);

ExportCard.displayName = "ExportCard";
