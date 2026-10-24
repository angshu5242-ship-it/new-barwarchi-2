# New Bawarchi 2

The website for **New Bawarchi 2**, College Square, Belonia, Tripura 799155.

It includes the Bawarchi Puja Special menu, online ordering with WhatsApp OTP login, a live
staff order screen, WhatsApp order alerts, a printable A4 QR menu, public order tracking,
a menu-based catering estimator, an English/Bangla customer interface, and an admin panel for
the menu, food photos, restaurant details, staff accounts, delivery zones, loyalty and the live
site content.

## Tech stack

- React 19 + Vite + React Router
- Tailwind CSS
- Neon serverless Postgres
- Vercel serverless functions in `api/` (local Vite middleware in development)
- WhatsApp Cloud API for OTP delivery and order alerts
- Google Gemini for the menu-style designer

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open <http://localhost:5199>.

The first staff account is seeded when `STAFF_SEED_USERNAME` and `STAFF_SEED_PASSWORD` are set
in `.env.local`. Set a strong password before the first run, then change it after the first
sign-in. If the seed variables are omitted, add staff from **Admin → Staff access**.

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Home |
| `/menu` | Full menu and cart |
| `/order` | OTP-verified pickup / delivery checkout, scheduling, loyalty and UPI |
| `/track/:orderId` | Public order tracking with 15-second updates |
| `/catering` | Menu-based catering quantity and cost estimator |
| `/staff` | Staff sign-in, live orders, sold-out toggles, payment and KOT printing |
| `/admin123` | Owner admin: menu, photos, orders, analytics, ordering settings, staff, menu style |
| `/menu-print` | Printable A4 menu with QR code |

The admin password is configured by `ADMIN_PASSWORD` for the server APIs. The browser admin
screen uses the password in `src/pages/Admin.jsx`; keep the two values the same and change both
before a public launch.

## Environment variables

Copy `.env.example` to `.env.local`. The important values are:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string |
| `ADMIN_PASSWORD` | Password for order and site admin APIs |
| `OTP_SECRET` | Secret used to hash OTP codes |
| `AUTH_SECRET` | Secret used to sign customer and staff sessions |
| `OTP_DEV_MODE` | Local only: shows the OTP on screen. Never enable on Vercel |
| `REQUIRE_PHONE_VERIFICATION` | Set `true` once live OTP delivery works |
| `GEMINI_API_KEY` | Optional; enables the Gemini menu-style designer |
| `WHATSAPP_TOKEN` | Meta WhatsApp Cloud API token |
| `WHATSAPP_PHONE_NUMBER_ID` | Meta sender phone number ID |
| `WHATSAPP_ORDER_TO` | Restaurant alert numbers, digits only, comma separated |
| `WHATSAPP_TEMPLATE_NAME` | Approved new-order template (recommended: `new_order_alert`) |
| `WHATSAPP_OTP_TEMPLATE_NAME` | Approved OTP template |
| `STAFF_SEED_USERNAME` | First staff username |
| `STAFF_SEED_PASSWORD` | First staff password |
| `STAFF_SEED_DISPLAY_NAME` | First staff display name |
| `STAFF_SEED_PHONE` | Optional first staff WhatsApp number |
| `WHATSAPP_NOTIFY_STAFF` | `true` to alert active staff numbers as well as the restaurant |
| `UPI_ID` / `UPI_NAME` | Optional UPI payee; leave blank to keep UPI disabled |
| `GOOGLE_REVIEW_URL` | Exact owner-supplied Google review link; review requests stay paused when blank |
| `WHATSAPP_REVIEW_TEMPLATE_NAME` | Optional approved review template (name + review URL body params) |
| `REVIEW_DELAY_HOURS` | Hours after completion before the review cron asks (default 2) |
| `CRON_SECRET` | Protects `/api/review-cron`; Vercel Cron sends it automatically |

See [SETUP-NEON-WHATSAPP.md](SETUP-NEON-WHATSAPP.md) for the full Neon, WhatsApp, OTP, staff and
deployment walkthrough.

For a click-by-click script to demonstrate the site to the restaurant owner, see
[OWNER-DEMO-SCRIPT.md](OWNER-DEMO-SCRIPT.md).

## Staff notifications

- **WhatsApp:** new orders are sent to `WHATSAPP_ORDER_TO` and every active staff account with a
  WhatsApp number. This requires the Cloud API keys and an approved `new_order_alert` template.
- **Live screen:** `/staff` polls every 20 seconds, shows a new-order banner and can send browser
  notifications while the page is open.
