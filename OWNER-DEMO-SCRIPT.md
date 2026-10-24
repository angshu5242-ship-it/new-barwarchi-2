# New Bawarchi 2 — Owner Demo Script

A click-by-click script for showing the website to the restaurant owner.

- **Short demo:** 10–12 minutes
- **Full demo:** 20–25 minutes
- **Best order:** customer side → kitchen side → owner side → print menu
- **Golden rule:** show the customer journey first. The admin panel makes more sense after the owner has seen an order arrive.

At the end, the owner should remember six things:

1. Customers can order directly from the website.
2. Customer phone numbers are verified with an OTP.
3. The kitchen gets a live order screen and, after WhatsApp setup, WhatsApp alerts.
4. The owner can change dishes, prices, photos and restaurant details without a developer.
5. Every published change appears for every visitor because the content is stored online in Neon.
6. The printed QR menu sends customers back to the live menu.

---

## 0. Before the owner arrives

### Start the site

Open a terminal in the project folder and run:

```powershell
npm install
npm run dev
```

`npm install` is only needed the first time (or after dependencies change).

Open <http://localhost:5199>.

If you are using the temporary tunnel, use that link instead. The tunnel is only a preview link; the final site will use a proper domain.

### Check the services

Open:

```text
http://localhost:5199/api/orders?health=1
```

You want to see the database and OTP service as available. WhatsApp may show `false` until the Meta credentials and templates are added. That is expected for this demo.

### Open these tabs in advance

| Tab | URL | Purpose |
| --- | --- | --- |
| Website | `/` | Customer view |
| Menu | `/menu` | Food, filters and cart |
| Catering | `/catering` | Menu-based event estimator |
| Staff | `/staff` | Kitchen order screen |
| Admin | `/admin123` | Owner controls |
| Print menu | `/menu-print` | A4 menu and QR code |
| Tracking | created after the demo order | Public status page and reorder |

### Demo accounts

| Role | Where | Login |
| --- | --- | --- |
| Owner | `/admin123` | Your admin password from your private setup notes |
| Staff | `/staff` | The staff username and password you created |

**Do not put passwords in this file or in the GitHub repository.** Type them privately during the demo.

### Prepare the customer flow

- Use a test mobile number you control.
- If WhatsApp OTP is not connected yet, the code will appear in a blue **“Development mode only”** box on the checkout page. This is expected.
- If WhatsApp OTP is connected, use the owner’s phone so they can see the message arrive.
- Start with an empty cart.
- Create a clearly labelled test order, for example name **“Owner Demo”**.
- Choose a delivery area during checkout so the owner can see the server-calculated fee.
- Keep UPI **off** unless the owner has confirmed a real UPI ID. The current demo uses pay-at-pickup / pay-on-delivery.
- After the demo, mark that test order **Cancelled** or **Completed**. Do not delete real orders.

### Keep these closed

- `.env.local`
- The Neon dashboard
- The Meta WhatsApp dashboard
- GitHub settings
- Any screen showing customer phone numbers or private order history

### Do not click during the demo

- **Reset everything** in the admin panel
- **Remove** on a staff account
- **Delete** on a real dish, photo or order
- Any “Disconnect” or “Revoke” button in Neon or Meta

---

## 1. The opening — 30 seconds

Open the homepage.

> “This is the new New Bawarchi 2 website. It does three jobs: it brings customers in, it takes orders directly without a food-delivery app commission, and it gives your kitchen a live order screen. You can change the menu, photos, prices and restaurant details yourself from your phone.”

> “I’ll show you the customer side first, then the kitchen side, then the owner side. At the end I’ll be clear about what is working today and what still needs your WhatsApp Business approval.”

Then click **Explore the Puja menu**.

---

## 2. Customer side

### 2.1 Homepage — 1 minute

**Show:**

- The restaurant name and **4.3★** rating
- The live **Open now / Closed** badge
- Address, phone numbers and daily hours
- The Puja menu headline and hero photo
- Offer cards such as the combo meal
- Popular dishes
- The story and the customer review section
- The “Order online” and “Reserve a table” buttons

