import { NextRequest, NextResponse } from 'next/server'

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL || 'https://land-frontage-statewide-api-production.up.railway.app'

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const { response_text } = await request.json()

  try {
    const res = await fetch(`${RAILWAY_AI_URL}/api/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: response_text, property_id: id }),
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const result = await res.json()
      return NextResponse.json({ suggestion: result.classification || result.result, confidence: result.confidence, source: 'ai' })
    }
  } catch {
    // AI unavailable
  }

  // Heuristic fallback
  const lower = response_text.toLowerCase()
  const warmWords = ['interested', 'yes', 'call me', 'tell me more', 'open', 'maybe', 'consider']
  const coldWords = ['no', 'not interested', 'remove', 'stop', 'unsubscribe', 'never']
  const isWarm = warmWords.some(w => lower.includes(w))
  const isCold = coldWords.some(w => lower.includes(w))
  const suggestion = isCold ? 'COLD' : isWarm ? 'WARM' : 'WARM'

  return NextResponse.json({ suggestion, confidence: 0.6, source: 'heuristic' })
}
