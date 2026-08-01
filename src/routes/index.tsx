import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { NumberField } from "@/components/truerate/NumberField";
import { VerdictCard } from "@/components/truerate/VerdictCard";
import { Breakdown } from "@/components/truerate/Breakdown";
import {
  calculate,
  DEFAULT_INPUTS,
  HMRC_MILEAGE_PENCE,
  money,
  rate,
  type TrueRateInputs,
} from "@/lib/truerate";
import { captureEmail, trackEvent } from "@/lib/track";

export const Route = createFileRoute("/")({
  component: TrueRatePage,
  head: () => ({
    meta: [
      { title: "TrueShootRate — What did you actually earn per hour on your last shoot?" },
      {
        name: "description",
        content:
          "A free calculator for UK photographers: work out your true hourly rate once editing, admin, travel and gear are counted — and what you should have quoted.",
      },
      {
        property: "og:title",
        content: "TrueShootRate — What did you actually earn per hour on your last shoot?",
      },
      {
        property: "og:description",
        content:
          "A free calculator for UK photographers: work out your true hourly rate once editing, admin, travel and gear are counted — and what you should have quoted.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://trueshootrate.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://trueshootrate.app/" }],
  }),
});

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </h2>
  );
}

const CHIP_STYLES: Record<"red" | "amber" | "green", string> = {
  red: "bg-band-red text-band-red-foreground",
  amber: "bg-band-amber text-band-amber-foreground",
  green: "bg-band-green text-band-green-foreground",
};