**Optional:** if the owner has not confirmed the review quotes yet, skip the review section during the demo. The quotes can be replaced with verified Google reviews before launch.

**Say:**

> “The first screen answers the customer’s first questions: what do you serve, where are you, are you open, what is the rating, and how do I order? They do not have to call the restaurant to ask.”

**Point out:**

> “The offer cards link straight to the relevant menu section, so a customer can go from an offer to the cart in two taps.”

---

### 2.2 Menu — 2 minutes

**Open:** `/menu`

**Show:**

- **9 menu sections** and **41 dishes** from the Bawarchi Puja Special flyer
- Exact flyer prices
- Search box
- Filters: **Everything, Veg, Non-veg, Popular, Spicy**
- Sort options: **Recommended, Price: low to high, Price: high to low, Name A–Z**

**Do this:**

1. Search for **“biryani”**.
2. Clear the search.
3. Tap **Veg** to show only vegetarian dishes.
4. Tap **Everything**.
5. Open **Chicken Dum Biriyani**.
6. Show the **Half / Full** portion choice.
7. Add the **Full** portion.
8. Add **Steam Momo — Full**.

**Say:**

> “This is not a PDF menu. Customers can search, filter and sort it. Every dish can be added to the cart, and dishes with two portion sizes show both prices.”

**Open the cart:**

> “The cart keeps the quantity and total. The customer can change quantity or remove an item before checkout.”

**Owner benefit:**

> “You do not need to reprint the menu every time a price changes. You change it once in the admin panel.”

---

### 2.3 Checkout and OTP — 3 minutes

**Open:** `/order`

**Show:**

- The basket summary
- **Step 1 — Verify your mobile**
- **Step 2 — Confirm your order**

**Do this:**

1. Enter the test mobile number.
2. Click **Send OTP on WhatsApp**.
3. If the blue **Development mode only** box appears, point to it and say: “Checkout verifies the customer’s mobile number with a 6-digit OTP. That reduces fake orders and gives the kitchen a number it can call. For today’s preview, the code appears on screen because WhatsApp is still in demo mode. In the live version, the same code arrives on the customer’s WhatsApp. The rest of the flow is identical.”
4. Enter the 6-digit code.
5. Click **Verify and continue**.
6. Show **Number verified**.
7. Enter name: **Owner Demo**.
8. Choose **Delivery** to show the address field.
9. Enter a demo address, for example: **Demo address, College Square, Belonia**.
10. Choose a delivery area, for example **College Square / Market**, and point to the fee.
11. Keep **As soon as possible** or choose **Schedule for later** and pick a time; choose a preparation time.
12. Add a note: **Less spicy**.
13. Tick the consent checkbox.
14. Click **Place order**.

**Say:**

> “The order is saved in the online database and appears on the kitchen screen. The delivery fee comes from the area you published in the admin panel, and the server recalculates it so a customer cannot edit it in the browser. No online payment is collected while UPI is off — payment is at pickup or on delivery.”

**Show:**

- The thank-you screen
- Order ID
- Order type and delivery area
- Scheduled or ASAP timing
- Total
- Item summary
- The loyalty card (provisional terms)
- **Track order live** link
- The call-the-kitchen button

**Owner benefit:**

> “Orders are recorded instead of getting lost in a WhatsApp chat. You have a proper order ID and a status for each order.”

**If OTP is not configured:**

> “The site also has a WhatsApp fallback. The basket and customer details open in WhatsApp so the order can still reach the kitchen. The online dashboard is the better experience, but the fallback means the restaurant is never blocked.”

---

### 2.4 Staff screen — 2.5 minutes

**Open:** `/staff`

**Show:**

- The separate **Staff sign in** screen
- Username and password fields

**Say:**

> “Staff do not use the owner’s admin password. They get their own login. They can see orders and update status, but they cannot change prices, photos or the website.”

**Do this:**

1. Sign in with the staff account.
2. Show the **New** count, **Active** count and **Completed today** count.
3. Show the new-order banner.
4. Click **Enable alerts** and allow notifications when the browser asks.
5. Open the demo order.

**Point out:**

