// src/lib/requireAuth.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyJwt } from './auth'

export interface AuthUser {
  id: number
  rol: string
}

export function getUserFromRequest(req: NextRequest): AuthUser | null {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  return verifyJwt<AuthUser>(token)
}

export function requireAuth(req: NextRequest): { user: AuthUser } | NextResponse {
  const user = getUserFromRequest(req)
  
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Token de autorización requerido' }, 
      { status: 401 }
    )
  }
  return { user }
}

export function requireRole(req: NextRequest, allowedRoles: string[]): { user: AuthUser } | NextResponse {
  const authResult = requireAuth(req)
  if (authResult instanceof NextResponse) return authResult
  
  const { user } = authResult
  if (!allowedRoles.includes(user.rol)) {
    return NextResponse.json(
      { ok: false, error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}` },
      { status: 403 }
    )
  }
  return { user }
}