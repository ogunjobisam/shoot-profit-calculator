## TrueRate — shoot profit calculator

Single public page at `/` (rewriting the placeholder index route). No auth, no extra routes. Mobile-first, UK English, £ only.

### Backend (Lovable Cloud)
Enable Cloud, then one migration creating exactly two tables with grants + RLS:
- `email_captures` — id, email, created_at, source (from `utm_source` query param)
- `usage_events` — id, created_at, event (`calculated`|`shared`|`email_captured`), band (`red`|`amber`|`green`)

RLS: anonymous INSERT allowed on both; no SELECT/UPDATE/DELETE policies. Grants: `INSERT` to `anon` and `authenticated`, `ALL` to `service_role`. Client only ever inserts.

### Page structure
1. Headline + intro copy
2. Inputs (live-updating, no submit):
   - Group A: fee, VAT toggle (default No), hours shooting 6 / editing 8 / admin 2 / travel 1.5
   - Group B: travel cost 25, second shooter 0, other costs 0
   - Group C: collapsed "Fine-tune your overheads" — gear 2000, software 600, insurance 900, shoots/yr 30
   - Group D: target hourly rate 50
   All helper texts exactly as specified.
3. Verdict card (visual hero, brand-stamped with "TrueRate" + site URL, band colour dominant)
4. "You should have quoted: £X" (+ inc-VAT line when VAT registered)
5. Email gate → unlocked breakdown + PDF download
6. Footer disclaimer

### Calculation module (pure TS, unit-testable)
Implements exactly the given formulas, with `LONDON_LIVING_WAGE = 14.80` as a single named constant plus the re-check comment. Guards: fee 0/blank → no results; negative net → "You paid to work"; margin floored at −100%. Rounding: nearest £ for money, 1dp for hourly rate.

Bands: red < 14.80, amber 14.80–34.99, green ≥ 35, with the exact verdict copy per band.

### Share + PDF
- Share button renders the verdict card to PNG client-side (`html-to-image`, lighter than html2canvas) and downloads it, with copy-to-clipboard where supported.
- PDF of the breakdown generated client-side with `jspdf` — no server pipeline.

### Event logging
Session-scoped flag so `calculated` fires once when results first render with a valid fee (debounced), `shared` on share use, `email_captured` after a successful insert. All inserts go through a small server function or direct anon insert — anonymous, no inputs stored.

### Design
Editorial, high-contrast, single column, large tap targets. Band colours (red/amber/green) added as semantic tokens in `src/styles.css` — no hardcoded colour utilities. Card designed to look right as a standalone screenshot.

### SEO
Route `head()` with TrueRate-specific title/description/og/twitter tags.
