import Stripe from 'stripe'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const PRICE_IDS = {
  registration:   process.env.STRIPE_PRICE_REGISTRATION   || 'price_1TgnwEA99FsxroMnnSLWi5w5',
  weekly_dues:    process.env.STRIPE_PRICE_WEEKLY_DUES    || 'price_1TgnwKA99FsxroMnsezXA5nW',
  share_top2:     process.env.STRIPE_PRICE_SHARE_TOP2     || 'price_1ThntRA99FsxroMnU69Y2vaH',
  share_top34:    process.env.STRIPE_PRICE_SHARE_TOP34    || 'price_1TiMVnA99FsxroMnbQpvSIVS',
  share_top58:    process.env.STRIPE_PRICE_SHARE_TOP58    || 'price_1TggiiA99FsxroMnpYAcLcrf',
  share_unranked: process.env.STRIPE_PRICE_SHARE_UNRANKED || 'price_1TggihA99FsxroMnBPTlNsqG',
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })
  const { type, playerId, playerName, playerRank, shareTier, buyerName, buyerEmail, season } = req.body
  if (!type) return res.status(400).json({ error: 'Missing type' })
  const origin = req.headers.origin || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  let priceId, metadata = { season: String(season || 1) }
  if (type === 'registration') {
    priceId  = PRICE_IDS.registration
    metadata = { ...metadata, type: 'registration', playerId: playerId || '', playerName: playerName || '' }
  } else if (type === 'weekly_dues') {
    priceId  = PRICE_IDS.weekly_dues
    metadata = { ...metadata, type: 'weekly_dues', playerId: playerId || '', playerName: playerName || '' }
  } else if (type === 'share') {
    if (!shareTier) return res.status(400).json({ error: 'shareTier required' })
    priceId = PRICE_IDS[`share_${shareTier}`]
    if (!priceId) return res.status(400).json({ error: `Unknown share tier: ${shareTier}` })
    metadata = { ...metadata, type: 'share', playerId: playerId || '', playerName: playerName || '', playerRank: String(playerRank || ''), shareTier, buyerName: buyerName || '', buyerEmail: buyerEmail || '' }
  } else {
    return res.status(400).json({ error: `Unknown type: ${type}` })
  }
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?payment=cancelled`,
      customer_email: buyerEmail || undefined,
      metadata,
    })
    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
