# WHITEBOARD — Funnel Event Dictionary

The full data contract for the acquisition funnel. One shared layer
(`assets/wb-funnel.js`, exposed as `WBF`) fires every event to **three sinks**:
`dataLayer` (GTM/GA4), **Microsoft Clarity** (custom events + session tags), and
the **Meta Pixel** (standard events where mapped, custom otherwise). Every event
carries the same identity so the whole journey can be stitched and optimized.

Add `?wbdebug=1` to any URL to see events live in the console. In the console,
`WBF.dump()` prints the full path the visitor took; `WBF.journey()` returns it.

## Identity carried on EVERY event

| field | meaning |
|-------|---------|
| `funnel_id` | one journey per tab-session — threads homepage → popup → checkout → thank-you |
| `plan` / `billing` / `value` / `currency` | current context (set via `WBF.set`, rides on all later events) |
| `step_index` | position in the ordered funnel spine (0–9) — only on spine steps; drives funnel reports |
| `step_ms` | ms since the previous event (velocity / hesitation) |
| `page` | `homepage` \| `checkout` \| `thank_you` |
| `utm_source/medium/campaign/content/term`, `referrer`, `landing`, `first_seen` | first-touch attribution (persisted) |
| `ts` | event time |

## The funnel spine (ordered — this is the drop-off report)

| # | event | page | fires when | Pixel |
|---|-------|------|-----------|-------|
| 0 | `page_view` | all | any page loads (auto) | PageView |
| 1 | `pricing_viewed` | homepage | pricing section scrolls into view | — |
| 2 | `plan_selected` | homepage | a plan CTA is clicked (`plan`,`billing`,`value`,`cta_text`) | — |
| 3 | `lead_popup_opened` | homepage | the details popup opens | — |
| 4 | `lead_submitted` | homepage | valid details + consent captured (`route`) | Lead |
| 5 | `checkout_loaded` | checkout | branded checkout renders | InitiateCheckout |
| 6 | `payment_started` | checkout | pay button submitted (details valid) | AddPaymentInfo |
| 7 | `payment_success` | checkout | payment confirmed (server-verified in live) | — |
| 8 | `thankyou_viewed` | thank_you | thank-you page renders (`txn`) | — |
| 9 | `purchase_completed` | thank_you | revenue booked, once per txn (`transaction_id`,`value`) | Purchase |

Conversion variants at step 9 (not every deal is a "purchase"):
- **trial** → `trial_started` + Pixel **StartTrial**
- **enterprise** → `lead_qualified` + Pixel **Lead**

## Secondary events (enrich a step, no index)

| event | page | fires when / props |
|-------|------|--------------------|
| `field_started` | all forms | first focus on a field (`form`,`field`) — via `WBF.trackForm` |
| `field_completed` | all forms | field left with a value (`form`,`field`) |
| `field_abandoned` | all forms | field focused then left empty (`form`,`field`) |
| `field_error` | forms | validation blocked submit (`form`,`field`,`reason`) |
| `lead_popup_closed` | homepage | popup dismissed (`reason`: close_btn \| backdrop \| escape) |
| `billing_changed` | checkout | monthly⇄yearly toggled (`billing`,`value`) |
| `checkout_prefilled` | checkout | fields auto-filled from the lead popup |
| `card_iframe_loaded` | checkout | CardCom iframe finished loading (live) |
| `payment_failed` | checkout | declined / verification failed (`reason`,`code`) |
| `payment_error` | checkout | infra error creating the deal (`reason`) |
| `enter_system_clicked` | thank_you | CTA into whiteboard.education (`plan`) |
| `funnel_abandoned` | all | tab hidden / closed (`last_step`,`last_step_index`,`seconds_in_funnel`) |
| `section_viewed`, `scroll_depth`, `cta_clicked`, `faq_opened`, `pricing_toggle_changed`, `chat_opened`, `page_exit` | homepage | page-engagement telemetry |

## What "optimization-ready" gives you

- **Full funnel report**: count distinct `funnel_id` at each `step_index` → exact drop-off between every stage (e.g. how many who opened the popup actually submitted, paid, converted).
- **Per-plan / per-billing / per-source funnels**: every event carries `plan`, `billing`, and attribution — segment the funnel by any of them.
- **Form-level optimization**: `field_started/completed/abandoned` show precisely which field loses people.
- **Velocity**: `step_ms` reveals hesitation points.
- **Payment reliability**: `payment_started` vs `payment_success`/`payment_failed`/`payment_error` = your checkout success rate and failure reasons.
- **Ad platform**: standard Pixel events (PageView, InitiateCheckout, AddPaymentInfo, Lead, StartTrial, Purchase) with `eventID` ready for server-side CAPI dedupe.

## To go live

1. Set `META_PIXEL_ID` — pass it in each page's `window.WB_FUNNEL_CONFIG={page:'…',pixelId:'…'}` (new WHITEBOARD pixel, **not** the Bunker one). Clarity is already on (`xi43gegise`).
2. CardCom: implement the two backend endpoints the checkout expects, then flip `CARDCOM.mode` to `'live'` in `checkout.html`:
   - `POST /api/billing/create-lowprofile` → `{ iframe_url, lowprofile_id, txn_ref }`
   - `POST /api/billing/verify` → `{ paid, plan, billing, amount, txn_id }` (server confirms with CardCom — the source of truth)
   Set `CARDCOM.ORIGIN` to CardCom's iframe origin once known (enforces the postMessage source). Point CardCom's Success/Error URLs back to `checkout.html?lp_result=success|error&lowprofile=…&txn=…` for the redirect fallback.
3. (Optional) Set `LEADS_ENDPOINT` in `index.html` to POST the lead to the CRM at step 4, before payment.