- Customer name and phone
- Pickup or delivery
- Delivery address
- Kitchen notes
- Items and total
- **Phone verified** badge
- **Call customer** and **WhatsApp customer** buttons

**Say:**

> “The screen refreshes every 20 seconds. New orders show a banner, and browser notifications work while this screen stays open. After WhatsApp setup, the staff WhatsApp numbers also get an alert.”

**Change the status:**

1. **New**
2. **Confirmed**
3. **Preparing**
4. **Ready**
5. **Completed**

**Show the kitchen extras:**

- **Availability** tab: mark one dish sold out, then restore it. The public menu and checkout reject a sold-out dish.
- **Print KOT**: an 80 mm kitchen ticket with items, portions, notes, payment and customer contact.
- **Mark paid** after verifying a UPI payment (only appears when UPI is enabled).
- **Review request** on a completed order (only works when `GOOGLE_REVIEW_URL` and the review template are configured).
- The new-order chime and the optional browser notification.

**Show the filters:**

- Active
- New
- All
- Completed
- Cancelled

**Owner benefit:**

> “The kitchen knows what to cook, who to call and what stage every order is at. You do not need to shout across the counter or scroll through chats.”

---

### 2.5 Admin panel — 4 minutes

**Open:** `/admin123`

**Say:**

> “This is the owner side. It is designed so you do not need a developer for routine changes.”

#### Overview

Show the cards:

- Dishes
- Food photos
- Average price
- Gallery

Show **Quick actions**:

- Edit the menu
- Add gallery photos
- Change the hero photo
- Restaurant details

#### Orders

Open **Orders**.

**Say:**

> “Every website order appears here. You can see the customer, items, total, address and notes, and change the status. Staff can also do this from their own screen.”

Point out the warning if WhatsApp is not configured:

> “The order is saving, but the WhatsApp bot is not connected yet. That is the next setup step.”

#### Ordering & payment

Open **Ordering & payment**.

**Show:**

- Delivery zones, areas and fees
- Preparation-time choices
- Loyalty target and reward
- UPI ID, payee name and the UPI on/off switch

**Say:**

> “These are the rules the checkout uses. The server reads the saved zones and recalculates the delivery fee, so the browser cannot change it. The 5-stamp / ₹50 loyalty terms are provisional until you confirm them. UPI stays off until you give me a real UPI ID and approve the payee name.”

#### Analytics

Open the **Dashboard** and point to the analytics cards.

**Show:**

- Today’s orders and revenue
- Active orders
- Review requests pending
- Delivery vs pickup split
- Top-selling dishes
- Loyalty accounts and rewards

**Say:**

> “This gives you a simple daily picture without exporting anything. The numbers come from the same Neon orders the kitchen is using.”

#### Staff access

Open **Staff access**.

**Show:**

- Add staff: username, name, WhatsApp number, password
- Reset password
- Deactivate / Activate
- Remove
- Active / Inactive status
- “No WhatsApp alert” or the staff WhatsApp number

**Say:**

> “You can give each staff member their own login. If someone leaves, deactivate the account and their old session stops working. You can also add their WhatsApp number so they receive new-order alerts after the WhatsApp setup.”

#### Menu & photos

Open **Menu & photos**.

**Show:**

- Add a dish
- Add a section
- Edit dish name, price, description
- Vegetarian / non-vegetarian
- Popular / spicy badges
- Portion prices
- Dish photo upload
- Duplicate, delete or reorder

**Say:**

> “A price change takes a few seconds. You can also add a new Puja special or remove a dish that is finished.”

#### Menu style

Open **Menu style**.

**Show the five presets:**

- Bawarchi Classic
- Puja Marigold
- Fresh Mint
- Blush Rose
- Coastal Blue

**Say:**

> “These are ready-made light themes. You can pick one and apply it. You can also describe a mood to Gemini, for example ‘festive marigold and warm cream’, and it proposes a safe light colour theme.”

#### Gallery

Open **Gallery**.

**Show:**

- Upload, paste or drag photos
- Caption
- Category
- Move up / move down
- Delete

**Say:**

> “You can add new food or restaurant photos without calling anyone. The site compresses them before saving.”

#### Homepage

