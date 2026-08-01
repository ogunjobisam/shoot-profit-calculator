import { useState } from "react";
import {
  hours,
  money,
  rate,
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
      let y = 56;
      const left = 48;

      doc.setFontSize(22);
      doc.text("TrueShootRate — shoot breakdown", left, y);
      y += 26;
      doc.setFontSize(10);
      doc.text(`Generated ${new Date().toLocaleDateString("en-GB")} · trueshootrate.app`, left, y);
      y += 32;

      const line = (label: string, value: string) => {
        doc.setFontSize(11);
        doc.text(label, left, y);
        doc.text(value, 540, y, { align: "right" });
        y += 18;
      };
      const heading = (text: string) => {
        y += 10;
        doc.setFontSize(13);
        doc.text(text, left, y);
        y += 18;
      };

      heading("Headline");
      line(
        "True hourly rate",
        results.paidToWork ? "You paid to work" : `${rate(hourlyValue)}/hr`,
      );
      line("Shoot fee (ex VAT)", money(input.fee));
      line("Net earnings", money(results.netEarnings));
      line(
        "True margin",
        results.marginPct === null ? "—" : `${Math.round(results.marginPct)}%`,
      );

      heading("Where the money went");
      line("Travel", money(input.travelCost));
      line("Second shooter / assistant", money(input.secondShooter));
      line("Other direct costs", money(input.otherCosts));
      line("Overheads allocated to this shoot", money(results.overheadPerShoot));
      line("Total real costs", money(results.trueCost));

      heading("Where the hours went");
      hourRows.forEach((r) => line(r.label, `${hours(r.h)} hrs · ${money(r.h * hourlyValue)}`));
      line("Total", `${hours(results.totalHours)} hrs`);

      heading("A 10% price rise");
      line("New fee", money(raisedFee));
      line("New hourly rate", `${rate(raisedRate)}/hr`);
      line("New margin", `${Math.round(raisedMargin)}%`);

      heading("What you should have quoted");
      line(`At ${money(input.targetRate)}/hr target`, money(results.suggestedFeeExVat));
      if (input.vatRegistered) {
        line("Including VAT (what the client sees)", money(results.suggestedFeeIncVat));
      }

      y += 20;
      doc.setFontSize(9);
      doc.text(
        "Estimates for guidance only — not accounting or tax advice.",
        left,
        y,
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
          <Row label="Travel" value={`− ${money(input.travelCost)}`} />
          <Row label="Second shooter / assistant" value={`− ${money(input.secondShooter)}`} />
          <Row label="Other direct costs" value={`− ${money(input.otherCosts)}`} />
          <Row
            label={`Overheads (1/${input.shootsPerYear} of your year)`}
            value={`− ${money(results.overheadPerShoot)}`}
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
