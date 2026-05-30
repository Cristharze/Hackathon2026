'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MetricaMensual, VistaImpactoEmpresa } from '@/lib/types'
import Link from 'next/link'

interface Stat { label: string; value: string; sub?: string; color: string }

export default function DashboardPage() {
  const [pendientes, setPendientes] = useState(0)
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [impacto, setImpacto] = useState<VistaImpactoEmpresa[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const now = new Date()
      const [penRes, metRes, impRes] = await Promise.all([
        supabase.from('recolecciones').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE'),
        supabase.from('metricas_mensuales').select('*').eq('anio', now.getFullYear()).eq('mes', now.getMonth() + 1),
        supabase.from('vista_impacto_empresas').select('*').order('total_co2', { ascending: false }).limit(10),
      ])
      setPendientes(penRes.count || 0)
      setMetricas(metRes.data || [])
      setImpacto(impRes.data || [])
      setLoading(false)
    }
    cargar()

    const channel = supabase
      .channel('dashboard-pendientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, () => {
        supabase.from('recolecciones').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE')
          .then(({ count }) => setPendientes(count || 0))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  const totalKg = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)
  const totalRec = metricas.reduce((s, m) => s + m.num_recolecciones, 0)

  const stats: Stat[] = [
    { label: 'Kg reciclados este mes', value: `${totalKg.toFixed(0)} kg`, color: 'bg-green-50 border-green-200' },
    { label: 'CO₂ ahorrado este mes', value: `${totalCo2.toFixed(1)} kg`, sub: 'CO₂ equivalente', color: 'bg-blue-50 border-blue-200' },
    { label: 'Recolecciones este mes', value: totalRec.toString(), color: 'bg-purple-50 border-purple-200' },
    { label: 'Pendientes de validar', value: pendientes.toString(), color: pendientes > 0 ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200' },
  ]

  const maxKg = Math.max(...impacto.map(e => e.total_co2), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Global</h1>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(s => (
              <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
                {s.label === 'Pendientes de validar' && pendientes > 0 ? (
                  <Link href="/admin/validacion">
                    <p className="text-3xl font-bold text-red-700">{s.value}</p>
                    <p className="text-xs text-red-600 mt-1 font-medium">Ver pendientes →</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </Link>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                    {s.sub && <p className="text-xs text-gray-500 mt-0.5">{s.sub}</p>}
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Ranking empresas */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Ranking por CO₂ ahorrado</h2>
            {impacto.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin datos de impacto disponibles</p>
            ) : (
              <div className="space-y-3">
                {impacto.map((e, i) => (
                  <div key={e.empresa_id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <Link
                          href={`/admin/empresas/${e.empresa_id}`}
                          className="text-sm font-medium text-gray-900 hover:text-green-700 truncate"
                        >
                          {e.empresa_nombre}
                        </Link>
                        <span className="text-xs text-gray-500 ml-2 shrink-0">{e.total_co2.toFixed(1)} kg CO₂</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(e.total_co2 / maxKg) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