Open **Homepage**.

**Show:**

- Hero photos
- Active photo
- Caption
- “Use on homepage” control
- Move up / delete

**Say:**

> “You can change the first photo people see and its caption. The popular dishes row is controlled from the Menu tab by marking dishes as Popular.”

#### Restaurant details

Open **Restaurant details**.

**Show:**

- Restaurant name and tagline
- Menu edition title and subtitle
- Phone numbers and WhatsApp number
- Address
- Hours
- Rating and review count
- Serving since
- Announcement line
- Map and directions URLs
- Instagram and Facebook links

**Say:**

> “These details appear across the website, the print menu and the WhatsApp links. If a phone number or timing changes, you update it once.”

#### Publishing to Neon

Point to the status card:

- **Live on Neon**
- **Neon connected**
- **Publish to Neon**
- **Save locally**
- **Publishing…**

**Say:**

> “Neon is the online database. When you click **Save changes**, it publishes the menu, photos and details for every visitor. Open the site in a private window and the same content appears. That means your phone, the counter computer and every customer see the same thing.”

**If it says “Publish to Neon”:**

Click it once. This is the one-time publish of the current content.

**If it says “Save locally”:**

> “The online database is not connected right now. The changes are safe on this device, but they will not appear for visitors until the connection is back.”

#### Backup and reset

Show:

- **Export backup**
- **Import backup**
- **Reset everything**

**Say:**

> “Export backup downloads the menu, photos and settings as one file. You can import it on another phone or computer. **Reset everything** returns to the original content, so we do not touch it during a normal demo.”

**Optional proof of live sync:**

If you want to prove the online sync:

1. Change a harmless gallery caption to **Demo test**.
2. Click **Save changes**.
3. Open the gallery in a private window.
4. Show the changed caption.
5. Change it back.
6. Click **Save changes** again.

Do not do this with a price, a real photo or **Reset everything**.

---

### 2.6 Gallery, About and Contact — 2 minutes

#### Gallery

**Open:** `/gallery`

**Show:**

- Category filters
- Photo grid
- Click a photo to open the lightbox
- Previous / next controls
- Close button

**Say:**

> “Customers can browse the food and the restaurant before they visit.”

#### About

**Open:** `/about`

**Say:**

> “We corrected this page to use verified facts only: the College Square address, both phone numbers, the 4.3★ Google rating, opening hours and the dishes you actually serve. We removed the invented founder story, team details, awards and timeline.”

**Show:**

- The verified address
- Both phone numbers
- Hours
- Rating
- Menu highlights
- “Good to know” section
- Visit section

#### Contact

**Open:** `/contact`

**Show:**

- Call and WhatsApp cards
- Reservation form
- Contact form
- Google map
- Directions button
- FAQ

**Say:**

> “A reservation or message opens in WhatsApp with the details already filled in. There is no booking fee. A table is confirmed only after the restaurant replies.”

**Click Get directions:**

> “This opens the verified Google listing for New Bawarchi 2, not a random pin.”

---

### 2.7 Print menu and QR — 1.5 minutes

**Open:** `/menu-print`

**Show:**

- The A4 menu preview
- The category selector
- The QR code
- The **Print / Save PDF** button

**Say:**

> “This is the counter or table menu. The QR code opens the live menu, where the customer can start an order. You can print the full menu or just one section.”

**Print tip:**

> “Choose A4, set margins to None, and enable Background graphics for the full look.”

**Important caveat:**

> “If you are viewing this on localhost, the QR points to localhost and will not open on a phone. Use the tunnel or live domain for the phone scan. In production it will point to your real website.”

**Owner benefit:**

> “One printed menu can send customers to the live menu and online ordering.”

---

### 2.8 Footer ad and mobile view — 1 minute

Scroll to the footer.

**Show:**

> “Want a website like this for your business or restaurant?”
>
> WhatsApp **6009772116**

**Say:**

> “This is the business ad you asked for. It is for other restaurant or business owners who see the site. It can be removed or changed later.”

**Show the site on a phone** or in responsive mode.

**Say:**

> “The site is fully responsive. Most customers will open it on a phone, so the menu, cart and checkout are designed to work on a small screen.”

