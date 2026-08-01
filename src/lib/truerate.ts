// TrueRate calculation engine — pure, client-side, no side effects.

// LLW 2025/26 rate, announced Oct 2025 — re-check every autumn at livingwage.org.uk
export const LONDON_LIVING_WAGE = 14.8;

export const PROFESSIONAL_RATE = 35;

export const VAT_RATE = 0.2;

// HMRC approved mileage rate (pence per mile, first 10k miles) — re-check each April.
export const HMRC_MILEAGE_PENCE = 55;

export const CARD_FEE_RATE = 0.02;

export type Band = "red" | "amber" | "green";

export interface TrueRateInputs {
  fee: number;
  vatRegistered: boolean;
  hoursShooting: number;
  hoursEditing: number;
  hoursAdmin: number;
  hoursTravel: number;
  travelCost: number;
  secondShooter: number;
  otherCosts: number;
  cardPayment: boolean;
  gearAnnual: number;
  softwareAnnual: number;
  insuranceAnnual: number;
  marketingAnnual: number;
  studioAnnual: number;
  shootsPerYear: number;
  targetRate: number;
}

export const DEFAULT_INPUTS: TrueRateInputs = {
  fee: 0,
  vatRegistered: false,
  hoursShooting: 6,
  hoursEditing: 8,
  hoursAdmin: 2,
  hoursTravel: 1.5,
  travelCost: 25,
  secondShooter: 0,
  otherCosts: 0,
  cardPayment: false,
  gearAnnual: 2000,
  softwareAnnual: 600,
  insuranceAnnual: 900,
  marketingAnnual: 500,
  studioAnnual: 0,
  shootsPerYear: 30,
  targetRate: 50,
};

export interface TrueRateResults {
  totalHours: number;
  overheadPerShoot: number;
  directCosts: number;
  cardFee: number;
  trueCost: number;
  netEarnings: number;
  trueHourlyRate: number | null;
  marginPct: number | null;
  suggestedFeeExVat: number;
  suggestedFeeIncVat: number;
  band: Band;
  paidToWork: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function bandFor(rate: number): Band {
  if (rate < LONDON_LIVING_WAGE) return "red";
  if (rate < PROFESSIONAL_RATE) return "amber";
  return "green";
}

export const BAND_LABEL: Record<Band, string> = {
  red: "Below the London Living Wage",
  amber: "Hobby money for professional work",
  green: "Professional territory",
};

export const bandLabel = (res: TrueRateResults) =>
  res.paidToWork ? "You made a loss" : BAND_LABEL[res.band];

export function calculate(input: TrueRateInputs): TrueRateResults {
  const totalHours = round2(
    input.hoursShooting + input.hoursEditing + input.hoursAdmin + input.hoursTravel,
  );

  const overheadPerShoot =
    input.shootsPerYear > 0
      ? round2(
          (input.gearAnnual +
            input.softwareAnnual +
            input.insuranceAnnual +
            input.marketingAnnual +
            input.studioAnnual) /
            input.shootsPerYear,
        )
      : 0;

  const cardFee = input.cardPayment ? round2(input.fee * CARD_FEE_RATE) : 0;

  const directCosts = round2(
    input.travelCost + input.secondShooter + input.otherCosts + cardFee,
  );
  const trueCost = round2(directCosts + overheadPerShoot);
  const netEarnings = round2(input.fee - trueCost);

  const trueHourlyRate = totalHours > 0 ? round2(netEarnings / totalHours) : null;

  const marginPct =
    input.fee > 0 ? Math.max(-100, round2((netEarnings / input.fee) * 100)) : null;

  const suggestedFeeExVat = round2(input.targetRate * totalHours + trueCost);
  const suggestedFeeIncVat = round2(suggestedFeeExVat * (1 + VAT_RATE));

  return {
    totalHours,
    overheadPerShoot,
    directCosts,
    trueCost,
    netEarnings,
    trueHourlyRate,
    marginPct,
    suggestedFeeExVat,
    suggestedFeeIncVat,
    band: bandFor(trueHourlyRate ?? 0),
    paidToWork: netEarnings < 0,
  };
}

export const money = (n: number) => {
  const r = Math.round(n);
  const abs = Math.abs(r).toLocaleString("en-GB", { maximumFractionDigits: 0 });
  return `${r < 0 ? "-" : ""}£${abs}`;
};

export const rate = (n: number) =>
  `${n < 0 ? "-" : ""}£${Math.abs(n).toFixed(1)}`;

export const hours = (n: number) =>
  n.toLocaleString("en-GB", { maximumFractionDigits: 2 });

export function verdictLine(res: TrueRateResults, fee: number): string {
  const feeText = money(fee);
  if (res.paidToWork || res.trueHourlyRate === null) {
    return `Your ${feeText} shoot cost you more than it paid. You paid to work.`;
  }
  const rateText = `${rate(res.trueHourlyRate)}/hour`;
  if (res.band === "red")
    return `Your ${feeText} shoot paid you ${rateText}. That's below minimum wage territory.`;
  if (res.band === "amber")
    return `Your ${feeText} shoot paid you ${rateText}. Skilled work, hobby money.`;
  return `Your ${feeText} shoot paid you ${rateText}. Now protect it.`;
}
