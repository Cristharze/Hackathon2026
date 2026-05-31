import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${API}/stats/empresa/${id}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Backend ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 })
  }
}
