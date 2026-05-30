'use client'

import { useEffect, useState } from 'react'
import { supabase, getEmpresaId, MESES } from '@/lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricaMensual {
  anio: number
  mes: number
  total_kg: number
  co2_ahorrado: number
  agua_ahorrada: number
  energia_ahorrada: number
  arboles_eq: number
  num_recolecciones: number
}

interface MaterialDetalle {
  nombre: string
  color_hex: string
  total_kg: number
  co2_ahorrado: number
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (!previous || previous === 0) return <span className="text-gray-400 text-xs">Sin datos previos</span>
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0

  return (
    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {up ? '+' : ''}{pct.toFixed(1)}% vs mes anterior
    </div>
  )
}

export default function ImpactoPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [materiales, setMateriales] = useState<MaterialDetalle[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      const empresaId = await getEmpresaId()
      if (!empresaId) {
        setError('No se encontró la empresa en la base de datos.')
        return
      }

      const [metRes, matRes] = await Promise.all([
        supabase
          .from('metricas_mensuales')
          .select('anio, mes, total_kg, co2_ahorrado, agua_ahorrada, energia_ahorrada, arboles_eq, num_recolecciones')
          .eq('empresa_id', empresaId)
          .eq('anio', currentYear)
          .order('mes', { ascending: true }),
        supabase
          .from('detalle_recoleccion')
          .select(`
            cantidad,
            materiales (nombre, color_hex, factor_co2),
            recolecciones!inner (empresa_id, estado)
          `)
          .eq('recolecciones.empresa_id', empresaId)
          .eq('recolecciones.estado', 'APROBADO'),
      ])

      if (metRes.error) throw metRes.error
      setMetricas(metRes.data || [])

      // Aggregate by material
      const agg: Record<string, MaterialDetalle> = {}
      for (const row of (matRes.data || []) as any[]) {
        const nombre = row.materiales?.nombre ?? 'Desconocido'
        const color = row.materiales?.color_hex ?? '#9ca3af'
        const factor = row.materiales?.factor_co2 ?? 0
        const cantidad = Number(row.cantidad ?? 0)
        if (!agg[nombre]) agg[nombre] = { nombre, color_hex: color, total_kg: 0, co2_ahorrado: 0 }
        agg[nombre].total_kg += cantidad
        agg[nombre].co2_ahorrado += cantidad * factor
      }
      setMateriales(Object.values(agg).sort((a, b) => b.total_kg - a.total_kg))
    } catch (err) {
      console.error(err)
      setError('Error al cargar los datos de impacto.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = metricas.map(m => ({
    mes: MESES[m.mes - 1],
    CO2: parseFloat(m.co2_ahorrado.toFixed(1)),
    Agua: parseFloat(m.agua_ahorrada.toFixed(0)),
    Energía: parseFloat(m.energia_ahorrada.toFixed(1)),
  }))

  const current = metricas.find(m => m.mes === currentMonth)
  const previous = metricas.find(m => m.mes === currentMonth - 1)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">{error}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impacto Ambiental</h1>
        <p className="text-sm text-gray-500 mt-1">Evolución mensual del año {currentYear}</p>
      </div>

      {/* Month comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'CO₂ Ahorrado', key: 'co2_ahorrado' as const, unit: 'kg', color: 'sky' },
          { label: 'Agua Ahorrada', key: 'agua_ahorrada' as const, unit: 'L', color: 'blue' },
          { label: 'Energía Ahorrada', key: 'energia_ahorrada' as const, unit: 'kWh', color: 'amber' },
        ].map(({ label, key, unit, color }) => (
          <div key={key} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="text-sm text-gray-500 font-medium mb-2">{label}</div>
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {current ? current[key].toLocaleString('es-BO', { maximumFractionDigits: 1 }) : '—'}
              <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
            </div>
            {current && previous ? (
              <TrendBadge current={current[key]} previous={previous[key]} />
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Minus size={12} /> Sin comparación disponible
              </span>
            )}
          </div>
        ))}
      </div>

      {/* CO2 Line chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">CO₂ y Energía ahorrados por mes (kg / kWh)</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="CO2" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Energía" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-16 text-sm">Sin datos del año actual</p>
        )}
      </div>

      {/* Water Line chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Agua ahorrada por mes (litros)</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-BO')} L`, 'Agua']} />
              <Line type="monotone" dataKey="Agua" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-12 text-sm">Sin datos del año actual</p>
        )}
      </div>

      {/* Material breakdown table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Desglose por material (acumulado del año)</h2>
        {materiales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Material</th>
                  <th className="pb-3 font-medium text-right">Total (kg)</th>
                  <th className="pb-3 font-medium text-right">CO₂ ahorrado (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {materiales.map(m => (
                  <tr key={m.nombre}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: m.color_hex }} />
                        <span className="font-medium text-gray-800">{m.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-gray-700">
                      {m.total_kg.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-3 text-right text-sky-700 font-medium">
                      {m.co2_ahorrado.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">Sin desglose de materiales disponible.</p>
        )}
      </div>
    </div>
  )
}
