'use client'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { MetricaMensual, VistaImpactoEmpresa } from '@/lib/types'
import Link from 'next/link'
import { StatSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
}

interface StatCard {
  label: string
  value: string
  sub: string
  icon: React.ReactNode
  accent: string
  link?: string
  pulse?: boolean
}

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

  const stats: StatCard[] = [
    {
      label: 'Kg reciclados',
      value: totalKg.toFixed(0),
      sub: 'este mes',
      accent: 'bg-emerald-500',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.560-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.373.292-.514.627-.514.9 0 .147.033.32.13.498.083.15.2.29.199.326z" />
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-6a.75.75 0 01.75.75v.316a3.78 3.78 0 011.653.713c.426.33.744.74.925 1.2a.75.75 0 01-1.395.55 1.35 1.35 0 00-.447-.563 2.187 2.187 0 00-.736-.363V9.3c.698.093 1.383.32 1.959.696.787.514 1.29 1.27 1.29 2.13 0 .86-.504 1.616-1.29 2.13-.576.377-1.261.603-1.96.696v.299a.75.75 0 01-1.5 0v-.3c-.697-.092-1.382-.318-1.958-.695-.482-.315-.891-.754-1.063-1.322a.75.75 0 111.44-.407c.075.264.226.48.491.645.321.205.71.332 1.09.37V14.12a4.223 4.223 0 01-1.59-.636c-.703-.46-1.16-1.137-1.16-1.965 0-.828.457-1.505 1.16-1.965A4.223 4.223 0 019.25 9.18V6.79a2.187 2.187 0 00-.736.363 1.35 1.35 0 00-.447.563.75.75 0 01-1.394-.55c.181-.46.499-.87.925-1.2a3.78 3.78 0 011.652-.713V4.75A.75.75 0 0110 4z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'CO₂ ahorrado',
      value: totalCo2.toFixed(1),
      sub: 'kg equivalente',
      accent: 'bg-sky-500',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M4.464 3.162A2 2 0 016.28 2h7.44a2 2 0 011.816 1.162l1.154 2.5c.067.145.115.298.143.456C16.941 6.038 17 6 17 6a1 1 0 110 2c-.185 0-.364-.043-.527-.12-.055.468-.27.9-.607 1.224a3.5 3.5 0 01-4.732 0 3.5 3.5 0 01-4.732 0A2.01 2.01 0 016 9V6.86A.997.997 0 015 7a1 1 0 110-2h.006a2.01 2.01 0 01.304-.838l1.154-2Z" />
          <path fillRule="evenodd" d="M6 11a1 1 0 011 1v3h6v-3a1 1 0 112 0v3.5A1.5 1.5 0 0113.5 17h-7A1.5 1.5 0 015 15.5V12a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Recolecciones',
      value: totalRec.toString(),
      sub: 'este mes',
      accent: 'bg-violet-500',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 41.102 41.102 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zM6.75 6a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 2.5a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Pendientes',
      value: pendientes.toString(),
      sub: pendientes > 0 ? 'requieren validación' : 'todo al día',
      accent: pendientes > 0 ? 'bg-amber-500' : 'bg-slate-400',
      link: pendientes > 0 ? '/admin/validacion' : undefined,
      pulse: pendientes > 0,
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  const maxCo2 = Math.max(...impacto.map(e => e.total_co2), 1)

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Vista global del impacto ambiental — {new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            {stats.map(s => (
              <motion.div key={s.label} variants={item}>
                {s.link ? (
                  <Link href={s.link} className="block group">
                    <StatCardInner stat={s} />
                  </Link>
                ) : (
                  <StatCardInner stat={s} />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Ranking */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-semibold text-slate-900">Ranking de empresas</h2>
                <p className="text-xs text-slate-400 mt-0.5">Ordenado por CO₂ ahorrado</p>
              </div>
              <Link href="/admin/empresas" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
                Ver todas →
              </Link>
            </div>

            {impacto.length === 0 ? (
              <EmptyState
                title="Sin datos de impacto"
                description="Aún no hay recolecciones aprobadas con cálculo de impacto."
              />
            ) : (
              <div className="space-y-4">
                {impacto.map((e, i) => (
                  <motion.div
                    key={e.empresa_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <span className={`text-xs font-bold w-5 text-center shrink-0 ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-slate-300'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <Link
                          href={`/admin/empresas/${e.empresa_id}`}
                          className="text-sm font-medium text-slate-800 hover:text-emerald-600 truncate transition-colors"
                        >
                          {e.empresa_nombre}
                        </Link>
                        <span className="text-xs text-slate-500 ml-3 shrink-0 tabular-nums">
                          {e.total_co2.toFixed(1)} kg CO₂
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(e.total_co2 / maxCo2) * 100}%` }}
                          transition={{ duration: 0.6, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                          className={`h-full rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-emerald-300'}`}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}

function StatCardInner({ stat }: { stat: StatCard }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-all duration-200 h-full">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${stat.accent} flex items-center justify-center text-white`}>
          {stat.icon}
        </div>
        {stat.pulse && (
          <span className="relative flex h-2 w-2 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{stat.value}</p>
      <p className="text-xs font-medium text-slate-500 mt-1">{stat.label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{stat.sub}</p>
    </div>
  )
}
