import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const [recRes, metRes] = await Promise.all([
      fetch(`${API}/empresas/${id}/recolecciones`, { cache: 'no-store' }),
      fetch(`${API}/empresas/${id}/metricas`,      { cache: 'no-store' }),
    ])
    const [recolecciones, metricas] = await Promise.all([recRes.json(), metRes.json()])
    return NextResponse.json({ recolecciones, metricas })
  } catch {
    return NextResponse.json({ error: 'Backend no disponible' }, { status: 503 })
  }
}