---

### 2.9 New customer and kitchen extras — 5 minutes

Use this section when the owner has time for the newer features.

#### Live tracking and reorder

Open the **Track order live** link from the thank-you screen.

**Show:**

- The order number, status and timeline
- The 15-second auto-refresh
- Items, totals and pickup/delivery details
- **Order again**

**Say:**

> “The customer can bookmark this page instead of calling to ask ‘where is my order?’ It shows the status but never exposes the phone number or delivery address. **Order again** adds the same items back to the basket and skips anything that is sold out.”

#### Catering calculator

Open `/catering`.

**Do this:**

1. Set guests to **50**.
2. Choose **Mixed**.
3. Show the estimated dish quantities and cost.
4. Point to the disclaimer.

**Say:**

> “This is a planning estimate based on the live menu prices, not a fixed package. It assumes one full biryani per two guests, one full gravy per three, one full momo plate per four, and 40% vegetarian guests for a mixed menu. The final quote still comes from the kitchen.”

#### Bangla switch

Use the **বাংলা** switch in the header.

**Show:**

- Home marketing copy
- Menu categories and menu chrome
- Order and OTP screens
- Tracking and catering
- Footer and open/closed badge

**Say:**

> “The customer-facing interface switches to Bangla. Dish names and descriptions stay in English because they are the menu content, not interface text.”

#### Installable app and offline shell

Do this on the **production build**, not the development server.

**Show:**

- The browser’s **Install app / Add to Home screen** option, if it appears
- The cached app shell after a reload with the network unavailable

**Say:**

> “On a supported phone the site can be installed like an app. The production build caches the shell so a weak connection does not show a blank page. Online ordering still needs the network and the Neon database.”

#### UPI, when the owner is ready

Open **Admin → Ordering & payment**.

**Say:**

> “UPI is deliberately off until you give me the exact UPI ID and confirm the payee name. When you do, I enable it here. The customer sees a QR and a UPI intent button, and staff mark the payment paid after checking it. Until then, every order uses pay at pickup or pay on delivery.”

#### Review request

Open a completed order in `/staff`.

**Say:**

> “After an order is completed, staff can send a review request. This stays paused until the exact Google review link and the WhatsApp review template are configured. The daily cron only asks customers who have not already been asked.”

---

## 3. Closing — 1 minute

Recap on your fingers:

1. **Direct orders** — no food-delivery app commission.
2. **Verified customers** — OTP login.
3. **Kitchen screen** — live orders and status updates.
4. **Owner control** — menu, photos, prices, staff and details.
5. **Online sync** — publish once, every visitor sees it.
6. **QR print menu** — connects printed menus to online ordering.

**Say:**

> “The website is ready for a customer demo. The remaining setup is your WhatsApp Business approval and the production domain. Once that is done, OTPs and order alerts go out automatically.”

**Ask:**

> “Which part would you use first — online orders, the QR menu, or the admin panel?”

**Then agree the next step:**

- Approve the menu and photos
- Start the WhatsApp Business verification
- Deploy to the production domain
- Add staff WhatsApp numbers
- Change the demo passwords
- Train the staff on the order screen
- Print the QR menu

---

## 4. Full feature checklist

Use this if the owner wants to see everything, or as a follow-up handout.

