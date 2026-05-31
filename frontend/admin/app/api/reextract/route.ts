import { NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function POST() {
  try {
    const res = await fetch(`${API}/admin/reextract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Timeout generoso: la IA procesa un mensaje a la vez
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 500 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 })
  }
}
