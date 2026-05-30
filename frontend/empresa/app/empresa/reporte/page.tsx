'use client'

import { useEffect, useState } from 'react'
import { supabase, getEmpresaId, DEMO_EMPRESA_NOMBRE, MESES_LARGO } from '@/lib/supabase'
import { Printer, Award, Package, Wind, Droplets, Zap, TrendingUp } from 'lucide-react'

interface MetricaMensual {
  mes: number
  total_kg: number
  co2_ahorrado: number
  agua_ahorrada: number
  energia_ahorrada: number
  arboles_eq: number
  num_recolecciones: number
  desglose_materiales: Record<string, number> | Array<{ nombre?: string; material?: string; cantidad?: number }> | null
}

interface TopMaterial {
  nombre: string
  total_kg: number
}

function getTopMateriales(metricas: MetricaMensual[]): TopMaterial[] {
  const totals: Record<string, number> = {}
  for (const m of metricas) {
    if (!m.desglose_materiales) continue
    const d = m.desglose_materiales
    if (Array.isArray(d)) {
      for (const item of d as any[]) {
        const nombre = item.nombre || item.material || 'Otro'
        totals[nombre] = (totals[nombre] ?? 0) + Number(item.cantidad ?? 0)
      }
    } else {
      for (const [nombre, kg] of Object.entries(d as Record<string, number>)) {
        totals[nombre] = (totals[nombre] ?? 0) + Number(kg)
      }
    }
  }
  return Object.entries(totals)
    .map(([nombre, total_kg]) => ({ nombre, total_kg }))
    .sort((a, b) => b.total_kg - a.total_kg)
    .slice(0, 3)
}

function getMensaje(totalKg: number): string {
  if (totalKg >= 10000) return '¡Resultado extraordinario! Tu empresa es un referente de sostenibilidad en Santa Cruz.'
  if (totalKg >= 5000) return '¡Excelente trabajo! Tu compromiso con el reciclaje marca una diferencia real en nuestra ciudad.'
  if (totalKg >= 1000) return '¡Buen camino! Cada kilogramo reciclado cuenta. Sigues construyendo un Santa Cruz más verde.'
  if (totalKg > 0) return 'Cada acción importa. Has dado los primeros pasos hacia una empresa más sostenible.'
  return 'Este año es una oportunidad para comenzar tu camino hacia la sostenibilidad con Fundares.'
}

