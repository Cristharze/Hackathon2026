'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'

interface DashData {
  totalKg:        number
  totalCo2:       number
  totalRec:       number
  recEstesMes:    number
  empresasActivas: number
  materiales:     { nombre: string; kg: number; color: string }[]
  ranking:        { empresa_id: string; empresa: string; co2_ahorrado: number; total_kg: number }[]
  externos:       { nombre: string; total_kg: number }[]
}

function Sk({ w = 'w-24', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<DashData | null>(null)

  const load = useCallback(() => {
    fetch('/api/dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (!d.error) setData(d) })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const interval = setInterval(load, 30000)
    const ch = supabase
      .channel('dashboard-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, load)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [load])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const maxKg    = Math.max(...(data?.ranking ?? []).map(e => e.total_kg || 0), 1)
  const maxMat   = Math.max(...(data?.materiales ?? []).map(m => m.kg), 1)

  const kpis = [
    {
      label: 'Kg reciclados',
      value: data ? `${data.totalKg.toLocaleString('es-BO')} kg` : null,
      sub: 'total acumulado',
      accent: 'var(--teal-700)', bg: 'var(--teal-50)',
    },
    {
      label: 'CO₂ ahorrado',
      value: data ? `${data.totalCo2.toLocaleString('es-BO')} kg` : null,
      sub: 'equivalente CO₂',
      accent: '#0284c7', bg: '#e0f2fe',
    },
    {
      label: 'Recolecciones',
      value: data ? data.totalRec.toString() : null,
      sub: `${data?.recEstesMes ?? 0} este mes`,
      accent: '#7c3aed', bg: '#f3f0ff',
    },
    {
      label: 'Empresas activas',
      value: data ? data.empresasActivas.toString() : null,
      sub: 'con registros aprobados',
      accent: '#d97706', bg: '#fef3c7',
    },
  ]

  return (
    <div className="space-y-8">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>
          {greeting}{profile?.nombre ? `, ${profile.nombre.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* KPIs — impacto total Fundares */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
          Impacto total Fundares — todas las empresas aliadas
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <div className="bg-white rounded-xl p-5 h-full" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                {s.value !== null && data ? (
                  <>
                    <p className="text-[26px] font-bold leading-none tabular" style={{ color: s.accent }}>{s.value}</p>
                    <p className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
                  </>
                ) : (
                  <><Sk w="w-20" h="h-7" /><Sk w="w-16" h="h-3" /></>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Ranking empresas */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="lg:col-span-2">
          <div className="bg-white rounded-xl overflow-hidden h-full" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Ranking de empresas aliadas</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Por kg total reciclado · acumulado</p>
              </div>
              <Link href="/admin/empresas" className="text-[12.5px] font-medium hover:underline" style={{ color: 'var(--teal-700)' }}>
                Ver todas →
              </Link>
            </div>
            <div className="p-5">
              {!data ? (
                <div className="space-y-4">{[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Sk w="w-4" h="h-4" /><div className="flex-1"><Sk w="w-full" h="h-3" /></div>
                  </div>
                ))}</div>
              ) : data.ranking.length === 0 ? (
                <p className="text-[13px] text-center py-8" style={{ color: 'var(--text-muted)' }}>Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {data.ranking.map((e, i) => (
                    <motion.div key={e.empresa_id || e.empresa || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 + i * 0.04 }}
                      className="flex items-center gap-3">
                      <span className="text-[12px] font-bold w-4 shrink-0 tabular"
                        style={{ color: i === 0 ? '#d97706' : 'var(--gray-400)' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <Link href={`/admin/empresas/${e.empresa_id}`}
                            className="text-[13px] font-medium truncate hover:underline" style={{ color: 'var(--text)' }}>
                            {e.empresa}
                          </Link>
                          <span className="text-[12px] ml-2 shrink-0 tabular font-semibold" style={{ color: 'var(--teal-700)' }}>
                            {(e.total_kg || 0).toFixed(0)} kg
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((e.total_kg || 0) / maxKg) * 100}%` }}
                            transition={{ duration: 0.6, delay: 0.28 + i * 0.04, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: i === 0 ? 'var(--teal-600)' : 'var(--teal-300)' }}
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

        {/* Materiales + Externos en columna derecha */}
        <div className="space-y-6">

          {/* Breakdown por material */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Por material</h2>
                <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Top materiales reciclados</p>
              </div>
              <div className="p-5 space-y-3">
                {!data ? (
                  [1,2,3].map(i => <Sk key={i} w="w-full" h="h-4" />)
                ) : data.materiales.length === 0 ? (
                  <p className="text-[13px] text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin datos</p>
                ) : (
                  data.materiales.map((m, i) => (
                    <motion.div key={m.nombre} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 + i * 0.04 }}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: m.color }} />
                          <span className="text-[12px] font-medium" style={{ color: 'var(--text-secondary)' }}>{m.nombre}</span>
                        </div>
                        <span className="text-[12px] font-semibold tabular" style={{ color: 'var(--text)' }}>{m.kg} kg</span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                        <motion.div className="h-full rounded-full" style={{ background: m.color }}
                          initial={{ width: 0 }} animate={{ width: `${(m.kg / maxMat) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.3 + i * 0.04 }} />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>

          {/* Externos */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Externos</h2>
                <Link href="/admin/externos" className="text-[12px] hover:underline" style={{ color: 'var(--teal-700)' }}>Ver todos →</Link>
              </div>
              <div className="p-5 space-y-2">
                {!data ? (
                  [1,2].map(i => <Sk key={i} w="w-full" h="h-4" />)
                ) : (data.externos ?? []).length === 0 ? (
                  <p className="text-[12px] text-center py-4" style={{ color: 'var(--text-muted)' }}>Sin externos</p>
                ) : (
                  (data.externos ?? []).map(e => (
                    <div key={e.nombre} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: '#d97706' }}>
                          {e.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[12px] truncate" style={{ color: 'var(--text-secondary)' }}>{e.nombre}</span>
                      </div>
                      <span className="text-[12px] font-semibold ml-2 shrink-0 tabular" style={{ color: 'var(--text-muted)' }}>
                        {(e.total_kg || 0).toFixed(0)} kg
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