| # | Feature | Where | What to show |
| --- | --- | --- | --- |
| 1 | Branded homepage | `/` | Hero, Puja special, offers, popular dishes |
| 2 | Live open/closed badge | Header | Changes with the daily hours |
| 3 | Restaurant facts | Header / footer | 4.3★, address, both phones, hours |
| 4 | Full Puja menu | `/menu` | 9 sections, 41 dishes, exact prices |
| 5 | Search | `/menu` | Search by dish, description or section |
| 6 | Diet filters | `/menu` | Veg, non-veg, popular, spicy |
| 7 | Sorting | `/menu` | Price low/high, name A–Z |
| 8 | Dish quick view | `/menu` | Description, photo, portion choice |
| 9 | Cart | Header / `/order` | Quantity, remove, total |
| 10 | OTP login | `/order` | 6-digit code, resend timer, verified number |
| 11 | Pickup / delivery | `/order` | Address field and delivery note |
| 12 | Kitchen notes | `/order` | Spice level or delivery instructions |
| 13 | Order ID | `/order` | Confirmation screen |
| 14 | Order history | `/order` | Recent orders on the verified number |
| 15 | Online order storage | Neon | Order appears in staff and admin |
| 16 | Staff login | `/staff` | Separate username and password |
| 17 | Live order screen | `/staff` | New, active, completed counts |
| 18 | New-order alert | `/staff` | Banner and browser notification |
| 19 | Status workflow | `/staff` | New → Confirmed → Preparing → Ready → Completed |
| 20 | Customer contact | `/staff` | Call and WhatsApp buttons |
| 21 | Admin overview | `/admin123` | Dishes, photos, average price, gallery |
| 22 | Admin orders | `/admin123` | View and update every order |
| 23 | Staff access | `/admin123` | Add, reset, deactivate, remove |
| 24 | Menu editor | `/admin123` | Dishes, prices, sections, photos |
| 25 | Menu style | `/admin123` | Five presets plus Gemini theme |
| 26 | Gallery manager | `/admin123` | Upload, caption, category, reorder |
| 27 | Homepage manager | `/admin123` | Hero photos, captions and active photo |
| 28 | Restaurant details | `/admin123` | Phones, address, hours, rating, directions |
| 29 | Publish to Neon | `/admin123` | Live content for every visitor |
| 30 | Export / import | `/admin123` | JSON backup and restore |
| 31 | Gallery page | `/gallery` | Filters and lightbox |
| 32 | Verified About page | `/about` | No invented founder, awards or timeline |
| 33 | Reservations | `/contact` | Pre-filled WhatsApp request |
| 34 | Contact form | `/contact` | Pre-filled WhatsApp message |
| 35 | Map and directions | `/contact` | Verified Google listing |
| 36 | FAQ | `/contact` | Delivery, hours, payment, reservations |
| 37 | Printable menu | `/menu-print` | 2 A4 pages, category filter, QR |
| 38 | Business ad | Footer | WhatsApp 6009772116 |
| 39 | Mobile layout | Whole site | Phone-friendly menu, cart and checkout |
| 40 | Light theme | Whole site | Clean, readable, no dark mode |
| 41 | Upselling | Cart | “Complete your meal” suggestions |
| 42 | Sold-out toggle | `/staff` | Hide a dish instantly; checkout rejects it |
| 43 | Delivery zones and fees | `/order` + admin | Area fee recalculated on the server |
| 44 | Scheduled orders | `/order` | ASAP or a slot up to 7 days ahead |
| 45 | Prep-time choice | `/order` | 10 / 20 / 30 / 45 minutes |
| 46 | Loyalty card | `/order` + admin | Provisional 5 stamps → ₹50 |
| 47 | UPI intent and QR | `/order` + admin | Off until the owner confirms a real UPI ID |
| 48 | Public tracking | `/track/:orderId` | Status, items and timing; no contact data |
| 49 | Reorder | `/track/:orderId` | Adds available items back to the basket |
| 50 | Kitchen chime | `/staff` | Sound and browser notification for new orders |
| 51 | 80 mm KOT | `/staff` | Compact kitchen ticket for a thermal printer |
| 52 | Review booster | `/staff` + cron | WhatsApp review request after completion |
| 53 | Catering calculator | `/catering` | Quantities and estimate from live menu prices |
| 54 | Bangla interface | Header | Customer-facing EN / বাংলা switch |
| 55 | PWA and offline shell | Production build | Installable app and cached shell |
| 56 | Analytics | `/admin123` | Orders, revenue, top dishes and loyalty |
| 57 | Ordering settings | `/admin123` | Zones, prep times, loyalty and UPI |
| 58 | Server-side validation | APIs | Fees, totals, sold-out and OTP checks |

---

## 5. Owner questions — short answers

**“Do I need to keep my phone open for orders?”**

> “The staff screen works while it is open. After WhatsApp setup, staff also get a WhatsApp alert on their phone. For a busy kitchen, keep the staff screen open on a tablet or counter computer.”

