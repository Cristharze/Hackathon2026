'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '@/components/AuthProvider'

interface EmpresaStats {
  monthly: { mes: string; kg: number }[]
  materiales: { nombre: string; kg: number; color: string }[]
  total_kg: number
}

const TOOLTIP_STYLE = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,.08)',
}

export default function ReportesEmpresaPage() {
  const { profile } = useAuth()
  const [stats,   setStats]   = useState<EmpresaStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [empresaId, setEmpresaId] = useState<string | null>(null)

  // Obtener empresa_id del perfil
  useEffect(() => {
    if (!profile) return
    // El perfil empresa tiene empresa_id o lo buscamos por email
    fetch('/api/auth/profile').then(r => r.json()).then(d => {
      const eid = d?.empresa_id || d?.id
      if (eid) setEmpresaId(eid)
      else setError(true)
    }).catch(() => setError(true))
  }, [profile])

  useEffect(() => {
    if (!empresaId) return
    fetch(`/api/charts/empresa/${empresaId}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [empresaId])

  const today = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4 print:hidden">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
            Mi reporte de reciclaje
          </h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {profile?.nombre} · {today}
          </p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-all active:scale-95"
          style={{ background: '#1e9070' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm2 0h6v3H7V4Zm-1 9v-1h8v4H6v-3h.001Zm5-1H9v-1h3v1Z" clipRule="evenodd"/>
          </svg>
          Descargar PDF
        </button>
      </motion.div>

      {/* Print header */}
      <div className="hidden print:block mb-6">
        <img src="/fundares-logo.png" alt="Fundares" style={{ height: 48 }} />
        <h1 className="text-2xl font-bold mt-3">{profile?.nombre} — Reporte de Reciclaje</h1>
        <p className="text-sm text-gray-500">{today}</p>
        <hr className="mt-3" />
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2].map(i => <div key={i} className="bg-white rounded-2xl h-64 skeleton" style={{ border: '1px solid var(--border)' }} />)}
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Sin datos disponibles</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Aún no hay recolecciones registradas para generar reportes.
          </p>
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          {/* KPIs */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total reciclado',   value: `${stats.total_kg.toFixed(0)} kg`, accent: '#1e9070' },
              { label: 'Tipos de material', value: stats.materiales.length.toString(), accent: '#7c3aed' },
              { label: 'Meses con actividad', value: stats.monthly.filter(m => m.kg > 0).length.toString(), accent: '#0284c7' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
                <div className="bg-white rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                  <p className="text-[24px] font-bold tabular" style={{ color: s.accent }}>{s.value}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Gráfico de barras mensual */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Recolección mensual</h2>
            <p className="text-[12px] mb-5" style={{ color: 'var(--text-muted)' }}>Kg reciclados por mes en los últimos 12 meses</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.monthly} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit=" kg" />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`${v} kg`, 'Kg reciclados']} />
                <Bar dataKey="kg" fill="#1e9070" radius={[4,4,0,0]} name="Kg reciclados" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Gráfico de torta por material */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
            className="bg-white rounded-2xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <h2 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text)' }}>Distribución por tipo de residuo</h2>
            <p className="text-[12px] mb-4" style={{ color: 'var(--text-muted)' }}>Porcentaje de cada material sobre el total reciclado</p>
            {stats.materiales.length === 0 ? (
              <p className="text-center py-10 text-[13px]" style={{ color: 'var(--text-muted)' }}>Sin materiales registrados</p>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-auto">
                  <ResponsiveContainer width={240} height={240}>
                    <PieChart>
                      <Pie data={stats.materiales} dataKey="kg" nameKey="nombre"
                        cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3}>
                        {stats.materiales.map((m, i) => <Cell key={i} fill={m.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => [`${v} kg`]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  {stats.materiales.map(m => {
                    const pct = stats.total_kg > 0 ? ((m.kg / stats.total_kg) * 100).toFixed(1) : '0'
                    return (
                      <div key={m.nombre}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: m.color }} />
                            <span className="text-[13px] font-medium" style={{ color: 'var(--text)' }}>{m.nombre}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[13px] font-bold tabular" style={{ color: 'var(--text)' }}>{m.kg} kg</span>
                            <span className="text-[11px] ml-1.5" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                          <motion.div className="h-full rounded-full" style={{ background: m.color }}
                            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, delay: 0.25 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* Tabla resumen */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Resumen por material</h2>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                  {['Material', 'Kg reciclados', '% del total'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide px-6 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.materiales.map((m, i) => (
                  <tr key={m.nombre} style={{ borderBottom: i < stats.materiales.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                        <span style={{ color: 'var(--text)' }}>{m.nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-semibold tabular" style={{ color: 'var(--text)' }}>{m.kg} kg</td>
                    <td className="px-6 py-3 tabular" style={{ color: 'var(--text-secondary)' }}>
                      {stats.total_kg > 0 ? ((m.kg / stats.total_kg) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--gray-50)' }}>
                  <td className="px-6 py-3 font-bold" style={{ color: 'var(--text)' }}>Total</td>
                  <td className="px-6 py-3 font-bold tabular" style={{ color: '#1e9070' }}>{stats.total_kg} kg</td>
                  <td className="px-6 py-3 font-bold" style={{ color: 'var(--text)' }}>100%</td>
                </tr>
              </tbody>
            </table>
          </motion.div>

          <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
            Fundares Bolivia · Reporte de {profile?.nombre} · {today}
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
