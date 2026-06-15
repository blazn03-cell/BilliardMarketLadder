# Stripe Setup — Step by Step
## Pool Market Ladder Share Purchases

---

## What you're building

4 Stripe Payment Links — one per share price tier.

Each "Buy" button on the website links to the right one. Stripe collects the money, sends receipts automatically, and deposits to your bank. You just paste the 4 URLs into `index.html`.

**No coding. No backend. Total time: ~20 minutes.**

---

## Step 1 — Create a free Stripe account

1. Go to **stripe.com** → click **Start now**
2. Enter your email, create a password
3. Verify your email
4. Fill in your business info (can be personal/sole proprietor)
5. Add your bank account so payouts deposit automatically

---

## Step 2 — Create the 4 products

Go to **Stripe Dashboard → Products → Add product**

Create these 4 products one at a time:

| Product Name              | Price  | Description                        |
|---------------------------|--------|------------------------------------|
| Pool Share — Unranked     | $25.00 | 1 share in an unranked player      |
| Pool Share — Top 5-8      | $35.00 | 1 share in a Top 5-8 ranked player |
| Pool Share — Top 3-4      | $75.00 | 1 share in a Top 3-4 ranked player |
| Pool Share — Top 2        | $150.00| 1 share in a Top 2 ranked player   |

**For each product:**
- Click **Add product**
- Name it (e.g. "Pool Share — Unranked")
- Set the price
- Choose **One time** payment
- Click **Save product**

---

## Step 3 — Create Payment Links with custom fields

After saving each product, click **Create payment link** on that product's page.

For each payment link, configure these settings:

### Under "Customer information":
- ✅ **Collect email address** — turn this ON
- ✅ **Collect phone number** — optional but recommended

### Under "Custom fields" (click + Add field):
Add these two fields:

**Field 1:**
- Label: `Player name`
- Type: Text
- Required: ✅ Yes

**Field 2:**
- Label: `Your name`
- Type: Text
- Required: ✅ Yes

### Under "After payment":
- Add a confirmation message like:
  > "Thanks for backing your player! Your shares are locked in. Show this receipt at the bar if needed."

### Quantity:
- ✅ **Allow customers to adjust quantity** — turn this ON
- Set min: 1, max: 10

Click **Create link**. You'll see a URL like `https://buy.stripe.com/xxxx`.

**Copy that URL. You'll paste it in Step 5.**

Repeat for all 4 tiers.

---

## Step 4 — Your 4 URLs

After creating all 4 payment links, you should have 4 URLs. Write them down:

```
$25  tier: https://buy.stripe.com/________________
$35  tier: https://buy.stripe.com/________________
$75  tier: https://buy.stripe.com/________________
$150 tier: https://buy.stripe.com/________________
```

---

## Step 5 — Paste URLs into the website

Open `index.html` in any text editor (Notepad, VS Code, etc.)

Find this section near the top of the `<script>` block:

```javascript
stripe: {
  25:  "https://buy.stripe.com/REPLACE_TIER_1_25",
  35:  "https://buy.stripe.com/REPLACE_TIER_2_35",
  75:  "https://buy.stripe.com/REPLACE_TIER_3_75",
  150: "https://buy.stripe.com/REPLACE_TIER_4_150",
},
```

Replace each `REPLACE_...` with your actual Stripe URL:

```javascript
stripe: {
  25:  "https://buy.stripe.com/abcd1234",   // your real $25 link
  35:  "https://buy.stripe.com/efgh5678",   // your real $35 link
  75:  "https://buy.stripe.com/ijkl9012",   // your real $75 link
  150: "https://buy.stripe.com/mnop3456",   // your real $150 link
},
```

Save the file.

---

## Step 6 — Deploy the website (free)

The website is a single HTML file. Easiest free option:

### Option A: Vercel (recommended — already deployed there)
1. Go to **vercel.com** → login
2. Create new project → drag and drop the `shares-site` folder
3. Click **Deploy**
4. Get a live URL like `https://poolmarketladder.vercel.app`
5. Share that URL via QR code at the bar

### Option B: Netlify Drop
1. Go to **app.netlify.com/drop**
2. Drag the `shares-site` folder onto the page
3. Get a live URL instantly — no account needed

### Option C: QR direct to file
If the bar has WiFi and you're hosting locally, you can share the file directly. But Vercel/Netlify is better for QR codes.

---

## Step 7 — Update player data weekly

Every week, open `index.html` and update the `players` array in the CONFIG section:

```javascript
players: [
  { name:"Marcus P.", rank:1, bar:"Bar One", locked:false, hot:true, streak:"W W W W W" },
  ...
]
```

- Update `rank` based on current standings
- Set `hot:true` for players on win streaks
- Set `locked:true` for any player you want to close off (no new shares)
- Update `streak` with last 5 results (W or L, space separated)

After saving, re-deploy to Vercel (just drag the updated file again, or use the CLI).

---

## How money flows — the math

Every $100 of shares sold breaks down as:

| Where it goes          | %    | Per $100 | Per $1,000 | Per $5,000 |
|------------------------|------|----------|------------|------------|
| Investor payouts       | 47%  | $47      | $470       | $2,350     |
| Player prize pool      | 35%  | $35      | $350       | $1,750     |
| Operator fee (÷4)      | 15%  | $15      | $150       | $750       |
| Bar owner              |  3%  | $3       | $30        | $150       |

**Partner cut from operator fee:**

| Share volume sold | Total op fee (15%) | Per partner (÷4) |
|-------------------|--------------------|-----------------|
| $500              | $75                | $18.75          |
| $1,000            | $150               | $37.50          |
| $2,500            | $375               | $93.75          |
| $5,000            | $750               | $187.50         |
| $10,000           | $1,500             | $375.00         |

This is **pure leverage** — the more people buy shares, the more you earn on the operator fee, at zero additional effort.

---

## What customers see in Stripe

When a customer buys:
1. They click BUY → Stripe checkout opens
2. They enter: their name, player name, email
3. They pay — Stripe handles everything (Apple Pay, Google Pay, credit card)
4. They get an automatic email receipt from Stripe
5. Money deposits to your bank account (usually next business day)
6. You see it in your Stripe dashboard under Payments

---

## Tracking who bought what

Stripe Dashboard → **Payments** shows every transaction.

Each payment includes:
- Customer email
- Payment amount (tells you which tier)
- Custom fields: player name + buyer name

You can export this as a CSV and manually update the main app's Supporters tab.

In the future, this can be automated with a Stripe webhook — but for now, manual tracking works.

---

## Useful Stripe links

- Dashboard: https://dashboard.stripe.com
- Payment Links: https://dashboard.stripe.com/payment-links
- Payments list: https://dashboard.stripe.com/payments
- Payouts: https://dashboard.stripe.com/payouts

---

*Questions? Everything is handled in the CONFIG block at the top of `index.html`. You never need to touch anything else.*
