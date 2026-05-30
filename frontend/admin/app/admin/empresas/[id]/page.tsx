'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Empresa, Recoleccion, MetricaMensual } from '@/lib/types'
import Link from 'next/link'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ESTADO_CFG: Record<string, { label: string; cls: string }> = {
  PENDIENTE:   { label: 'Pendiente',   cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  APROBADO:    { label: 'Aprobado',    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  RECHAZADO:   { label: 'Rechazado',   cls: 'bg-rose-50 text-rose-700 border border-rose-200' },
  EN_REVISION: { label: 'En revisión', cls: 'bg-sky-50 text-sky-700 border border-sky-200' },
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-5 w-24 bg-slate-200 rounded-lg" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="h-7 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-32 bg-slate-100 rounded-lg" />
        <div className="flex gap-3 pt-2">
          <div className="h-16 w-28 bg-slate-100 rounded-xl" />
          <div className="h-16 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return <div className="max-w-4xl mx-auto"><PageSkeleton /></div>
  if (!empresa) return <div className="flex items-center justify-center h-48 text-slate-400">Empresa no encontrada</div>

  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm">
        <Link href="/admin/empresas" className="text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" /></svg>
          Empresas
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium truncate">{empresa.nombre}</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl font-bold">
              {empresa.nombre.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">{empresa.nombre}</h1>
              <p className="text-sm text-slate-500 mt-0.5">{[empresa.sector, empresa.ciudad].filter(Boolean).join(' · ')}</p>
              {empresa.email && <p className="text-xs text-slate-400 mt-0.5">{empresa.email}</p>}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">{totalKg.toFixed(0)}</p>
              <p className="text-xs text-slate-500 mt-0.5">kg reciclados</p>
            </div>
            <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-3 text-center">
              <p className="text-2xl font-bold text-sky-700 tabular-nums">{totalCo2.toFixed(1)}</p>
              <p className="text-xs text-slate-500 mt-0.5">kg CO₂</p>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-slate-100 flex gap-3">
          <Link href={`/admin/reporte/${id}`} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-600/20">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0-6a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" /></svg>
            Ver reporte anual
          </Link>
        </div>
      </motion.div>

      {metricas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Métricas mensuales</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  {['Mes', 'Kg reciclados', 'CO₂ ahorrado', 'Recolecciones'].map(h => (
                    <th key={h} className="text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-6 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricas.map((m, i) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 + i * 0.04 }} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-slate-600">{MESES[m.mes - 1]} {m.anio}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 tabular-nums">{m.total_kg.toFixed(1)} kg</td>
                    <td className="px-6 py-3.5 text-slate-600 tabular-nums">{m.co2_ahorrado.toFixed(2)} kg</td>
                    <td className="px-6 py-3.5 text-slate-600 tabular-nums">{m.num_recolecciones}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Historial de recolecciones</h2>
          <span className="text-xs text-slate-400">{recolecciones.length} registros</span>
        </div>
        {recolecciones.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">Sin recolecciones registradas</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recolecciones.map((r, i) => {
              const cfg = ESTADO_CFG[r.estado] || { label: r.estado, cls: 'bg-slate-100 text-slate-500' }
              return (
                <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.03 }} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700">
                      {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{r.mensaje_raw || r.notas || '—'}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold shrink-0 ml-3 ${cfg.cls}`}>{cfg.label}</span>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
