import jwt from 'jsonwebtoken'

export function signJwt(payload: object) {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1d' })
}

export function verifyJwt<T>(token: string): T | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as T
  } catch {
    return null
  }
}
