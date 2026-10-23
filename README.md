# New Bawarchi 2

The website for **New Bawarchi 2**, College Square, Belonia, Tripura 799155.

It includes the Bawarchi Puja Special menu, online ordering with WhatsApp OTP login, a live
staff order screen, WhatsApp order alerts, a printable A4 QR menu, and an admin panel for the
menu, food photos, restaurant details, staff accounts and the live site content.

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
| `/order` | OTP-verified pickup / delivery checkout |
| `/staff` | Staff sign-in and live order screen |
| `/admin123` | Owner admin: menu, photos, orders, staff, menu style |
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

See [SETUP-NEON-WHATSAPP.md](SETUP-NEON-WHATSAPP.md) for the full Neon, WhatsApp, OTP, staff and
deployment walkthrough.

## Staff notifications

- **WhatsApp:** new orders are sent to `WHATSAPP_ORDER_TO` and every active staff account with a
  WhatsApp number. This requires the Cloud API keys and an approved `new_order_alert` template.
- **Live screen:** `/staff` polls every 20 seconds, shows a new-order banner and can send browser
  notifications while the page is open.
- Staff accounts are stored in Neon. Deactivating an account blocks sign-in and removes it from
  future WhatsApp alerts.
- Staff tokens last 12 hours. Order APIs re-check that the account is still active.

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

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel. The Vite preset is detected automatically.
3. Add the environment variables above in **Settings → Environment Variables** for Production,
   Preview and Development.
4. Deploy. `vercel.json` provides the SPA fallback for `/staff`, `/menu-print`, `/order` and
   `/admin123` while leaving `/api/*` functions untouched.
5. Never set `OTP_DEV_MODE=true` on Vercel.

Before making the site public, rotate the Neon password, Gemini API key, `OTP_SECRET` and
`AUTH_SECRET`, and change the admin and staff passwords.

## Photo credits

Food photography is loaded from [Unsplash](https://unsplash.com). Replace the URLs in
`src/data/images.js` with the restaurant's own photos when available.
