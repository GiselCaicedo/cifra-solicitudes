import { NextRequest, NextResponse } from 'next/server'

const ALLOWED = process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) ?? ['http://localhost:3000']

export function handleCors(req: NextRequest) {
  const origin = req.headers.get('origin') || ''
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  }
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }
  return headers
}
