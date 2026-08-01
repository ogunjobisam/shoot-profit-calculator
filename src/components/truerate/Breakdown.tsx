import { useState } from "react";
import {
  BAND_LABEL,
  hours,
  money,
  rate,
  verdictLine,
  type TrueRateInputs,
  type TrueRateResults,
} from "@/lib/truerate";

interface BreakdownProps {
  input: TrueRateInputs;
  results: TrueRateResults;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-4 border-b border-border py-2.5 text-sm ${
        strong ? "font-semibold" : ""
      }`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function Breakdown({ input, results }: BreakdownProps) {
  const [generating, setGenerating] = useState(false);

  const hourRows = [
    { label: "Shooting", h: input.hoursShooting },
    { label: "Editing", h: input.hoursEditing },
    { label: "Admin & comms", h: input.hoursAdmin },
    { label: "Travelling", h: input.hoursTravel },
  ];

  const hourlyValue = results.trueHourlyRate ?? 0;

  const raisedFee = input.fee * 1.1;
  const raisedNet = raisedFee - results.trueCost;
  const raisedRate = results.totalHours > 0 ? raisedNet / results.totalHours : 0;
  const raisedMargin = raisedFee > 0 ? Math.max(-100, (raisedNet / raisedFee) * 100) : 0;

  async function downloadPdf() {
    setGenerating(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      // Try to embed Instrument Serif for the display numerals / wordmark.
      let display = "helvetica";
      let displayStyle = "bold";
      try {
        const res = await fetch("/fonts/InstrumentSerif-Regular.ttf");
        if (res.ok) {
          const buf = new Uint8Array(await res.arrayBuffer());
          let binary = "";
          for (let i = 0; i < buf.length; i += 0x8000) {
            binary += String.fromCharCode(...buf.subarray(i, i + 0x8000));
          }
          doc.addFileToVFS("InstrumentSerif-Regular.ttf", btoa(binary));
          doc.addFont("InstrumentSerif-Regular.ttf", "InstrumentSerif", "normal");
          display = "InstrumentSerif";
          displayStyle = "normal";
        }
      } catch {
        // silent fallback to helvetica-bold
      }

      const PAGE_W = 595.28;
      const PAGE_H = 841.89;
      const M = 48;
      const W = PAGE_W - M * 2;
      const RIGHT = PAGE_W - M;

      const BAND: Record<"red" | "amber" | "green", [number, number, number]> = {
        red: [159, 29, 29],
        amber: [217, 119, 6],
        green: [22, 101, 52],
      };
      const bandRgb: [number, number, number] = BAND[results.band] ?? [159, 29, 29];
      const INK: [number, number, number] = [28, 25, 23];
      const GREY: [number, number, number] = [120, 113, 108];
      const onBandLight = results.band === "amber";
      const bandText: [number, number, number] = onBandLight ? INK : [255, 255, 255];

      // Page background
      doc.setFillColor(252, 251, 248);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");

      let y = M;

      // ---------- HERO ----------
      const heroH = results.paidToWork ? 190 : 205;
      doc.setFillColor(bandRgb[0], bandRgb[1], bandRgb[2]);
      doc.roundedRect(M, y, W, heroH, 12, 12, "F");

      const hx = M + 28;
      let hy = y + 40;
      doc.setTextColor(bandText[0], bandText[1], bandText[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(BAND_LABEL[results.band].toUpperCase(), hx, hy, { charSpace: 1.6 });

      hy += 58;
      doc.setFont(display, displayStyle);
      doc.setFontSize(results.paidToWork ? 38 : 64);
      doc.text(
        results.paidToWork || results.trueHourlyRate === null
          ? "You paid to work"
          : rate(results.trueHourlyRate),
        hx,
        hy,
      );

      if (!results.paidToWork && results.trueHourlyRate !== null) {
        hy += 18;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("per hour, all in", hx, hy);
      }

      hy += 30;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      const verdict = doc.splitTextToSize(verdictLine(results, input.fee), W - 56);
      doc.text(verdict, hx, hy);
      hy += verdict.length * 16 + 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(
        `True margin: ${
          results.marginPct === null ? "—" : `${Math.round(results.marginPct)}%`
        }  ·  ${hours(results.totalHours)} hours of your life  ·  ${money(
          results.trueCost,
        )} real costs`,
        hx,
        hy,
      );

      y += heroH + 34;

      // ---------- table helpers ----------
      const sectionHeading = (text: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(GREY[0], GREY[1], GREY[2]);
        doc.text(text.toUpperCase(), M, y, { charSpace: 1.4 });
        y += 8;
        doc.setDrawColor(INK[0], INK[1], INK[2]);
        doc.setLineWidth(2);
        doc.line(M, y, RIGHT, y);
        y += 20;
      };

      const row = (label: string, value: string, strong = false) => {
        doc.setFont("helvetica", strong ? "bold" : "normal");
        doc.setFontSize(strong ? 11 : 10.5);
        doc.setTextColor(strong ? INK[0] : 68, strong ? INK[1] : 64, strong ? INK[2] : 60);
        doc.text(label, M, y);
        doc.text(value, RIGHT, y, { align: "right" });
        y += 18;
      };

      const thinRule = () => {
        y -= 7;
        doc.setDrawColor(214, 211, 205);
        doc.setLineWidth(0.7);
        doc.line(M, y, RIGHT, y);
        y += 18;
      };

      const hrs = (n: number) => `${hours(n)} ${n === 1 ? "hr" : "hrs"}`;

      // ---------- MONEY ----------
      sectionHeading("Where the money went");
      row("Shoot fee (ex VAT)", money(input.fee));
      row("Travel", `- ${money(input.travelCost)}`);
      row("Second shooter / assistant", `- ${money(input.secondShooter)}`);
      row("Other direct costs", `- ${money(input.otherCosts)}`);
      row(
        `Overheads (1/${input.shootsPerYear} of your year)`,
        `- ${money(results.overheadPerShoot)}`,
      );
      thinRule();
      row("Total real costs", money(results.trueCost), true);

      y += 16;

      // ---------- HOURS ----------
      sectionHeading("Where the hours went");
      hourRows.forEach((r) => row(`${r.label} · ${hrs(r.h)}`, money(r.h * hourlyValue)));
      thinRule();
      row(`Total · ${hrs(results.totalHours)}`, money(results.netEarnings), true);

      y += 12;

      // ---------- TEASER ----------
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(bandRgb[0], bandRgb[1], bandRgb[2]);
      doc.text(
        `If you'd charged 10% more: ${money(raisedFee)} -> ${rate(
          raisedRate,
        )}/hr · ${Math.round(raisedMargin)}% margin`,
        M,
        y,
      );

      // ---------- QUOTE BLOCK ----------
      const quoteH = input.vatRegistered ? 132 : 112;
      const quoteY = PAGE_H - M - 78 - quoteH;
      doc.setFillColor(INK[0], INK[1], INK[2]);
      doc.roundedRect(M, quoteY, W, quoteH, 12, 12, "F");

      let qy = quoteY + 34;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(168, 162, 155);
      doc.text("YOU SHOULD HAVE QUOTED", M + 28, qy, { charSpace: 1.4 });

      qy += 48;
      doc.setFont(display, displayStyle);
      doc.setFontSize(40);
      doc.setTextColor(255, 255, 255);
      doc.text(money(results.suggestedFeeExVat), M + 28, qy);

      qy += 22;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(168, 162, 155);
      doc.text(
        input.vatRegistered
          ? `${money(results.suggestedFeeIncVat)} inc VAT — what the client sees · at your ${money(
              input.targetRate,
            )}/hr target`
          : `at your ${money(input.targetRate)}/hr target`,
        M + 28,
        qy,
      );

      // ---------- FOOTER ----------
      let fy = PAGE_H - M - 52;
      doc.setDrawColor(bandRgb[0], bandRgb[1], bandRgb[2]);
      doc.setLineWidth(3);
      doc.line(M, fy, RIGHT, fy);

      fy += 20;
      doc.setFont(display, displayStyle);
      doc.setFontSize(15);
      doc.setTextColor(INK[0], INK[1], INK[2]);
      doc.text("TrueShootRate", M, fy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text("trueshootrate.app", RIGHT, fy, { align: "right" });

      fy += 18;
      doc.setFontSize(8);
      doc.setTextColor(GREY[0], GREY[1], GREY[2]);
      doc.text(
        `Estimates for guidance only — not accounting or tax advice.  ·  Generated ${new Date().toLocaleDateString(
          "en-GB",
        )}`,
        M,
        fy,
      );

      doc.save("trueshootrate-breakdown.pdf");
    } finally {
      setGenerating(false);
    }
  }


  return (
    <div className="space-y-10">
      <section>
        <h3 className="font-display text-2xl">Where the money went</h3>
        <div className="mt-3">
          <Row label="Shoot fee (ex VAT)" value={money(input.fee)} strong />
          <Row label="Travel" value={`- ${money(input.travelCost)}`} />
          <Row label="Second shooter / assistant" value={`- ${money(input.secondShooter)}`} />
          <Row label="Other direct costs" value={`- ${money(input.otherCosts)}`} />
          <Row
            label={`Overheads (1/${input.shootsPerYear} of your year)`}
            value={`- ${money(results.overheadPerShoot)}`}
          />
          <Row label="Net earnings" value={money(results.netEarnings)} strong />
        </div>
      </section>

      <section>
        <h3 className="font-display text-2xl">Where the hours went</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          What each block of time actually earned you at {rate(hourlyValue)}/hr.
        </p>
        <div className="mt-3">
          {hourRows.map((r) => (
            <Row
              key={r.label}
              label={`${r.label} · ${hours(r.h)} hrs · ${Math.round(
                results.totalHours > 0 ? (r.h / results.totalHours) * 100 : 0,
              )}%`}
              value={money(r.h * hourlyValue)}
            />
          ))}
          <Row label={`Total · ${hours(results.totalHours)} hrs`} value={money(results.netEarnings)} strong />
        </div>
      </section>

      <section>
        <h3 className="font-display text-2xl">What a 10% price rise does</h3>
        <div className="mt-3">
          <Row label="New fee" value={money(raisedFee)} />
          <Row label="New hourly rate" value={`${rate(raisedRate)}/hr`} />
          <Row
            label="New margin"
            value={`${Math.round(raisedMargin)}%`}
            strong
          />
          <Row
            label="Extra in your pocket"
            value={money(raisedNet - results.netEarnings)}
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Costs don't move when your price does. Every extra pound is margin.
        </p>
      </section>

      <button
        type="button"
        onClick={downloadPdf}
        disabled={generating}
        className="w-full rounded-md bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {generating ? "Preparing PDF…" : "Download the PDF breakdown"}
      </button>
    </div>
  );
}