**“Can I change prices myself?”**

> “Yes. Admin → Menu & photos. Change the price, click Save changes, and every visitor sees it on their next page load.”

**“Will customers need to download an app?”**

> “No. It works in the browser on any phone.”

**“What if WhatsApp is down or not set up?”**

> “The website still saves the order, and the customer can send the basket to the restaurant on WhatsApp. The dashboard is the better experience, but the fallback keeps orders moving.”

**“Do you take a commission on orders?”**

> “No commission to a food-delivery app. The running costs are the website hosting, domain and WhatsApp message charges, depending on usage.”

**“Can staff see the admin panel?”**

> “No. Staff have a separate login. They can see orders and update status, but they cannot change prices, photos or the website.”

**“Can I remove a staff member?”**

> “Yes. Deactivate or remove them in Admin → Staff access. Their old session stops working.”

**“Is the 4.3★ rating real?”**

> “It is the rating shown on your Google listing. The About page does not invent a founder story, team or awards. The review quotes on Home should still be confirmed against your real Google reviews before launch.”

**“Can I print the menu?”**

> “Yes. `/menu-print` gives you a 2-page A4 menu with a QR code. You can print it or save it as a PDF.”

**“Can I use my own domain?”**

> “Yes. The site is ready for a production deployment and a custom domain.”

**“What about online payment?”**

> “Not included right now. Customers pay at pickup or on delivery. Online payment can be added later if you want it.”

**“Can I add more dishes or sections?”**

> “Yes. Admin → Menu & photos has Add a dish and Add a section.”

**“Can I change the offer cards?”**

> “The menu, prices, photos and restaurant details are self-service. The promotional offer cards are part of the page design, so send the new offer and it can be updated for you. We can make offers editable in a future version.”

**“Can I change the big homepage headline?”**

> “The hero photo and caption are editable in Admin → Homepage. The large headline text is part of the page design; if you want a new headline, it can be changed for you.”

**“Can I change the menu colours?”**

> “Yes. Admin → Menu style. Pick one of the five light presets or describe a theme to Gemini.”

**“What happens if I make a mistake?”**

> “Export a backup before big changes. You can also import a previous backup. Reset everything returns to the original content, so use it carefully.”

**“Why does the OTP show on screen today?”**

> “Because WhatsApp is in demo mode until the Meta templates are approved. Production never shows the code on screen; it arrives on the customer’s WhatsApp.”

**“Is the website live for customers now?”**

> “The site is ready and can be previewed. The final public launch needs the production deployment, domain and WhatsApp approval.”

---

## 6. If something goes wrong

| Problem | What to do |
| --- | --- |
| Site will not open | Check that `npm run dev` is still running; open <http://localhost:5199> |
| Orders do not load | Open `/api/orders?health=1`; check the database connection |
| OTP code does not appear | Check that the local OTP demo mode is enabled; or use **Order on WhatsApp instead** |
| Staff login fails | Open Admin → Staff access; reset the staff password; try again |
| New order does not appear immediately | Wait 20 seconds or click **Refresh** on the staff screen |
| Browser notification does not appear | Click **Enable alerts** and allow notifications in the browser |
| “Save locally” appears | Neon is not connected; the content is saved only on this device |
| “Publish to Neon” appears | Click it once to publish the current content online |
| Tunnel link stops working | Use localhost for the demo; restart the tunnel later |
| QR code opens localhost on a phone | Use the tunnel or live domain; localhost QR only works on the same computer |
| A real order is visible | Do not read out customer phone numbers; use your demo order |

---

## 7. What is ready vs. what needs setup

### Ready now

- Full restaurant website and Puja menu
- Search, filters, sorting and cart
- OTP checkout flow (demo mode until WhatsApp is connected)
- Online order storage in Neon
- Staff login and live order dashboard
- Admin orders, staff, menu, photos, gallery, homepage and details
- Publish to Neon for every visitor
- Export / import backup
- Gallery and lightbox
- Verified About page
- Contact, reservations and directions
- Printable A4 menu with QR
- Business ad in the footer
- Mobile layout and light theme
- Upselling suggestions and sold-out controls
- Delivery zones, server-calculated fees, scheduling and prep-time choice
- Loyalty card (provisional terms)
- Public order tracking and reorder
- Kitchen chime, 80 mm KOT and payment marking
- Review booster code and daily cron
- Menu-based catering calculator
- Bangla customer interface
- Production PWA shell and offline recovery
- Admin analytics and ordering settings

