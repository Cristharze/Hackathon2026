'use client'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

interface DashData {
  empresa:  { nombre: string; sector: string | null; ciudad: string | null } | null
  mes:      { kg: number; co2: number; recolecciones: number }
  totales:  { kg: number; co2: number }
  estados:  Record<string, number>
  recientes: { id: string; estado: string; fecha_recoleccion: string; ia_confidence: number | null; notas: string | null }[]
}

const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  APROBADO:  { label: 'Aprobado',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  RECHAZADO: { label: 'Rechazado', cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 28 } },
}

export default function EmpresaDashboard() {
  const { profile } = useAuth()
  const [data, setData]       = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.empresa_id) { setLoading(false); return }
    fetch(`/api/empresa/dashboard?empresa_id=${profile.empresa_id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profile])

  const aprobados  = data?.estados?.APROBADO  ?? 0
  const rechazados = data?.estados?.RECHAZADO ?? 0
  const total      = Object.values(data?.estados ?? {}).reduce((s, v) => s + v, 0)

  const stats = [
    {
      label: 'Kg reciclados', sub: 'este mes',
      value: loading ? '—' : (data?.mes.kg ?? 0).toFixed(1),
      accent: 'bg-emerald-500', shadow: 'shadow-emerald-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'CO₂ ahorrado', sub: 'kg equiv. este mes',
      value: loading ? '—' : (data?.mes.co2 ?? 0).toFixed(1),
      accent: 'bg-sky-500', shadow: 'shadow-sky-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M4.464 3.162A2 2 0 016.28 2h7.44a2 2 0 011.816 1.162l1.154 2.5c.067.145.115.298.143.456C16.941 6.038 17 6 17 6a1 1 0 110 2c-.185 0-.364-.043-.527-.12-.055.468-.27.9-.607 1.224a3.5 3.5 0 01-4.732 0 3.5 3.5 0 01-4.732 0A2.01 2.01 0 016 9V6.86A.997.997 0 015 7a1 1 0 110-2h.006a2.01 2.01 0 01.304-.838l1.154-2Z" /><path fillRule="evenodd" d="M6 11a1 1 0 011 1v3h6v-3a1 1 0 112 0v3.5A1.5 1.5 0 0113.5 17h-7A1.5 1.5 0 015 15.5V12a1 1 0 011-1z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'Recolecciones', sub: 'este mes',
      value: loading ? '—' : String(data?.mes.recolecciones ?? 0),
      accent: 'bg-violet-500', shadow: 'shadow-violet-500/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" /></svg>,
    },
    {
      label: 'Rechazadas', sub: rechazados > 0 ? 'requieren atención' : 'sin problemas',
      value: loading ? '—' : String(rechazados),
      accent: rechazados > 0 ? 'bg-rose-500' : 'bg-slate-400',
      shadow: rechazados > 0 ? 'shadow-rose-500/20' : 'shadow-slate-400/20',
      icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>,
    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {loading ? '...' : (data?.empresa?.nombre ?? 'Mi empresa')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {data?.empresa?.sector && <span>{data.empresa.sector}</span>}
          {data?.empresa?.sector && data?.empresa?.ciudad && <span className="mx-1.5">·</span>}
          {data?.empresa?.ciudad && <span>{data.empresa.ciudad}</span>}
          {!data?.empresa?.sector && !data?.empresa?.ciudad && 'Resumen de impacto ambiental'}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(s => (
          <motion.div key={s.label} variants={item}>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 h-full">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl ${s.accent} flex items-center justify-center text-white shadow-lg ${'shadow' in s ? s.shadow : ''}`}>
                  {s.icon}
                </div>
                {('pulse' in s) && Boolean((s as { pulse?: boolean }).pulse) && (
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{s.value}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">{s.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estado breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-1">Estado de recolecciones</h2>
          <p className="text-xs text-slate-400 mb-5">{total} registros en total</p>

          {total === 0 && !loading ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin recolecciones aún.</p>
          ) : (
            <div className="space-y-3">
              {[
                { key: 'APROBADO',  label: 'Aprobadas',  color: 'bg-emerald-500', count: aprobados },
                { key: 'RECHAZADO', label: 'Rechazadas', color: 'bg-rose-400',    count: rechazados },
              ].map(({ label, color, count }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-600 font-medium">{label}</span>
                    <span className="text-xs font-bold text-slate-900 tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: total > 0 ? `${(count / total) * 100}%` : '0%' }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent collections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-1">Últimas recolecciones</h2>
          <p className="text-xs text-slate-400 mb-4">Los 5 registros más recientes</p>

          {!loading && (!data?.recientes?.length) ? (
            <p className="text-sm text-slate-400 text-center py-6">Sin recolecciones registradas.</p>
          ) : loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {data!.recientes.map(r => {
                const cfg = ESTADO_CFG[r.estado] ?? { label: r.estado, cls: 'bg-slate-100 text-slate-500' }
                return (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-slate-700">
                        {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </p>
                      {r.notas && <p className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">{r.notas}</p>}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg ${cfg.cls}`}>{cfg.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
