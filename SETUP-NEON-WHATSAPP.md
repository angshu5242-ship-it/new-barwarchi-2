# Connect Neon + WhatsApp order alerts

The website can run in two modes:

1. **WhatsApp fallback (works right now, no keys needed)** — the customer fills in their name, mobile number and address, then WhatsApp opens with the complete order ready to send.
2. **Online ordering (after the steps below)** — the order is saved in Neon, appears in **Admin → Orders**, and a WhatsApp bot alerts the restaurant automatically.

## 1. Create the Neon database

1. Go to https://console.neon.tech and sign in.
2. Create a project (for example `new-bawarchi-2`). Choose the region closest to India (Singapore is usually best).
3. In the project dashboard, copy the **pooled** connection string. It looks like:
   `postgresql://user:password@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
4. Do **not** paste the connection string into chat or commit it. Put it in `.env.local`:

```bash
DATABASE_URL=postgresql://...
```

5. Restart `npm run dev`. Open `http://localhost:5199/api/orders?health=1`. You should see:

```json
{"ok":true,"service":{"database":true,"whatsapp":false,"otp":true,"otpDevMode":true}}
```

`otpDevMode` is only true locally. It is always false on Vercel unless you explicitly set `OTP_DEV_MODE=true`, which you should never do in production.

The tables are created automatically. You can also run `db/schema.sql` in the Neon SQL editor.

## 2. Add the same variable to Vercel

1. Open the Vercel project for this site.
2. Go to **Settings → Environment Variables**.
3. Add `DATABASE_URL` for Production, Preview and Development.
4. Redeploy.

## 3. Admin content is published to Neon

The admin panel no longer keeps menu and photo changes only in one browser. When you click
**Save changes**, the menu, gallery, homepage photos and restaurant details are sent to the
`site_settings` table in Neon under the `siteContent` key. Every visitor then loads that same
copy. The browser cache is only a fallback.

To check it:

1. Open `/admin123`.
2. If the top button says **Publish to Neon**, click it once. This publishes content that was
   previously saved only in the browser. Otherwise change a price or a restaurant detail and
   click **Save changes**.
3. The sidebar should say **Live on Neon**.
4. Open the website in a private window or on another phone. The change should be there.

If the sidebar says **Neon not connected**, add `DATABASE_URL` and restart. A very large gallery
can reach the request-size limit; use image URLs or remove a few uploaded photos.

## 4. Menu style studio (Gemini)

The admin has a new **Menu style** tab at `/admin123`. It includes five light, ready-made
themes and a Gemini-powered designer where you can describe a mood in plain English.

1. Get an API key from https://aistudio.google.com/apikey.
2. Add it to `.env.local` (never put it in the browser or commit it):

```bash
GEMINI_API_KEY=your-google-ai-studio-key
GEMINI_MODEL=gemini-2.5-flash
```

3. To publish the same style for every visitor, add `GEMINI_API_KEY` and `GEMINI_MODEL` to
   Vercel's environment variables as well. The style is stored in the Neon `site_settings`
   table, which is created automatically.
4. Restart the dev server, open **Admin → Menu style**, generate or pick a theme, then click
   **Apply this theme**.

If `DATABASE_URL` is missing, the theme still works but only in the browser where it was
applied. If `GEMINI_API_KEY` is missing, the ready-made themes still work and the Gemini
button shows a configuration message.

## 5. WhatsApp Cloud API (so the restaurant gets a bot message)



This is the official Meta API. You need a Meta business account and a WhatsApp Business phone number.

1. Create an app at https://developers.facebook.com/apps (type: Business).
2. Add the **WhatsApp** product. Meta gives you a test phone number ID and a temporary token.
3. Add these Vercel / `.env.local` variables:
   - `WHATSAPP_TOKEN` — permanent system-user token
   - `WHATSAPP_PHONE_NUMBER_ID` — the sender phone number ID
   - `WHATSAPP_ORDER_TO` — restaurant WhatsApp number(s), digits only, e.g. `919366986853,919612281939`
4. Restart. The health endpoint should now show `"whatsapp":true`.
5. Place a test order.

### Important: 24-hour messaging window

Meta only allows free-form text messages to a number that has messaged the business in the last 24 hours. For reliable order alerts, create a **Utility template**:

- Name: `new_order_alert`
- Language: `en`
- Category: Utility
- Body (7 parameters, in this order):

```text
New order {{1}} from {{2}} ({{3}}).
{{4}}
Items: {{5}}
Total: {{6}}
Notes: {{7}}
```

Once approved, add:

```bash
WHATSAPP_TEMPLATE_NAME=new_order_alert
WHATSAPP_TEMPLATE_LANG=en
```

The API automatically uses the template for the restaurant alert. The same template is sent to every active staff member who has a WhatsApp number. If the template is not set, it tries a normal text message.

## 6. OTP mobile login (how it works)

The checkout now verifies the customer's mobile number before showing the order form:

1. Customer enters a 10-digit mobile number and taps **Send OTP on WhatsApp**.
2. `POST /api/auth?action=request` generates a random 6-digit code.
3. Only a hash of the code is stored in the Neon `otp_codes` table, with a 5-minute expiry, 5 attempt limit and a 30-second resend cooldown.
4. The code is sent through the WhatsApp Cloud API using an approved OTP template.
5. The customer enters the code. `POST /api/auth?action=verify` checks it and returns a signed 24-hour session token.
6. The token is stored in `sessionStorage`. The order is submitted with the token and saved with `phone_verified = true`.

