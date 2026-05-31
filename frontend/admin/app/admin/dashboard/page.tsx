'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'

interface Stat { label: string; value: string | number; delta?: string; accent: string; bg: string }

function Sk({ w = 'w-24', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<{
    pendientes: number; metricas: unknown[]; impacto: unknown[]
  } | null>(null)
  const [externos, setExternos] = useState<{ nombre: string; total_kg: number }[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard', { cache: 'no-store' }).then(r => r.json()),
      fetch('/api/externos',  { cache: 'no-store' }).then(r => r.json()),
    ]).then(([dash, ext]) => {
      setData(dash)
      setExternos(Array.isArray(ext) ? ext.slice(0, 5) : [])
    }).catch(() => {})
  }, [])

  const metricas = (data?.metricas ?? []) as { total_kg: number; co2_ahorrado: number; num_recolecciones: number }[]
  const impacto  = (data?.impacto  ?? []) as { empresa_id: string; empresa: string; co2_ahorrado: number }[]
  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)
  const totalRec = metricas.reduce((s, m) => s + m.num_recolecciones, 0)
  const maxCo2   = Math.max(...impacto.map(e => e.co2_ahorrado || 0), 1)
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {greeting}{profile?.nombre ? `, ${profile.nombre.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* ── Alert pendientes ─────────────────────────────── */}
      {data && data.pendientes > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link href="/admin/validacion"
            className="flex items-center justify-between px-5 py-4 rounded-xl transition-all hover:brightness-95"
            style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-100)' }}>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--amber-500)' }} />
              <p className="text-[14px] font-semibold" style={{ color: 'var(--amber-700)' }}>
                {data.pendientes} recolección{data.pendientes !== 1 ? 'es' : ''} esperando revisión
              </p>
            </div>
            <span className="text-[13px] font-medium" style={{ color: 'var(--amber-600)' }}>
              Revisar ahora →
            </span>
          </Link>
        </motion.div>
      )}

      {/* ── Metric strip ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {[
          { label: 'Kg reciclados',    value: data ? `${totalKg.toFixed(0)} kg` : null,  sub: 'este mes',       accent: 'var(--green-600)', bg: 'var(--green-50)' },
          { label: 'CO₂ ahorrado',     value: data ? `${totalCo2.toFixed(1)} kg` : null, sub: 'equivalente',    accent: '#0284c7',           bg: '#e0f2fe' },
          { label: 'Recolecciones',    value: data ? `${totalRec}` : null,                sub: 'este mes',       accent: '#7c3aed',           bg: '#f3f0ff' },
          { label: 'Pendientes',       value: data ? `${data.pendientes}` : null,         sub: 'sin revisar',    accent: 'var(--amber-500)', bg: 'var(--amber-50)', alert: (data?.pendientes ?? 0) > 0 },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
            <div
              className="bg-white rounded-xl p-5 h-full"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </span>
                {s.alert && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--amber-500)' }} />}
              </div>
              {s.value !== null && data ? (
                <>
                  <p className="text-[28px] font-bold leading-none tabular" style={{ color: s.accent }}>{s.value}</p>
                  <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
                </>
              ) : (
                <>
                  <Sk w="w-20" h="h-7" />
                  <Sk w="w-16" h="h-3" />
                </>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Bottom grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ranking */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Ranking de empresas</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Por CO₂ ahorrado · acumulado</p>
              </div>
              <Link href="/admin/empresas" className="text-[12.5px] font-medium transition-colors hover:underline" style={{ color: 'var(--green-600)' }}>
                Ver todas →
              </Link>
            </div>
            <div className="p-5">
              {!data ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <Sk w="w-4" h="h-4" /><div className="flex-1"><Sk w="w-full" h="h-3" /></div>
                    </div>
                  ))}
                </div>
              ) : impacto.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos de impacto aún</p>
              ) : (
                <div className="space-y-4">
                  {impacto.map((e, i) => (
                    <motion.div key={e.empresa_id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.26 + i * 0.04 }} className="flex items-center gap-3">
                      <span className="text-[12px] font-bold w-4 shrink-0 tabular" style={{ color: i === 0 ? 'var(--amber-500)' : 'var(--gray-400)' }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/admin/empresas/${e.empresa_id}`} className="text-[13px] font-medium truncate hover:underline" style={{ color: 'var(--text)' }}>
                            {e.empresa}
                          </Link>
                          <span className="text-[12px] ml-2 shrink-0 tabular" style={{ color: 'var(--text-muted)' }}>
                            {(e.co2_ahorrado || 0).toFixed(1)} kg CO₂
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((e.co2_ahorrado || 0) / maxCo2) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.3 + i * 0.04, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: i === 0 ? 'var(--green-500)' : 'var(--green-200)' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Externos */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Contribuyentes externos</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Empresas no registradas · mayor volumen</p>
              </div>
              <Link href="/admin/externos" className="text-[12.5px] font-medium hover:underline" style={{ color: 'var(--green-600)' }}>
                Ver todos →
              </Link>
            </div>
            <div className="p-5">
              {externos.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin externos registrados</p>
              ) : (
                <div className="space-y-3">
                  {externos.map((e, i) => (
                    <motion.div key={e.nombre} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 + i * 0.04 }}
                      className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                          style={{ background: 'var(--amber-500)' }}>
                          {e.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[13px] font-medium truncate" style={{ color: 'var(--text)' }}>{e.nombre}</span>
                      </div>
                      <span className="text-[12px] font-semibold ml-3 shrink-0 tabular" style={{ color: 'var(--text-secondary)' }}>
                        {(e.total_kg || 0).toFixed(0)} kg
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
