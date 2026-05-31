'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'

interface AdminStats {
  monthly: { mes: string; kg: number }[]
  monthly_por_empresa: { mes: string; total: number; [k: string]: number | string }[]
  materiales: { nombre: string; kg: number; color: string }[]
  empresas: { nombre: string; kg: number; color: string }[]
  empresas_keys: string[]
  empresas_colores: Record<string, string>
  total_kg: number
  total_co2: number
  total_agua: number
  total_energia: number
  total_arboles: number
}

// ── Equivalencias de impacto ─────────────────────────────────────────────────
// Fuentes: IPCC, EPA, WRI
const EQUIV = {
  // CO₂
  vuelo_scz_lpz:  150,   // kg CO₂ — vuelo SCZ→LPZ (~600km, clase económica)
  auto_100km:     12,    // kg CO₂ — auto promedio a 120g/km
  arbol_anio:     21,    // kg CO₂ absorbido por árbol/año
  // Agua
  ducha:          60,    // L — ducha promedio de 8 min
  persona_mes:    3000,  // L — consumo mensual persona
  // Energía
  hogar_mes:      150,   // kWh — hogar promedio Bolivia/mes
  laptop_hora:    0.05,  // kWh — laptop funcionando 1h
}

const TOOLTIP_STYLE = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)',
}

