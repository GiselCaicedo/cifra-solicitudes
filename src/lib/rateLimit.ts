import { NextRequest, NextResponse } from 'next/server'
import { RateLimiterMemory } from 'rate-limiter-flexible'

const limiter = new RateLimiterMemory({
  points: 100,      // 100 requests
  duration: 60      // por minuto
})

export async function withRateLimit(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1'
  try {
    await limiter.consume(ip)
    return null // ok, no hay error
  } catch {
    return NextResponse.json({ ok: false, error: 'Too Many Requests' }, { status: 429 })
  }
}
