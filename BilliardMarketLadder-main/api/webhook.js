import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
const stripe   = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
export const config = { api: { bodyParser: false } }
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end',  () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const sig = req.headers['stripe-signature']
  let event
  try {
    const rawBody = await getRawBody(req)
    event = process.env.STRIPE_WEBHOOK_SECRET
      ? stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
      : JSON.parse(rawBody.toString())
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }
  const hasDB = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object, meta = s.metadata || {}
    const { type, playerId, playerName, shareTier, buyerName, buyerEmail, playerRank, season } = meta
    const amount = s.amount_total / 100
    if (hasDB) {
      await supabase.from('payments').insert({ id: crypto.randomUUID(), description: type === 'share' ? `Share (${shareTier}) on ${playerName}` : type === 'registration' ? `Registration — ${playerName}` : `Weekly Dues — ${playerName}`, amount, type: type || 'other', date: new Date().toISOString().split('T')[0], source: 'stripe', stripe_session_id: s.id, stripe_payment_intent: s.payment_intent, metadata: meta })
      if (type === 'share' && playerId && shareTier)
        await supabase.from('shares').insert({ id: crypto.randomUUID(), buyer_name: buyerName || s.customer_email || 'Unknown', buyer_email: buyerEmail || s.customer_email || '', player_id: playerId, tier: shareTier, season: Number(season) || 1, price: amount, status: 'active', manual_entry: false, stripe_session_id: s.id, stripe_payment_intent: s.payment_intent })
      if (type === 'registration' && playerId)
        await supabase.from('players').update({ registration_paid: true }).eq('id', playerId)
      if (type === 'weekly_dues' && playerId) {
        const { data: p } = await supabase.from('players').select('weekly_dues_paid').eq('id', playerId).single()
        if (p) await supabase.from('players').update({ weekly_dues_paid: [...(p.weekly_dues_paid || []), (p.weekly_dues_paid || []).length + 1] }).eq('id', playerId)
      }
    }
  }
  if (event.type === 'refund.created' && hasDB) {
    const r = event.data.object
    await supabase.from('payments').insert({ id: crypto.randomUUID(), description: `Refund — ${r.id}`, amount: r.amount / 100, type: 'refund', date: new Date().toISOString().split('T')[0], source: 'stripe', stripe_payment_intent: r.payment_intent, metadata: { refundId: r.id } })
    await supabase.from('shares').update({ status: 'refunded' }).eq('stripe_payment_intent', r.payment_intent)
  }
  return res.status(200).json({ received: true })
}
