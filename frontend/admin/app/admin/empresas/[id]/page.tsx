'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Empresa, Recoleccion, MetricaMensual } from '@/lib/types'
import Link from 'next/link'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ESTADO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'var(--a-600)', bg: 'var(--a-50)' },
  APROBADO:    { label: 'Aprobado',    color: 'var(--f-600)', bg: 'var(--f-75)' },
  RECHAZADO:   { label: 'Rechazado',   color: '#dc2626',       bg: '#fff1f1' },
  EN_REVISION: { label: 'En revisión', color: '#0284c7',       bg: '#e0f2fe' },
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-pulse">
      <Skeleton className="h-4 w-24" />
      <div className="bg-white rounded-2xl p-6 space-y-4" style={{ border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-32" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-14 w-28 rounded-xl" />
          <Skeleton className="h-14 w-28 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [empresa,       setEmpresa]       = useState<Empresa | null>(null)
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])
  const [metricas,      setMetricas]      = useState<MetricaMensual[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    fetch(`/api/empresa/${id}`)
      .then(r => r.json())
      .then(d => {
        setEmpresa(d.empresa)
        setRecolecciones(d.recolecciones || [])
        setMetricas(d.metricas || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <PageSkeleton />
  if (!empresa) return (
    <div className="flex items-center justify-center h-48 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
      Empresa no encontrada
    </div>
  )

  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)

  return (
    <div className="max-w-4xl mx-auto px-1 space-y-5">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[13px]">
        <Link href="/admin/empresas" className="transition-colors flex items-center gap-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd"/>
          </svg>
          Empresas
        </Link>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span className="font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{empresa.nombre}</span>
      </motion.div>

      {/* Header empresa */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
              style={{ background: 'var(--f-600)' }}
            >
              {empresa.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[19px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {empresa.nombre}
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[empresa.sector, empresa.ciudad].filter(Boolean).join(' · ')}
              </p>
              {empresa.email && (
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--n-400)' }}>{empresa.email}</p>
              )}
            </div>
          </div>

          {/* Métricas rápidas */}
          <div className="flex gap-3">
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--f-75)', border: '1px solid var(--f-200)' }}>
              <p className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--f-700)' }}>
                {totalKg.toFixed(0)}
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--f-600)' }}>kg reciclados</p>
            </div>
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: '#e0f2fe', border: '1px solid #bae6fd' }}>
              <p className="text-[22px] font-bold tabular-nums" style={{ color: '#0284c7' }}>
                {totalCo2.toFixed(1)}
              </p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: '#0369a1' }}>kg CO₂</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link
            href={`/admin/reporte/${id}`}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--f-600)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--f-700)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--f-600)')}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd"/>
            </svg>
            Ver reporte anual
          </Link>
        </div>
      </motion.div>

      {/* Métricas mensuales */}
      {metricas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Métricas mensuales</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--n-50)' }}>
                  {['Mes', 'Kg reciclados', 'CO₂ ahorrado', 'Recolecciones'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-[0.07em] px-6 py-3" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricas.map((m, i) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.12 + i * 0.03 }}
                    className="transition-colors"
                    style={{ borderBottom: i < metricas.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    <td className="px-6 py-3.5 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                      {MESES[m.mes - 1]} {m.anio}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {m.total_kg.toFixed(1)} kg
                    </td>
                    <td className="px-6 py-3.5 text-[13px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {m.co2_ahorrado.toFixed(2)} kg
                    </td>
                    <td className="px-6 py-3.5 text-[13px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {m.num_recolecciones}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Historial */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Historial de recolecciones</h2>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{recolecciones.length} registros</span>
        </div>
        {recolecciones.length === 0 ? (
          <p className="text-[13px] text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin recolecciones registradas</p>
        ) : (
          <div>
            {recolecciones.map((r, i) => {
              const cfg = ESTADO_CFG[r.estado] ?? { label: r.estado, color: 'var(--n-500)', bg: 'var(--n-75)' }
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-3.5 transition-colors"
                  style={{ borderBottom: i < recolecciones.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[12px] truncate max-w-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {r.mensaje_raw || r.notas || '—'}
                    </p>
                  </div>
                  <span
                    className="text-[11.5px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-3"
                    style={{ color: cfg.color, background: cfg.bg }}
                  >
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
