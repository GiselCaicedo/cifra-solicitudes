import { NextRequest } from 'next/server'
import { verifyJwt } from './auth'

export function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  return verifyJwt<{ id: number; rol: string }>(token)
}
