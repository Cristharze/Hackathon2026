export async function getPendientes() {
  const res = await fetch('/api/pendientes', { cache: 'no-store' })
  if (!res.ok) throw new Error('Error cargando pendientes')
  return res.json()
}

export async function aprobarRecoleccion(id: string, correcciones: Record<string, unknown> = {}) {
  const res = await fetch(`/api/aprobar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(correcciones),
  })
  if (!res.ok) throw new Error('Error al aprobar')
  return res.json()
}

export async function rechazarRecoleccion(id: string, motivo: string) {
  const res = await fetch(`/api/rechazar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo }),
  })
  if (!res.ok) throw new Error('Error al rechazar')
  return res.json()
}