function TrueRatePage() {
  const [input, setInput] = useState<TrueRateInputs>(DEFAULT_INPUTS);
  const [overheadsOpen, setOverheadsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const trackedRef = useRef(false);

  const results = useMemo(() => calculate(input), [input]);
  const hasResults = input.fee > 0;

  const set = <K extends keyof TrueRateInputs>(key: K) => (value: TrueRateInputs[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  // Restore a previous unlock (client-only, after hydration).
  useEffect(() => {
    try {
      if (window.localStorage.getItem("tsr_unlocked") === "1") setUnlocked(true);
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Fire "calculated" once per session, after the fee settles.
  useEffect(() => {
    if (!hasResults || trackedRef.current) return;
    const t = setTimeout(() => {
      if (trackedRef.current) return;
      trackedRef.current = true;
      void trackEvent("calculated", results.band);
    }, 1200);
    return () => clearTimeout(t);
  }, [hasResults, results.band]);


  async function handleShare() {
    if (!cardRef.current) return;
    const shareUrl = "https://trueshootrate.app/";
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error("Could not render card");

      const file = new File([blob], "trueshootrate.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "TrueShootRate", text: shareUrl });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "trueshootrate.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Verdict card saved as an image.");
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied", { description: shareUrl });
      } catch {
        toast.info("Share link", { description: shareUrl });
      }

      void trackEvent("shared", results.band);
    } catch {
      toast.error("Couldn't create the image. Try again.");
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("That email doesn't look right.");
      return;
    }
    setSubmitting(true);
    try {
      const source =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("utm_source")
          : null;
      await captureEmail(email.trim().toLowerCase(), source);
      void trackEvent("email_captured", results.band);
      try {
        window.localStorage.setItem("tsr_unlocked", "1");
      } catch {
        /* storage unavailable */
      }
      setUnlocked(true);
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-24 pt-12 sm:pt-16">
      <Toaster />

      <header>
        <p className="font-display text-lg tracking-tight">TrueShootRate</p>
        <h1 className="mt-6 font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          What did you actually earn per hour on your last shoot?
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Most photographers price on instinct and quietly earn less than minimum wage once
          editing, admin and gear are counted. Two minutes. Real numbers. No sugar-coating.
        </p>
      </header>

      <div className="mt-12 space-y-10">
        <section className="space-y-5">
          <SectionTitle>The shoot</SectionTitle>
          <NumberField
            id="fee"
            label="Shoot fee (£)"
            helper="What the client paid you, excluding VAT if you're VAT-registered."
            prefix="£"
            placeholder="0"
            value={input.fee}
            onChange={set("fee")}
          />

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">VAT registered?</span>
              <div className="flex overflow-hidden rounded-md border border-border">
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set("vatRegistered")(v)}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                      input.vatRegistered === v
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {input.vatRegistered ? (
              <p className="mt-3 text-xs leading-snug text-muted-foreground">
                All figures use your fee excluding VAT — VAT collected is not your money.
              </p>
            ) : null}
          </div>

          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">Paid by card or online?</span>
              <div className="flex overflow-hidden rounded-md border border-border">
                {[false, true].map((v) => (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => set("cardPayment")(v)}
                    className={`px-5 py-2 text-sm font-medium transition-colors ${
                      input.cardPayment === v
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground"
                    }`}
                  >
                    {v ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            {input.cardPayment ? (
              <p className="mt-3 text-xs leading-snug text-muted-foreground">
                We add an estimated 2% card &amp; platform fee to your direct costs.
              </p>
            ) : null}
          </div>

          <NumberField
            id="shooting"
            label="Hours shooting"
            suffix="hrs"
            step={0.5}
            value={input.hoursShooting}
            onChange={set("hoursShooting")}
          />
          <NumberField
            id="editing"
            label="Hours editing"
            helper="Be honest. Culling, editing, exporting, revisions."
            suffix="hrs"
            step={0.5}
            value={input.hoursEditing}
            onChange={set("hoursEditing")}
          />
          <NumberField
            id="admin"
            label="Hours on admin & comms"
            helper="Enquiries, calls, contracts, gallery delivery."
            suffix="hrs"
            step={0.5}
            value={input.hoursAdmin}
            onChange={set("hoursAdmin")}
          />
          <NumberField
            id="travel-hours"
            label="Hours travelling"
            suffix="hrs"
            step={0.5}
            value={input.hoursTravel}
            onChange={set("hoursTravel")}
          />
        </section>

        <section className="space-y-5">
          <SectionTitle>Direct costs for this shoot</SectionTitle>
          <NumberField
            id="travel-cost"
            label="Travel cost (£)"
            helper={`Driving? Count ${HMRC_MILEAGE_PENCE}p a mile (HMRC's rate) — fuel alone misses wear, tyres and insurance.`}
            prefix="£"
            value={input.travelCost}
            onChange={set("travelCost")}
          />
          <NumberField
            id="second-shooter"
            label="Second shooter / assistant (£)"
            prefix="£"
            value={input.secondShooter}
            onChange={set("secondShooter")}
          />
          <NumberField
            id="other-costs"
            label="Other direct costs (£)"
            helper="Prints, albums, outsourced editing, permits, rentals, meals."
            prefix="£"
            value={input.otherCosts}
            onChange={set("otherCosts")}
          />
        </section>

        <section>
          <button
            type="button"
            onClick={() => setOverheadsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-card px-4 py-4 text-left"
            aria-expanded={overheadsOpen}
          >
            <span className="text-sm font-semibold">Fine-tune your overheads</span>
            <span className="text-muted-foreground">{overheadsOpen ? "−" : "+"}</span>
          </button>
          {overheadsOpen ? (
            <div className="mt-5 space-y-5">
              <NumberField
                id="gear"
                label="Annual gear spend (£/yr)"
                helper="Bodies, lenses, lighting — averaged per year, not what you spent this year."
                prefix="£"
                value={input.gearAnnual}
                onChange={set("gearAnnual")}
              />
              <NumberField
                id="software"
                label="Annual software & subscriptions (£/yr)"
                prefix="£"
                value={input.softwareAnnual}
                onChange={set("softwareAnnual")}
              />
              <NumberField
                id="insurance"
                label="Annual insurance, accounting & misc business costs (£/yr)"
                prefix="£"
                value={input.insuranceAnnual}
                onChange={set("insuranceAnnual")}
              />
              <NumberField
                id="shoots"
                label="Paid shoots per year"
                value={input.shootsPerYear}
                onChange={set("shootsPerYear")}
              />
            </div>
          ) : null}
        </section>

        <section className="space-y-5">
          <SectionTitle>Target</SectionTitle>
          <NumberField
            id="target"
            label="Target hourly rate (£/hr)"
            helper="What your time should be worth as a skilled professional."
            prefix="£"
            suffix="/hr"
            value={input.targetRate}
            onChange={set("targetRate")}
          />
        </section>
      </div>

      {hasResults ? (
        <div id="verdict" className="mt-14 space-y-8">
          <VerdictCard ref={cardRef} results={results} fee={input.fee} />

          <button
            type="button"
            onClick={handleShare}
            className="w-full rounded-md border border-primary px-5 py-4 text-base font-semibold transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Share this verdict
          </button>

          <div className="rounded-md border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground">You should have quoted</p>
            <p className="mt-1 font-display text-4xl tracking-tight">
              {money(results.suggestedFeeExVat)}
            </p>
            {input.vatRegistered ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {money(results.suggestedFeeIncVat)} including VAT — what the client sees.
              </p>
            ) : null}
          </div>

          <section className="rounded-md border border-border bg-card p-6">
            <h2 className="font-display text-2xl tracking-tight">Get the full breakdown</h2>
            {unlocked ? (
              <div className="mt-6">
                <Breakdown input={input} results={results} />
              </div>
            ) : (
              <>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Enter your email and get the full breakdown of where your money actually went —
                  plus the quote calculator most photographers never do.
                </p>
                <form onSubmit={handleEmail} className="mt-5 space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.co.uk"
                    aria-label="Email address"
                    className="h-14 w-full rounded-md border border-border bg-background px-4 text-base outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-md bg-primary px-5 py-4 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {submitting ? "Unlocking…" : "Unlock the breakdown"}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      ) : null}

      <footer className="mt-16 border-t border-border pt-6">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Estimates for guidance only — not accounting or tax advice. VAT treatment simplified
          (standard 20%, excludes Flat Rate Scheme).
        </p>
      </footer>

      {hasResults ? (
        <button
          type="button"
          onClick={() =>
            document.getElementById("verdict")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className={`fixed inset-x-0 bottom-0 z-50 flex h-14 w-full items-center justify-between px-5 text-left transition-colors duration-300 sm:hidden ${CHIP_STYLES[results.band]}`}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Jump to your verdict"
        >
          <span className="font-display text-2xl tabular-nums leading-none">
            {results.paidToWork || results.trueHourlyRate === null
              ? "You paid to work"
              : rate(results.trueHourlyRate)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-75">
            per hour
          </span>
        </button>
      ) : null}
    </main>

  );
}
