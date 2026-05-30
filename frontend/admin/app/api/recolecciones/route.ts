import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET() {
  try {
    const data = await sbGet(
      'recolecciones',
      'order=created_at.desc&limit=100&select=*,empresas(nombre)'
    )
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
