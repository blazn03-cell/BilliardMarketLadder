import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function toSnake(key) { return key.replace(/([A-Z])/g, '_$1').toLowerCase() }
function rowToSnake(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj
  return Object.fromEntries(Object.entries(obj).filter(([,v]) => v !== undefined).map(([k,v]) => [toSnake(k), v]))
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    return res.status(200).json({ ok: true, note: 'Supabase not configured' })
  const { players, teams, matches, shares, payments, season, currentRound, s1Priority, settings } = req.body
  try {
    if (teams?.length)    { const { error } = await supabase.from('teams').upsert(teams.map(rowToSnake),    { onConflict: 'id' }); if (error) console.error('teams:', error.message) }
    if (players?.length)  { const { error } = await supabase.from('players').upsert(players.map(rowToSnake),  { onConflict: 'id' }); if (error) console.error('players:', error.message) }
    if (matches?.length)  { const { error } = await supabase.from('matches').upsert(matches.map(rowToSnake),  { onConflict: 'id' }); if (error) console.error('matches:', error.message) }
    if (shares?.length)   { const { error } = await supabase.from('shares').upsert(shares.map(rowToSnake),   { onConflict: 'id' }); if (error) console.error('shares:', error.message) }
    if (payments?.length) { const { error } = await supabase.from('payments').upsert(payments.map(rowToSnake),{ onConflict: 'id' }); if (error) console.error('payments:', error.message) }
    await supabase.from('app_state').upsert({ id: 1, season: season ?? 1, current_round: currentRound ?? 1, s1_priority: s1Priority ?? false, settings: settings ?? {}, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
