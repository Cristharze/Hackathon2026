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
