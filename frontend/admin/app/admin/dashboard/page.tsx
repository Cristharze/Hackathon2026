'use client'
import { useEffect, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import type { MetricaMensual, VistaImpactoEmpresa } from '@/lib/types'
import Link from 'next/link'
import { StatSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/components/AuthProvider'

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring' as const, stiffness: 400, damping: 30 } },
}

const MONTH = new Date().toLocaleDateString('es-BO', { month: 'long', year: 'numeric' })
const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const [pendientes, setPendientes] = useState(0)
  const [metricas,   setMetricas]   = useState<MetricaMensual[]>([])
  const [impacto,    setImpacto]    = useState<VistaImpactoEmpresa[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch('/api/dashboard', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => {
        setPendientes(d.pendientes || 0)
        setMetricas(d.metricas || [])
        setImpacto(d.impacto || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)
  const totalRec = metricas.reduce((s, m) => s + m.num_recolecciones, 0)
  const maxCo2   = Math.max(...impacto.map(e => e.co2_ahorrado || 0), 1)

  const stats = [
    {
      label: 'Kg reciclados',
      sublabel: 'este mes',
      value: totalKg.toFixed(0),
      unit: 'kg',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.992 6.992 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
        </svg>
      ),
      color: 'var(--f-600)',
      bg: 'var(--f-75)',
    },
    {
      label: 'CO₂ ahorrado',
      sublabel: 'kg equivalente',
      value: totalCo2.toFixed(1),
      unit: 'kg',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.075C4.29 12.588 3 10.88 3 9a5 5 0 019.314-2.52A5 5 0 0118 9c0 1.88-1.29 3.588-2.885 5.145a22.048 22.048 0 01-2.582 2.075 20.757 20.757 0 01-1.166.684l-.02.01-.006.003-.002.001a.752.752 0 01-.67 0l-.002-.001z"/>
        </svg>
      ),
      color: '#0891b2',
      bg: '#e0f7fa',
    },
    {
      label: 'Recolecciones',
      sublabel: 'este mes',
      value: totalRec.toString(),
      unit: '',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd"/>
        </svg>
      ),
      color: '#7c3aed',
      bg: '#f3f0ff',
    },
    {
      label: pendientes > 0 ? 'Requieren revisión' : 'Sin pendientes',
      sublabel: 'recolecciones',
      value: pendientes.toString(),
      unit: '',
      urgent: pendientes > 0,
      link: '/admin/validacion',
      icon: (
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd"/>
        </svg>
      ),
      color: pendientes > 0 ? 'var(--a-500)' : 'var(--n-400)',
      bg: pendientes > 0 ? 'var(--a-50)' : 'var(--n-75)',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto px-1">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {greeting()}{profile?.nombre ? `, ${profile.nombre.split(' ')[0]}` : ''}
        </h1>
        <p className="text-[13.5px] mt-0.5 capitalize" style={{ color: 'var(--text-muted)' }}>
          {MONTH} · Resumen de impacto ambiental
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <StatSkeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* ── Stats ───────────────────────────────────────── */}
          <motion.div
            variants={stagger} initial="hidden" animate="show"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
          >
            {stats.map(s => (
              <motion.div key={s.label} variants={fadeUp}>
                {s.link ? (
                  <Link href={s.link} className="block group">
                    <StatCard stat={s} />
                  </Link>
                ) : (
                  <StatCard stat={s} />
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* ── Ranking ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
          >
            {/* Panel header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div>
                <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Ranking de empresas
                </h2>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Ordenado por CO₂ ahorrado · acumulado
                </p>
              </div>
              <Link
                href="/admin/empresas"
                className="text-[12.5px] font-medium transition-colors"
                style={{ color: 'var(--f-600)' }}
              >
                Ver todas →
              </Link>
            </div>

            {/* Ranking list */}
            <div className="px-6 py-4">
              {impacto.length === 0 ? (
                <EmptyState
                  title="Sin datos de impacto"
                  description="Aún no hay recolecciones aprobadas con cálculo de impacto ambiental."
                />
              ) : (
                <div className="space-y-4">
                  {impacto.map((e, i) => (
                    <motion.div
                      key={e.empresa_id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.32 + i * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      {/* Rank */}
                      <span
                        className="text-[12px] font-bold w-5 text-center shrink-0 tabular-nums"
                        style={{
                          color: i === 0 ? 'var(--a-500)' : i === 1 ? 'var(--n-400)' : 'var(--n-300)',
                        }}
                      >
                        {i + 1}
                      </span>

                      {/* Bar + label */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <Link
                            href={`/admin/empresas/${e.empresa_id}`}
                            className="text-[13px] font-medium truncate transition-colors hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {e.empresa}
                          </Link>
                          <span className="text-[12px] ml-3 shrink-0 tabular-nums" style={{ color: 'var(--text-muted)' }}>
                            {(e.co2_ahorrado || 0).toFixed(1)} kg CO₂
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--n-100)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((e.co2_ahorrado || 0) / maxCo2) * 100}%` }}
                            transition={{ duration: 0.7, delay: 0.38 + i * 0.05, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: i === 0 ? 'var(--f-500)' : 'var(--f-300)' }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  )
}

function StatCard({ stat }: { stat: ReturnType<typeof Object.assign> }) {
  return (
    <div
      className="bg-white rounded-2xl p-5 h-full transition-all duration-200 hover:shadow-md group-hover:translate-y-[-1px]"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: stat.bg, color: stat.color }}
        >
          {stat.icon}
        </div>
        {stat.urgent && (
          <span className="flex h-2 w-2 mt-0.5">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75" style={{ background: 'var(--a-400)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--a-500)' }} />
          </span>
        )}
      </div>
      <p className="text-[28px] font-bold leading-none tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {stat.value}
        {stat.unit && (
          <span className="text-[14px] font-medium ml-1" style={{ color: 'var(--text-muted)' }}>{stat.unit}</span>
        )}
      </p>
      <p className="text-[12px] font-medium mt-1.5" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
      <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sublabel}</p>
    </div>
  )
}
