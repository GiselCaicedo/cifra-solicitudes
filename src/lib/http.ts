export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, { status: 200, ...init })
}
export function created<T>(data: T) {
  return Response.json({ ok: true, data }, { status: 201 })
}
export function bad(msg = 'Bad Request') {
  return Response.json({ ok: false, error: msg }, { status: 400 })
}
export function unauthorized(msg = 'No autorizado') {
  return Response.json({ ok: false, error: msg }, { status: 401 })
}
export function forbidden(msg = 'Prohibido') {
  return Response.json({ ok: false, error: msg }, { status: 403 })
}
export function notfound(msg = 'No encontrado') {
  return Response.json({ ok: false, error: msg }, { status: 404 })
}
export function fail(e: unknown, status = 500) {
  const msg = e instanceof Error ? e.message : String(e)
  return Response.json({ ok: false, error: msg }, { status })
}