### Create the OTP template

1. Open **WhatsApp Manager → Account tools → Message templates → Create template**.
2. Name: `login_otp` · Language: English · Category: **Utility** (or Authentication if your account offers it).
3. Body:

   ```text
   {{1}} is your New Bawarchi 2 verification code. It expires in 5 minutes. Do not share it with anyone.
   ```

4. Add a sample value of `123456`. Leave buttons off. Submit it for approval.
5. After approval, add these variables locally and in Vercel:

   ```bash
   WHATSAPP_OTP_TEMPLATE_NAME=login_otp
   WHATSAPP_OTP_TEMPLATE_LANG=en
   OTP_SECRET=<long random string>
   AUTH_SECRET=<another long random string>
   ```

   Generate secrets with `openssl rand -hex 32` or any password manager.

If the template has a URL button that includes the code, also set `WHATSAPP_OTP_TEMPLATE_URL_BUTTON=true`.

### Testing locally without a template

In local development the API automatically uses **OTP development mode**: the code is printed in the server terminal and shown in a blue "Development mode only" box on the checkout page. No WhatsApp template is needed for local testing.

- To force it on: `OTP_DEV_MODE=true`
- To force it off: `OTP_DEV_MODE=false`
- Never set `OTP_DEV_MODE=true` on Vercel. Production must use the approved WhatsApp template.

### Require OTP for every online order

Once login is working, set:

```bash
REQUIRE_PHONE_VERIFICATION=true
```

The order API will then reject any online order that does not include a valid OTP session token. Until then, orders from the fallback path are still accepted so the restaurant does not lose business while WhatsApp OTP is being approved.

### If you do not want to use WhatsApp for OTP

The OTP sender lives in `server/auth.js` (`sendOtpOnWhatsApp`). You can replace that function with an SMS provider such as Twilio, MSG91 or Fast2SMS. The database storage, hashing, expiry, attempt limits and session tokens stay the same.

## 7. Staff login and order alerts

Staff do not use the owner's admin password. They get their own username and password and open
`/staff` on a phone or kitchen tablet.

### First staff account

The first account is created automatically when the staff screen is opened, using these
variables in `.env.local` and Vercel:

```bash
STAFF_SEED_USERNAME=staff
STAFF_SEED_PASSWORD=choose-a-strong-staff-password
STAFF_SEED_DISPLAY_NAME=Kitchen Staff
```

Sign in at `/staff` with those details, then change the password in **Admin → Staff access**.
The seed only runs when the staff table is empty; changing the variables later does not reset
existing passwords.

### Adding the rest of the team

1. Open **Admin → Staff access**.
2. Enter a username, name, WhatsApp number and a password of at least 8 characters.
3. Share the `/staff` link and their personal login.
4. Use **Edit** to change the alert number, **Reset password** to set a new password, or
   **Deactivate** to block sign-in without deleting history.

The WhatsApp number is optional. Staff without a number can still use the live order screen.
Every active number receives the same `new_order_alert` template as the restaurant.

### How staff notifications work

- **WhatsApp:** when an order is created, the server sends the order template to
  `WHATSAPP_ORDER_TO` plus every active staff number. This works when the staff screen is closed.
  It needs the Cloud API keys and an approved template.
- **Live screen:** `/staff` refreshes every 20 seconds, highlights new orders, shows a counter in
  the browser tab and can send a browser notification while the page is open. Click **Enable
  alerts** once on each device to allow browser notifications.
- **No duplicate numbers:** staff numbers that match a restaurant alert number are only sent once.
- To keep alerts owner-only, set `WHATSAPP_NOTIFY_STAFF=false`.

Staff can also call or WhatsApp the customer, and move the order through the same statuses as the
admin. Deactivating a staff member stops their WhatsApp alerts and blocks new sign-ins.

## 8. Admin orders

- Open `/admin123` and sign in with the admin password.
- Click **Orders**.
- New orders show the customer name, mobile number, pickup/delivery address, items, notes and total.
- Change the status to Confirmed → Preparing → Ready → Out for delivery → Completed.
- The `x-admin-password` header uses `ADMIN_PASSWORD` (default `nb2admin2024`). Keep the server variable and the admin login password in sync.

## 9. Test checklist

- [ ] `/api/orders?health=1` shows `database:true` and `otp:true`
- [ ] **Send OTP on WhatsApp** returns success; the code arrives on the customer's number
- [ ] Wrong OTP is rejected and the attempt limit works
- [ ] Verified number shows **Number verified** at `/order`
- [ ] Place an order at `/order`
- [ ] Admin → Menu & photos change appears on the website in a private window after **Save changes**
- [ ] Admin → Restaurant details change appears in a private window after **Save changes**
- [ ] The admin badge says **Saved** and the sidebar says **Live on Neon**
- [ ] Order appears in Admin → Orders with `phoneVerified` shown in the API response
- [ ] WhatsApp order alert arrives at `WHATSAPP_ORDER_TO` (or the fallback link appears)
- [ ] A staff account signs in at `/staff` and sees the order
- [ ] A staff WhatsApp number receives the `new_order_alert` template
- [ ] Staff can change an order status and the admin Orders tab shows the same status
- [ ] Customer profile is pre-filled on the next visit in the same browser tab
- [ ] `REQUIRE_PHONE_VERIFICATION=true` blocks unverified API orders
- [ ] Vercel deployment uses the same environment variables and `OTP_DEV_MODE` is **not** set