export default function ReportePage() {
  const currentYear = new Date().getFullYear()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])

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

      const { data, error: err } = await supabase
        .from('metricas_mensuales')
        .select('mes, total_kg, co2_ahorrado, agua_ahorrada, energia_ahorrada, arboles_eq, num_recolecciones, desglose_materiales')
        .eq('empresa_id', empresaId)
        .eq('anio', currentYear)
        .order('mes', { ascending: true })

      if (err) throw err
      setMetricas(data || [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar el reporte anual.')
    } finally {
      setLoading(false)
    }
  }

  const totales = metricas.reduce(
    (acc, m) => ({
      total_kg: acc.total_kg + (m.total_kg ?? 0),
      co2_ahorrado: acc.co2_ahorrado + (m.co2_ahorrado ?? 0),
      agua_ahorrada: acc.agua_ahorrada + (m.agua_ahorrada ?? 0),
      energia_ahorrada: acc.energia_ahorrada + (m.energia_ahorrada ?? 0),
      arboles_eq: acc.arboles_eq + (m.arboles_eq ?? 0),
      num_recolecciones: acc.num_recolecciones + (m.num_recolecciones ?? 0),
    }),
    { total_kg: 0, co2_ahorrado: 0, agua_ahorrada: 0, energia_ahorrada: 0, arboles_eq: 0, num_recolecciones: 0 }
  )

  const topMateriales = getTopMateriales(metricas)
  const mensaje = getMensaje(totales.total_kg)

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporte Anual {currentYear}</h1>
          <p className="text-sm text-gray-500 mt-1">{DEMO_EMPRESA_NOMBRE}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Printer size={16} />
          Imprimir / PDF
        </button>
      </div>

      {/* Annual summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Kg Reciclados', value: totales.total_kg, unit: 'kg', icon: Package, color: 'text-green-600' },
          { label: 'CO₂ Ahorrado', value: totales.co2_ahorrado, unit: 'kg', icon: Wind, color: 'text-sky-600' },
          { label: 'Agua Ahorrada', value: totales.agua_ahorrada, unit: 'L', icon: Droplets, color: 'text-blue-600' },
          { label: 'Energía', value: totales.energia_ahorrada, unit: 'kWh', icon: Zap, color: 'text-amber-600' },
          { label: 'Árboles Eq.', value: totales.arboles_eq, unit: 'árb.', icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Recolecciones', value: totales.num_recolecciones, unit: 'total', icon: Award, color: 'text-purple-600' },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-center">
            <Icon className={`mx-auto mb-2 ${color}`} size={20} />
            <div className="text-xl font-bold text-gray-900">
              {value.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-gray-400">{unit}</div>
            <div className="text-xs text-gray-600 font-medium mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Congratulatory message */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 text-white flex items-start gap-4">
        <Award className="w-8 h-8 flex-shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-lg mb-1">Mensaje de Fundares</div>
          <p className="text-green-50 text-sm leading-relaxed">{mensaje}</p>
          <p className="text-green-100 text-xs mt-2">
            Con {totales.total_kg.toLocaleString('es-BO', { maximumFractionDigits: 0 })} kg reciclados,
            evitaste {Math.round(totales.co2_ahorrado * 4).toLocaleString('es-BO')} km de emisiones vehiculares
            y equivale a plantar {totales.arboles_eq.toFixed(0)} árboles.
          </p>
        </div>
      </div>

      {/* Top 3 materials */}
      {topMateriales.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Top 3 materiales más reciclados</h2>
          <div className="space-y-3">
            {topMateriales.map((m, i) => {
              const max = topMateriales[0].total_kg
              const pct = (m.total_kg / max) * 100
              return (
                <div key={m.nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        i === 0 ? 'bg-amber-400' : i === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>{i + 1}</span>
                      {m.nombre}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {m.total_kg.toLocaleString('es-BO', { maximumFractionDigits: 1 })} kg
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Month-by-month table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Detalle mes a mes</h2>
        {metricas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100 text-xs">
                  <th className="pb-3 font-medium">Mes</th>
                  <th className="pb-3 font-medium text-right">Kg</th>
                  <th className="pb-3 font-medium text-right">CO₂ (kg)</th>
                  <th className="pb-3 font-medium text-right">Agua (L)</th>
                  <th className="pb-3 font-medium text-right">Energía (kWh)</th>
                  <th className="pb-3 font-medium text-right">Recolecciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metricas.map(m => (
                  <tr key={m.mes} className="hover:bg-gray-50">
                    <td className="py-2.5 font-medium text-gray-800">{MESES_LARGO[m.mes - 1]}</td>
                    <td className="py-2.5 text-right text-gray-700">
                      {(m.total_kg ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 text-right text-sky-700">
                      {(m.co2_ahorrado ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 text-right text-blue-700">
                      {(m.agua_ahorrada ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2.5 text-right text-amber-700">
                      {(m.energia_ahorrada ?? 0).toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2.5 text-right text-gray-600">{m.num_recolecciones ?? 0}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 font-semibold">
                  <td className="pt-3 text-gray-900">Total</td>
                  <td className="pt-3 text-right text-green-700">
                    {totales.total_kg.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="pt-3 text-right text-sky-700">
                    {totales.co2_ahorrado.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="pt-3 text-right text-blue-700">
                    {totales.agua_ahorrada.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                  </td>
                  <td className="pt-3 text-right text-amber-700">
                    {totales.energia_ahorrada.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                  </td>
                  <td className="pt-3 text-right text-gray-800">{totales.num_recolecciones}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">Sin datos para el año {currentYear}.</p>
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print-only text-center text-xs text-gray-400 pt-4 border-t">
        Reporte generado por EcoTrack · Fundares Bolivia · {currentYear}
      </div>
    </div>
  )
}
