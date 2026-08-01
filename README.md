# Shoot Profit Calculator

TrueRate — Lovable Build Prompt v1

Paste everything below the line into Lovable as the first prompt.

Build a single-page public web tool called TrueRate — a shoot profit calculator for UK photographers. No auth, no accounts, no dashboard, no routing beyond the one page. Mobile-first: most traffic arrives from Instagram/TikTok links on phones. UK English, £ only.

Headline: "What did you actually earn per hour on your last shoot?"

Intro copy under the headline: "Most photographers price on instinct and quietly earn less than minimum wage once editing, admin and gear are counted. Two minutes. Real numbers. No sugar-coating."

Flow

Inputs → live-updating results (no submit button) → verdict card → email gate for the detailed breakdown + PDF.

Inputs

Group A — The shoot

Shoot fee (£), number input. Helper: "What the client paid you, excluding VAT if you're VAT-registered."

VAT registered? — toggle, default No. If Yes, show note: "All figures use your fee excluding VAT — VAT collected is not your money."

Hours shooting — number, default 6

Hours editing — number, default 8. Helper: "Be honest. Culling, editing, exporting, revisions."

Hours on admin & comms — number, default 2. Helper: "Enquiries, calls, contracts, gallery delivery."

Hours travelling — number, default 1.5

Group B — Direct costs for this shoot

Travel cost (£) — default 25. Helper: "Fuel, trains, parking."

Second shooter / assistant (£) — default 0

Other direct costs (£) — default 0. Helper: "Prints, albums, rentals, meals."

Group C — Overheads (collapsed by default behind a "Fine-tune your overheads" expander, pre-filled)

Annual gear spend (£/yr) — default 2000. Helper: "Bodies, lenses, lighting — averaged per year, not what you spent this year."

Annual software & subscriptions (£/yr) — default 600

Annual insurance, accounting & misc business costs (£/yr) — default 900

Paid shoots per year — default 30

Group D — Target

Target hourly rate (£/hr) — default 50. Helper: "What your time should be worth as a skilled professional."

Calculation logic (all client-side, live-updating)

Currency to 2dp internally; display to nearest £ except hourly rate (1dp).

total_hours = shooting + editing + admin + travel_hours

overhead_per_shoot = (gear_annual + software_annual + insurance_annual) / shoots_per_year

direct_costs = travel_cost + second_shooter + other_costs

true_cost = direct_costs + overhead_per_shoot

net_earnings = fee − true_cost

true_hourly_rate = net_earnings / total_hours (guard: total_hours > 0)

margin_pct = net_earnings / fee × 100 (guard: fee > 0)

suggested_fee_ex_vat = (target_rate × total_hours) + true_cost

If VAT registered, also show suggested_fee_inc_vat = suggested_fee_ex_vat × 1.20, labelled "what the client sees"

Edge cases

fee = 0 or blank → show inputs only, no results

net_earnings < 0 → display "You paid to work" in place of a negative hourly rate

Cap displayed margin at −100%

Rate bands (drive verdict colour and copy — store the threshold as a single named constant LONDON_LIVING_WAGE = 14.80 with a code comment: "LLW 2025/26 rate, announced Oct 2025 — re-check every autumn at livingwage.org.uk")

Red: below £14.80/hr — "Below the London Living Wage"

Amber: £14.80–£34.99/hr — "Hobby money for professional work"

Green: £35/hr and above — "Professional territory"

Results display

Verdict card — this is the screenshot unit and the visual hero. Brand-stamp it with the TrueRate name and the site URL so shared screenshots market the tool.

Big number: true hourly rate

Verdict line, exact copy by band:

Red: "Your £{fee} shoot paid you £{rate}/hour. That's below minimum wage territory."

Amber: "Your £{fee} shoot paid you £{rate}/hour. Skilled work, hobby money."

Green: "Your £{fee} shoot paid you £{rate}/hour. Now protect it."

Sub-line: "True margin: {margin}% · {total_hours} hours of your life · £{true_cost} real costs"

Share button: renders the verdict card to an image client-side (html-to-canvas approach) and downloads/copies it

Below the card, visible without email:

"You should have quoted: £{suggested_fee_ex_vat}" (+ the inc-VAT line if registered)

Email-gated section — "Get the full breakdown":

Gate copy: "Enter your email and get the full breakdown of where your money actually went — plus the quote calculator most photographers never do."

Unlocked content: line-by-line cost breakdown, hour-by-hour value table, what a 10% price rise does to margin, and a PDF download of the breakdown (generate the PDF client-side — no server pipeline)

Footer disclaimer: "Estimates for guidance only — not accounting or tax advice. VAT treatment simplified (standard 20%, excludes Flat Rate Scheme)."

Backend (Supabase — keep it minimal)

Exactly two tables, nothing else:

email_captures: id, email, created_at, source (populated from utm_source query param if present). Store nothing else — never store calculation inputs against an email.

usage_events: id, created_at, event (one of "calculated" | "shared" | "email_captured"), band ("red" | "amber" | "green"). Fully anonymous — no inputs, no IPs, no identifiers.

Event logging rules:

Fire "calculated" once per session when results first render with a valid fee (not on every keystroke)

Fire "shared" on share-button use

Fire "email_captured" on successful email insert

Public inserts only; no reads from the client. RLS: allow anonymous INSERT on both tables, deny SELECT/UPDATE/DELETE.

No analytics tools, no auth, no additional tables.

Design direction

Mobile-first, single column, generous tap targets

Confident, editorial tone — this is a truth-telling tool, not a cutesy calculator

Verdict card must look good as a standalone screenshot: strong contrast, band colour as the dominant accent (red/amber/green), brand stamp bottom corner

Fast: no heavy libraries beyond what the share-image and PDF generation need

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33a12c23-94b2-4ac6-b97c-fe38baa7f373).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