- Staff accounts are stored in Neon. Deactivating an account blocks sign-in and removes it from
  future WhatsApp alerts.
- Staff tokens last 12 hours. Order APIs re-check that the account is still active.

## Ordering features

- **Sold-out items:** staff toggle dishes in `/staff`; the public menu and checkout reject them immediately.
- **Delivery areas and fees:** publish areas and fees in **Admin → Ordering & payment**. The server recalculates the fee from that saved list; browser values are never trusted.
- **Scheduled orders and prep time:** customers choose an ASAP or scheduled slot (8 AM–10 PM, up to 7 days ahead) and a preparation time.
- **Loyalty card:** one stamp per completed online order. The current 5-stamp / ₹50 terms are provisional and must be confirmed by the owner in the admin tab.
- **UPI:** the QR and intent link appear only when a valid UPI ID is enabled. Staff mark the payment paid after verifying it.
- **Tracking:** `/track/:orderId` exposes status, items, totals and timing but no customer contact details. It polls every 15 seconds.
- **Kitchen tools:** `/staff` plays a new-order chime, can request browser notifications, prints an 80 mm KOT, and opens a pre-filled customer review message.
- **Review booster:** `api/review-cron` runs daily at 21:00 IST. It stays paused until `GOOGLE_REVIEW_URL` and WhatsApp credentials/templates are configured.
- **Catering estimator:** `/catering` estimates quantities and cost from the live menu, with a clear “planning estimate, final quote from the kitchen” disclaimer.
- **Bangla interface:** the header switch translates customer-facing Home, Menu chrome, Order, Tracking, Catering, Footer and open/closed status. Dish names and descriptions remain English menu content.
- **Analytics:** the admin dashboard shows today’s orders and revenue, active orders, pending review requests, delivery/pickup split, top dishes and loyalty totals.
- **PWA:** production builds register `/sw.js`, cache the app shell and assets, and fall back to the cached shell or `/offline.html` when the network is unavailable. The install prompt appears only in a supported browser and a secure context.
- **UPI safety:** UPI is off by default. Do not enable it until the owner supplies the exact UPI ID and confirms the payee name.

## Admin content and Neon

Changes made in **Admin → Menu & photos**, **Gallery**, **Homepage** and **Restaurant details**
are published to the Neon `site_settings` table under the `siteContent` key. Every visitor loads
that same copy, so editing from one phone or computer updates the live website for everyone.

The browser keeps a local cache for faster loading and offline recovery, but Neon is the source
of truth once content has been published. If `DATABASE_URL` is missing, the admin can still save
locally and the screen warns that the changes are not online.

If you already had menu or photo changes saved in the old browser-only version, open
`/admin123` and click **Publish to Neon** once. That sends the current content to the live site
without needing to edit anything first.

Uploaded photos are compressed in the browser. The site content request has a safety limit of
about 3.5 MB; if a very large gallery reaches that limit, use image URLs or remove a few uploads.

## Owner confirmations before launch

The code is ready, but these business facts must come from the owner. Do not invent them:

- **UPI:** exact UPI ID and payee name. Keep `UPI_ID` blank and the admin UPI switch off until then.
- **Loyalty:** final stamp target and reward. The current 5-stamp / ₹50 terms are provisional.
- **Catering:** whether packages are sold at fixed prices. The calculator is an estimate from menu prices, not a package quote.
- **Home review quotes:** confirm they are real Google reviews, or replace them.
- **Google review link:** set `GOOGLE_REVIEW_URL` to the exact owner-supplied link. The review booster stays paused without it.
- **Delivery zones:** confirm the areas and fees in **Admin → Ordering & payment**.

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel. The Vite preset is detected automatically.
3. Add the environment variables above in **Settings → Environment Variables** for Production,
   Preview and Development. Add `GOOGLE_REVIEW_URL`, `CRON_SECRET` and the review template only
   after the owner supplies and approves them.
4. Deploy. `vercel.json` provides the SPA fallback for `/staff`, `/menu-print`, `/order`,
   `/track/*`, `/catering` and `/admin123` while leaving `/api/*` functions untouched.
5. Confirm the Vercel Cron entry for `/api/review-cron` is present and protected by `CRON_SECRET`.
6. Never set `OTP_DEV_MODE=true` on Vercel.

Before making the site public, rotate the Neon password, Gemini API key, `OTP_SECRET` and
`AUTH_SECRET`, and change the admin and staff passwords.

## Photo credits

Food photography is loaded from [Unsplash](https://unsplash.com). Replace the URLs in
`src/data/images.js` with the restaurant's own photos when available.
