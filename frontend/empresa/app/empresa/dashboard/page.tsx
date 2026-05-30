'use client'

import { useEffect, useState } from 'react'
import { supabase, getEmpresaId, DEMO_EMPRESA_NOMBRE, MESES } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Package, Wind, Droplets, Trees } from 'lucide-react'

const MATERIAL_COLORS = ['#16a34a', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316']

interface MetricasMensuales {
  total_kg: number
  co2_ahorrado: number
  agua_ahorrada: number
  energia_ahorrada: number
  arboles_eq: number
  num_recolecciones: number
  desglose_materiales: Record<string, number> | Array<{ nombre?: string; material?: string; cantidad?: number }> | null
}

interface Detalle {
  cantidad: number
  materiales: { nombre: string; color_hex: string } | null
}

interface Recoleccion {
  id: string
  fecha_recoleccion: string
  detalle_recoleccion: Detalle[]
}

function MetricCard({ title, value, unit, icon: Icon, color }: {
  title: string; value: number | undefined; unit: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">
        {value !== undefined ? value.toLocaleString('es-BO', { maximumFractionDigits: 1 }) : '—'}
      </div>
      <div className="text-sm text-gray-500 mt-1">{unit}</div>
    </div>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<MetricasMensuales | null>(null)
  const [historico, setHistorico] = useState<Array<{ anio: number; mes: number; total_kg: number }>>([])
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError(null)

      const empresaId = await getEmpresaId()
      if (!empresaId) {
        setError('No se encontró la empresa en la base de datos. Verifica que "Supermercados Norte S.R.L." exista en la tabla empresas.')
        return
      }

      const [metricasRes, historicoRes, recolRes] = await Promise.all([
        supabase
          .from('metricas_mensuales')
          .select('total_kg, co2_ahorrado, agua_ahorrada, energia_ahorrada, arboles_eq, num_recolecciones, desglose_materiales')
          .eq('empresa_id', empresaId)
          .eq('anio', currentYear)
          .eq('mes', currentMonth)
          .maybeSingle(),
        supabase
          .from('metricas_mensuales')
          .select('anio, mes, total_kg')
          .eq('empresa_id', empresaId)
          .order('anio', { ascending: false })
          .order('mes', { ascending: false })
          .limit(6),
        supabase
          .from('recolecciones')
          .select(`id, fecha_recoleccion, detalle_recoleccion (cantidad, materiales (nombre, color_hex))`)
          .eq('empresa_id', empresaId)
          .eq('estado', 'APROBADO')
          .order('fecha_recoleccion', { ascending: false })
          .limit(10),
      ])

      if (metricasRes.error) throw metricasRes.error
      if (historicoRes.error) throw historicoRes.error
      if (recolRes.error) throw recolRes.error

      setMetricas(metricasRes.data)
      setHistorico(([...(historicoRes.data || [])]).reverse())
      setRecolecciones((recolRes.data || []) as Recoleccion[])
    } catch (err) {
      console.error(err)
      setError('Error al cargar los datos. Verifica la conexión con Supabase.')
    } finally {
      setLoading(false)
    }
  }

  const barData = historico.map(m => ({
    mes: MESES[m.mes - 1],
    kg: Math.round(m.total_kg),
  }))

  const pieData = (() => {
    if (!metricas?.desglose_materiales) return []
    const d = metricas.desglose_materiales
    if (Array.isArray(d)) {
      return d.map((item, i) => ({
        name: item.nombre || item.material || `Material ${i + 1}`,
        value: Number(item.cantidad ?? 0),
        fill: MATERIAL_COLORS[i % MATERIAL_COLORS.length],
      }))
    }
    return Object.entries(d).map(([name, value], i) => ({
      name,
      value: Number(value),
      fill: MATERIAL_COLORS[i % MATERIAL_COLORS.length],
    }))
  })()

  const co2 = metricas?.co2_ahorrado ?? 0
  const kmSinAuto = Math.round(co2 * 4)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {MESES[currentMonth - 1]} {currentYear} · {DEMO_EMPRESA_NOMBRE}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total Reciclado" value={metricas?.total_kg} unit="kilogramos" icon={Package} color="bg-green-600" />
        <MetricCard title="CO₂ Ahorrado" value={metricas?.co2_ahorrado} unit="kg de CO₂" icon={Wind} color="bg-sky-500" />
        <MetricCard title="Agua Ahorrada" value={metricas?.agua_ahorrada} unit="litros" icon={Droplets} color="bg-blue-600" />
        <MetricCard title="Árboles Equivalentes" value={metricas?.arboles_eq} unit="árboles/año" icon={Trees} color="bg-emerald-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Kg reciclados por mes</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-BO')} kg`, 'Total']} />
                <Bar dataKey="kg" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16 text-sm">Sin datos históricos disponibles</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Desglose por material (mes actual)</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v.toLocaleString('es-BO')} kg`, '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-16 text-sm">
              Sin desglose de materiales para este mes
            </p>
          )}
        </div>
      </div>

      {/* Motivational equivalences */}
      {co2 > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-6 text-white">
          <h2 className="text-base font-semibold mb-3">Tu impacto en perspectiva</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-2xl font-bold">{kmSinAuto.toLocaleString('es-BO')}</div>
              <div className="text-sm text-green-100 mt-1">km equivalentes sin usar el auto</div>
            </div>
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-2xl font-bold">{(metricas?.arboles_eq ?? 0).toFixed(1)}</div>
              <div className="text-sm text-green-100 mt-1">árboles absorbiendo CO₂ por un año</div>
            </div>
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-2xl font-bold">{metricas?.num_recolecciones ?? 0}</div>
              <div className="text-sm text-green-100 mt-1">recolecciones aprobadas este mes</div>
            </div>
          </div>
        </div>
      )}

      {/* Latest collections table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Últimas recolecciones aprobadas</h2>
        {recolecciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Material</th>
                  <th className="pb-3 font-medium text-right">Cantidad (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recolecciones.map(r => {
                  const detalles = r.detalle_recoleccion || []
                  if (detalles.length === 0) {
                    return (
                      <tr key={r.id}>
                        <td className="py-3 text-gray-600">
                          {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO')}
                        </td>
                        <td className="py-3 text-gray-400">—</td>
                        <td className="py-3 text-right text-gray-400">—</td>
                      </tr>
                    )
                  }
                  return detalles.map((d, idx) => (
                    <tr key={`${r.id}-${idx}`}>
                      {idx === 0 && (
                        <td className="py-3 text-gray-600" rowSpan={detalles.length}>
                          {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO')}
                        </td>
                      )}
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {d.materiales?.color_hex && (
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: d.materiales.color_hex }} />
                          )}
                          <span className="text-gray-700">{d.materiales?.nombre ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {d.cantidad?.toLocaleString('es-BO', { maximumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">
            No hay recolecciones aprobadas aún.
          </p>
        )}
      </div>
    </div>
  )
}
