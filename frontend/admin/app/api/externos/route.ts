import { NextResponse } from 'next/server'
import { sbGet } from '@/lib/supabase-server'

export async function GET() {
  try {
    const data = await sbGet('contribuyentes_externos', 'order=total_kg.desc')
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
