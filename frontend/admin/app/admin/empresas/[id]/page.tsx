'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { sbGet } from '@/lib/supabase-server'

interface Empresa { id: string; nombre: string; sector: string | null; ciudad: string | null; email: string | null; contacto: string | null; activa: boolean }
interface Recoleccion { id: string; estado: string; fecha_recoleccion: string; mensaje_raw: string | null; ia_confidence: number | null }
interface Metrica { id: string; anio: number; mes: number; total_kg: number; co2_ahorrado: number; num_recolecciones: number }

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ESTADO_S: Record<string, { text: string; color: string; bg: string }> = {
  PENDIENTE:   { text: 'Pendiente',   color: 'var(--warning)', bg: 'var(--warning-bg)' },
  APROBADO:    { text: 'Aprobado',    color: 'var(--success)', bg: 'var(--success-bg)' },
  RECHAZADO:   { text: 'Rechazado',   color: 'var(--error)',   bg: 'var(--error-bg)'   },
  EN_REVISION: { text: 'En revisión', color: 'var(--info)',    bg: 'var(--info-bg)'    },
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-6 w-32" />
      <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: '1px solid var(--border)' }}>
        <div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" />
        <div className="flex gap-3"><div className="skeleton h-16 w-28 rounded-xl" /><div className="skeleton h-16 w-28 rounded-xl" /></div>
      </div>
    </div>
  )
}

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [empresa,       setEmpresa]       = useState<Empresa | null>(null)
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])
  const [metricas,      setMetricas]      = useState<Metrica[]>([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/empresa/${id}`).then(r => r.json()),
      fetch(`/api/backend/empresas/${id}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : { recolecciones: [], metricas: [] }),
    ]).then(([emp, backend]) => {
      setEmpresa(emp.empresa)
      setRecolecciones(backend.recolecciones || emp.recolecciones || [])
      setMetricas(backend.metricas || emp.metricas || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <Skeleton />
  if (!empresa) return <div className="text-center py-16 text-[14px]" style={{ color: 'var(--text-muted)' }}>Empresa no encontrada</div>

  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[13px]">
        <Link href="/admin/empresas" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Empresas
        </Link>
        <span style={{ color: 'var(--gray-300)' }}>/</span>
        <span className="font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{empresa.nombre}</span>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'var(--teal-700)' }}>
              {empresa.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>{empresa.nombre}</h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[empresa.sector, empresa.ciudad].filter(Boolean).join(' · ')}
              </p>
              {empresa.email && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{empresa.email}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)' }}>
              <p className="text-[22px] font-bold tabular" style={{ color: 'var(--teal-800)' }}>{totalKg.toFixed(0)}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--teal-700)' }}>kg reciclados</p>
            </div>
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: '#e0f2fe', border: '1px solid #bae6fd' }}>
              <p className="text-[22px] font-bold tabular" style={{ color: '#0284c7' }}>{totalCo2.toFixed(1)}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: '#0369a1' }}>kg CO₂</p>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href={`/admin/reporte/${id}`}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--teal-700)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-800)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--teal-700)')}>
            Ver reporte anual →
          </Link>
        </div>
      </motion.div>

      {/* Métricas */}
      {metricas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Métricas mensuales</h2>
          </div>
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--border)' }}>
                {['Mes', 'Kg reciclados', 'CO₂ ahorrado', 'Recolecciones'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide px-5 py-3" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricas.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < metricas.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-5 py-3 text-[13px]" style={{ color: 'var(--text-secondary)' }}>{MESES[m.mes - 1]} {m.anio}</td>
                  <td className="px-5 py-3 font-semibold tabular" style={{ color: 'var(--text)' }}>{m.total_kg.toFixed(1)} kg</td>
                  <td className="px-5 py-3 tabular" style={{ color: 'var(--text-secondary)' }}>{m.co2_ahorrado.toFixed(2)} kg</td>
                  <td className="px-5 py-3 tabular" style={{ color: 'var(--text-secondary)' }}>{m.num_recolecciones}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Historial */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
        className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Historial de recolecciones</h2>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{recolecciones.length} registros</span>
        </div>
        {recolecciones.length === 0 ? (
          <p className="text-[13px] text-center py-10" style={{ color: 'var(--text-muted)' }}>Sin recolecciones registradas</p>
        ) : (
          recolecciones.map((r, i) => {
            const es = ESTADO_S[r.estado] ?? { text: r.estado, color: 'var(--gray-500)', bg: 'var(--gray-100)' }
            return (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5 transition-colors"
                style={{ borderBottom: i < recolecciones.length - 1 ? '1px solid var(--border)' : 'none' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-[12px] truncate max-w-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {r.mensaje_raw || '—'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full ml-3 shrink-0"
                  style={{ background: es.bg, color: es.color }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: es.color }} />
                  {es.text}
                </span>
              </div>
            )
          })
        )}
      </motion.div>
    </div>
  )
}
