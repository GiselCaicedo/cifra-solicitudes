export const Roles = { Cliente: 'cliente', Soporte: 'soporte', Admin: 'admin' } as const
export type Rol = typeof Roles[keyof typeof Roles]

export function hasRole(user: { rol: string } | null, allowed: Rol[]) {
  if (!user) return false
  return allowed.includes(user.rol as Rol)
}