export default function ReportesAdminPage() {
  const [stats, setStats]   = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)
  const [mounted, setMounted] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  const loadStats = useCallback(() => {
    fetch('/api/charts/admin', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        if (d?.error) { setError(true); setLoading(false); return }
        setStats({
          monthly:              d.monthly              ?? [],
          monthly_por_empresa:  d.monthly_por_empresa  ?? [],
          materiales:           d.materiales           ?? [],
          empresas:             d.empresas             ?? [],
          empresas_keys:        d.empresas_keys        ?? [],
          empresas_colores:     d.empresas_colores     ?? {},
          total_kg:             d.total_kg             ?? 0,
          total_co2:            d.total_co2            ?? 0,
          total_agua:           d.total_agua           ?? 0,
          total_energia:        d.total_energia        ?? 0,
          total_arboles:        d.total_arboles        ?? 0,
        })
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  useEffect(() => {
    const interval = setInterval(loadStats, 30000)
    const ch = supabase
      .channel('charts-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, loadStats)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [loadStats])

  function handlePrint() {
    window.print()
  }

  const today = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Reportes globales
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Comparativa de todas las empresas · {today}
          </p>
        </div>
        <button onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-all active:scale-95"
          style={{ background: '#1e9070' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm2 0h6v3H7V4Zm-1 9v-1h8v4H6v-3h.001Zm5-1H9v-1h3v1Z" clipRule="evenodd"/>
          </svg>
          Descargar PDF
        </button>
      </motion.div>

      {/* Print header (solo en PDF) */}
      <div className="hidden print:block mb-6">
        <img src="/fundares-logo.png" alt="Fundares" style={{ height: 48 }} />
        <h1 className="text-2xl font-bold mt-3">Reporte Global de Reciclaje</h1>
        <p className="text-sm text-gray-500">{today} · Todas las empresas aliadas</p>
        <hr className="mt-3" />
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl h-64 skeleton" style={{ border: '1px solid var(--border)' }} />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Backend no disponible</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Asegurate de que el backend corre en localhost:8000
          </p>
        </div>
      )}

      {stats && (
        <div ref={printRef} className="space-y-6">
          {/* KPI strip */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Kg totales',  value: `${(stats.total_kg ?? 0).toFixed(0)} kg`, accent: '#1e9070' },
              { label: 'Empresas',    value: (stats.empresas ?? []).length.toString(),  accent: '#0284c7' },
              { label: 'Materiales',  value: (stats.materiales ?? []).length.toString(), accent: '#7c3aed' },
              { label: 'Top empresa', value: (stats.empresas ?? [])[0]?.nombre ?? '—',   accent: '#d97706', small: true },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.04 }}>
                <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className={`font-bold tabular leading-tight ${s.small ? 'text-[15px]' : 'text-[24px]'}`} style={{ color: s.accent }}>{s.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Impacto ambiental total ──────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Impacto ambiental acumulado</h2>
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Calculado con factores LCA (análisis de ciclo de vida) por tipo de material
              </p>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0" style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'CO₂ ahorrado',     value: `${(stats.total_co2   ?? 0).toFixed(1)}`,  unit: 'kg CO₂',   color: '#1e9070', bg: '#e8f5ec' },
                { label: 'Agua conservada',  value: `${((stats.total_agua ?? 0) / 1000).toFixed(1)}`, unit: 'm³ agua', color: '#0284c7', bg: '#e0f2fe' },
                { label: 'Energía ahorrada', value: `${(stats.total_energia ?? 0).toFixed(1)}`, unit: 'kWh',      color: '#d97706', bg: '#fef3c7' },
                { label: 'Árboles equiv.',   value: `${(stats.total_arboles ?? 0).toFixed(1)}`,unit: 'árboles',  color: '#0f766e', bg: '#ccfbf1' },
              ].map((m, i) => (
                <div key={m.label} className="p-5" style={{ borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <p className="text-[26px] font-bold tabular leading-none" style={{ color: m.color }}>{m.value}</p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: m.color }}>{m.unit}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Comparaciones equivalentes */}
            <div className="px-6 py-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>
                Equivale a…
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const co2  = stats.total_co2    ?? 0
                  const agua = stats.total_agua   ?? 0
                  const en   = stats.total_energia ?? 0
                  const vuelos    = Math.round(co2   / EQUIV.vuelo_scz_lpz)
                  const autos     = Math.round(co2   / EQUIV.auto_100km)
                  const arboles   = Math.round(co2   / EQUIV.arbol_anio)
                  const duchas    = Math.round(agua  / EQUIV.ducha)
                  const personaM  = Math.round(agua  / EQUIV.persona_mes)
                  const hogarM    = Math.round(en    / EQUIV.hogar_mes)
                  const laptops   = Math.round(en    / EQUIV.laptop_hora)

                  const cards = [
                    {
                      icon: '✈️',
                      num: vuelos.toLocaleString('es-BO'),
                      label: 'vuelos SCZ → LPZ',
                      sub: `Cada vuelo emite ~${EQUIV.vuelo_scz_lpz} kg CO₂`,
                      color: '#1e9070', bg: '#e8f5ec',
                    },
                    {
                      icon: '🚗',
                      num: autos.toLocaleString('es-BO'),
                      label: 'viajes en auto de 100 km',
                      sub: `Auto promedio: ~${EQUIV.auto_100km} kg CO₂/100km`,
                      color: '#1e9070', bg: '#e8f5ec',
                    },
                    {
                      icon: '🌳',
                      num: arboles.toLocaleString('es-BO'),
                      label: 'árboles durante 1 año',
                      sub: `Un árbol absorbe ${EQUIV.arbol_anio} kg CO₂/año`,
                      color: '#0f766e', bg: '#ccfbf1',
                    },
                    {
                      icon: '🚿',
                      num: duchas.toLocaleString('es-BO'),
                      label: 'duchas de 8 minutos',
                      sub: `Cada ducha usa ~${EQUIV.ducha} litros`,
                      color: '#0284c7', bg: '#e0f2fe',
                    },
                    {
                      icon: '👨‍👩‍👧‍👦',
                      num: personaM.toLocaleString('es-BO'),
                      label: 'meses de agua para una persona',
                      sub: `Consumo mensual: ~${EQUIV.persona_mes} L/persona`,
                      color: '#0284c7', bg: '#e0f2fe',
                    },
                    {
                      icon: '🏠',
                      num: hogarM.toLocaleString('es-BO'),
                      label: 'meses de luz en un hogar',
                      sub: `Hogar promedio Bolivia: ${EQUIV.hogar_mes} kWh/mes`,
                      color: '#d97706', bg: '#fef3c7',
                    },
                  ]

                  return cards.map(c => (
                    <div key={c.label} className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                      <span className="text-[22px] leading-none shrink-0 mt-0.5">{c.icon}</span>
                      <div className="min-w-0">
                        <p className="text-[20px] font-bold tabular leading-tight" style={{ color: c.color }}>
                          {c.num}
                        </p>
                        <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--text)' }}>
                          {c.label}
                        </p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {c.sub}
                        </p>
                      </div>
                    </div>
                  ))
                })()}
              </div>
              <p className="text-[10.5px] mt-4" style={{ color: 'var(--text-muted)' }}>
                Fuentes: IPCC AR6, EPA, WRI — Factores por material calculados con análisis de ciclo de vida (LCA).
              </p>
            </div>
          </motion.div>

          {/* Gráfico 1: Recolección mensual (total) */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Recolección mensual — todas las empresas</h2>
            <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>Kg totales reciclados por mes desde el primer registro</p>
            {mounted && <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.monthly} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" kg" />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`${v} kg`, 'Total']} />
                <Bar dataKey="kg" fill="#1e9070" radius={[4,4,0,0]} name="Kg reciclados" />
              </BarChart>
            </ResponsiveContainer>}
          </motion.div>

          {/* Gráfico 2: Comparativa por empresa (apilado) */}
          {stats.empresas_keys.length > 1 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Comparativa por empresa</h2>
              <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>Kg mensuales desglosados por empresa aliada</p>
              {mounted && <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.monthly_por_empresa} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" kg" />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`${v} kg`]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  {stats.empresas_keys.slice(0, 8).map(emp => (
                    <Bar key={emp} dataKey={emp} stackId="a" fill={stats.empresas_colores[emp]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>}
            </motion.div>
          )}

          {/* Gráficos de dona + ranking: layout 2 col */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico 3: Torta por tipo de material */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Distribución por material</h2>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>% del total reciclado por tipo de residuo</p>
              {stats.materiales.length === 0 ? (
                <p className="text-center py-10 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin datos de materiales</p>
              ) : (
                <>
                  {mounted && <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stats.materiales} dataKey="kg" nameKey="nombre" cx="50%" cy="50%"
                        outerRadius={80} innerRadius={40} paddingAngle={3}>
                        {stats.materiales.map((m, i) => (
                          <Cell key={i} fill={m.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`${v} kg`]} />
                    </PieChart>
                  </ResponsiveContainer>}
                  <div className="space-y-2 mt-2">
                    {stats.materiales.slice(0,6).map(m => {
                      const pct = stats.total_kg > 0 ? ((m.kg / stats.total_kg) * 100).toFixed(1) : '0'
                      return (
                        <div key={m.nombre} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                            <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>{m.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[12.5px] font-semibold tabular" style={{ color: 'var(--text)' }}>{m.kg} kg</span>
                            <span className="text-[11px] ml-1.5" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </motion.div>

            {/* Gráfico 4: Ranking de empresas */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Ranking de empresas</h2>
              <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>Total acumulado de kg reciclados</p>
              {stats.empresas.length === 0 ? (
                <p className="text-center py-10 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {stats.empresas.slice(0, 8).map((e, i) => {
                    const pct = stats.total_kg > 0 ? (e.kg / stats.total_kg) * 100 : 0
                    return (
                      <div key={e.nombre}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold w-4 shrink-0 tabular" style={{ color: '#9ca3af' }}>{i + 1}</span>
                            <span className="text-[12.5px] font-medium truncate max-w-[150px]" style={{ color: 'var(--text)' }}>{e.nombre}</span>
                          </div>
                          <span className="text-[12px] font-bold tabular" style={{ color: e.color }}>{e.kg} kg</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                          <motion.div className="h-full rounded-full" style={{ background: e.color }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.04 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </div>

          {/* Pie de página PDF */}
          <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
            Fundares Bolivia · Reporte generado el {today} · Plataforma de Gestión de Reciclaje
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  )
}
