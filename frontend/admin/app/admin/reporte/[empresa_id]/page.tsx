'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Empresa, MetricaMensual, ImpactoRecoleccion } from '@/lib/types'
import Link from 'next/link'

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface ImpactoSum { co2: number; agua: number; energia: number; arboles: number }

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse max-w-3xl">
      <div className="h-4 w-20 bg-slate-200 rounded" />
      <div className="h-8 w-56 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200" />)}
      </div>
    </div>
  )
}

export default function ReportePage() {
  const { empresa_id } = useParams<{ empresa_id: string }>()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [impacto, setImpacto] = useState<Partial<ImpactoSum>>({})
  const [materialesTop, setMaterialesTop] = useState<{ nombre: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)
  const anio = new Date().getFullYear()

  useEffect(() => {
    fetch(`/api/reporte/${empresa_id}`)
      .then(r => r.json())
      .then(d => {
        setEmpresa(d.empresa)
        const metFiltered = (d.metricas || []).filter((m: MetricaMensual) => m.anio === anio)
        setMetricas(metFiltered)

        const impData: ImpactoRecoleccion[] = d.impacto || []
        if (impData.length > 0) {
          const sum = impData.reduce(
            (acc: ImpactoSum, i: ImpactoRecoleccion) => ({
              co2: acc.co2 + i.co2_ahorrado,
              agua: acc.agua + i.agua_ahorrada,
              energia: acc.energia + i.energia_ahorrada,
              arboles: acc.arboles + i.arboles_eq,
            }),
            { co2: 0, agua: 0, energia: 0, arboles: 0 }
          )
          setImpacto(sum)
        }

        const desglose: Record<string, number> = {}
        metFiltered.forEach((m: MetricaMensual) => {
          if (m.desglose_materiales) {
            Object.entries(m.desglose_materiales).forEach(([mat, kg]) => {
              desglose[mat] = (desglose[mat] || 0) + Number(kg)
            })
          }
        })
        setMaterialesTop(
          Object.entries(desglose).map(([nombre, total]) => ({ nombre, total })).sort((a, b) => b.total - a.total).slice(0, 5)
        )

        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [empresa_id, anio])

  if (loading) return <div className="max-w-3xl mx-auto pt-4"><PageSkeleton /></div>
  if (!empresa) return <div className="text-center py-16 text-slate-400">Empresa no encontrada</div>

  const totalKg = metricas.reduce((s, m) => s + m.total_kg, 0)
  const maxKg = Math.max(...metricas.map(m => m.total_kg), 1)

  const impactStats = [
    { label: 'CO₂ ahorrado', value: `${(impacto.co2 || 0).toFixed(1)} kg`, icon: '🌿', accent: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
    { label: 'Agua ahorrada', value: `${(impacto.agua || 0).toFixed(0)} L`, icon: '💧', accent: 'bg-sky-50 border-sky-200', text: 'text-sky-700' },
    { label: 'Energía ahorrada', value: `${(impacto.energia || 0).toFixed(1)} kWh`, icon: '⚡', accent: 'bg-amber-50 border-amber-200', text: 'text-amber-700' },
    { label: 'Árboles equiv.', value: `${(impacto.arboles || 0).toFixed(1)}`, icon: '🌳', accent: 'bg-teal-50 border-teal-200', text: 'text-teal-700' },
  ]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm">
        <Link href={`/admin/empresas/${empresa_id}`} className="text-slate-400 hover:text-emerald-600 transition-colors flex items-center gap-1">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd" />
          </svg>
          {empresa.nombre}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-600 font-medium">Reporte {anio}</span>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Reporte Anual {anio}</h1>
        <p className="text-sm text-slate-500 mt-1">{empresa.nombre} · {empresa.ciudad}</p>
      </motion.div>

      {/* Impacto cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {impactStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.06 }}
            className={`${s.accent} border rounded-2xl p-4`}
          >
            <span className="text-2xl leading-none">{s.icon}</span>
            <p className={`text-xl font-bold tabular-nums mt-2 ${s.text}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Gráfico de barras mensuales */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
      >
        <h2 className="font-semibold text-slate-900 mb-5">Kg reciclados por mes</h2>
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: 12 }, (_, i) => {
            const m = metricas.find(x => x.mes === i + 1)
            const h = m ? (m.total_kg / maxKg) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, m ? 4 : 0)}%` }}
                  transition={{ duration: 0.5, delay: 0.25 + i * 0.04, ease: 'easeOut' }}
                  className={`w-full rounded-t-md ${m ? 'bg-emerald-500' : 'bg-slate-100'} min-h-[4px]`}
                  style={{ height: `${Math.max(h, m ? 4 : 0)}%` }}
                  title={m ? `${MESES[i]}: ${m.total_kg.toFixed(1)} kg` : MESES[i]}
                />
                <span className="text-[9px] text-slate-400">{MESES_CORTO[i]}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Tabla mensual */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Detalle por mes</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              {['Mes', 'Kg reciclados', 'CO₂ (kg)', 'Recolecciones'].map((h, i) => (
                <th key={h} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-6 py-3 ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => {
              const m = metricas.find(x => x.mes === i + 1)
              return (
                <tr key={i} className={`border-b border-slate-50 last:border-0 transition-colors ${m ? 'hover:bg-slate-50/50' : 'opacity-35'}`}>
                  <td className="px-6 py-3 text-slate-700 font-medium">{MESES[i]}</td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold text-slate-900">{m ? `${m.total_kg.toFixed(1)} kg` : '—'}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-600">{m ? m.co2_ahorrado.toFixed(2) : '—'}</td>
                  <td className="px-6 py-3 text-right tabular-nums text-slate-600">{m ? m.num_recolecciones : '—'}</td>
                </tr>
              )
            })}
            <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
              <td className="px-6 py-3.5 text-slate-900">Total {anio}</td>
              <td className="px-6 py-3.5 text-right tabular-nums text-slate-900">{totalKg.toFixed(1)} kg</td>
              <td className="px-6 py-3.5 text-right tabular-nums text-slate-900">{(impacto.co2 || 0).toFixed(2)}</td>
              <td className="px-6 py-3.5 text-right tabular-nums text-slate-900">{metricas.reduce((s, m) => s + m.num_recolecciones, 0)}</td>
            </tr>
          </tbody>
        </table>
      </motion.div>

      {/* Materiales top */}
      {materialesTop.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
        >
          <h2 className="font-semibold text-slate-900 mb-4">Materiales más reciclados</h2>
          <div className="space-y-3">
            {materialesTop.map((mat, i) => {
              const pct = (mat.total / materialesTop[0].total) * 100
              return (
                <div key={mat.nombre}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 capitalize">{mat.nombre}</span>
                    <span className="text-sm font-bold text-slate-900 tabular-nums">{mat.total.toFixed(1)} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, delay: 0.45 + i * 0.07, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}