### Needs setup before public launch

- Meta WhatsApp Business verification
- WhatsApp phone number ID and token
- Approved OTP template
- Approved `new_order_alert` template
- Staff WhatsApp numbers
- Production deployment on Vercel
- Custom domain (optional but recommended)
- Change the demo admin and staff passwords
- Rotate the secrets in `.env.local`
- Final content and photo approval from the owner
- Confirm or replace the Home review quotes
- Owner-confirmed UPI ID and payee name (UPI stays off until then)
- Final loyalty target and reward terms
- Final catering package prices, if packages will be sold
- Exact `GOOGLE_REVIEW_URL` and, if used, the approved review template
- Set `CRON_SECRET` and the Vercel Cron schedule for the review booster

---

## 8. After the demo

- [ ] Mark the demo order **Cancelled** or **Completed**.
- [ ] Clear the cart.
- [ ] Log out of staff and admin.
- [ ] If you changed content for a sync test, change it back and save again.
- [ ] Do not delete real orders or real customer data.
- [ ] Note the owner’s feedback and any menu corrections.
- [ ] Ask the owner to confirm the Home review quotes are real Google reviews; replace them if not.
- [ ] Ask for the exact UPI ID and payee name; keep UPI disabled until then.
- [ ] Confirm the loyalty target and reward, or leave the provisional 5-stamp / ₹50 terms clearly marked.
- [ ] Confirm whether catering is sold as packages or only as a menu-based estimate.
- [ ] Ask for the exact Google review link and whether the review template is approved.
- [ ] Agree who will complete the WhatsApp Business verification.
- [ ] Agree the production domain and launch date.
- [ ] Change the demo passwords before giving anyone else access.

---

## 9. Five-minute version

If the owner is busy, show only this:

1. **Home** — “This is the new site: menu, rating, address, hours, order buttons.”
2. **Menu** — search “biryani”, add a dish to the cart.
3. **Order** — verify the test number, place a pickup order, show the **Track order live** link.
4. **Staff** — show the order, change it to **Preparing**, show **Print KOT**.
5. **Admin** — show **Ordering & payment**, then **Menu & photos**, change nothing, point to **Save changes / Live on Neon**.
6. **Catering** — set 50 guests and show the estimate disclaimer.
7. **Print** — show the A4 QR menu.

Close with:

> “The customer can order directly, the kitchen sees it, and you control the menu. The next step is WhatsApp approval and the public domain.”

---

## 10. One-page cheat sheet

```text
START:  http://localhost:5199
CATERING: http://localhost:5199/catering
STAFF:  http://localhost:5199/staff
ADMIN:  http://localhost:5199/admin123
PRINT:  http://localhost:5199/menu-print
HEALTH: http://localhost:5199/api/orders?health=1

DEMO FLOW
Home → Menu → add Chicken Dum Biriyani (Full) + Steam Momo (Full)
→ Order → test phone → OTP → name “Owner Demo” → Delivery
→ demo address → delivery area → ASAP/prep time → note “Less spicy”
→ Place order → show loyalty card + Track order live
→ Track → timeline → Order again
→ Staff → show order → New → Confirmed → Preparing
→ Staff → Availability (sold out/restore) → Print KOT
→ Admin → Ordering & payment → Dashboard analytics
→ Admin → Menu & photos → Save changes / Live on Neon
→ Catering → 50 guests, mixed → estimate
→ Print menu → QR → footer business ad → বাংলা switch

REMEMBER
- Show customer side first.
- Do not promise live WhatsApp today.
- UPI stays off until the owner confirms a real UPI ID.
- Do not click Reset everything.
- Do not show .env.local or customer phone numbers.
- Mark the demo order Cancelled/Completed after.
```
