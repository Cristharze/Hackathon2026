'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Empresa, MetricaMensual, ImpactoRecoleccion } from '@/lib/types'
import Link from 'next/link'

const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_FULL  = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

interface ImpactoSum { co2: number; agua: number; energia: number; arboles: number }

export default function ReportePage() {
  const { empresa_id } = useParams<{ empresa_id: string }>()
  const [empresa,      setEmpresa]      = useState<Empresa | null>(null)
  const [metricas,     setMetricas]     = useState<MetricaMensual[]>([])
  const [impacto,      setImpacto]      = useState<Partial<ImpactoSum>>({})
  const [materialesTop,setMaterialesTop]= useState<{ nombre: string; total: number }[]>([])
  const [loading,      setLoading]      = useState(true)
  const anio = new Date().getFullYear()

  useEffect(() => {
    fetch(`/api/reporte/${empresa_id}`)
      .then(r => r.json())
      .then(d => {
        setEmpresa(d.empresa)
        const metFilt = (d.metricas || []).filter((m: MetricaMensual) => m.anio === anio)
        setMetricas(metFilt)

        const impData: ImpactoRecoleccion[] = d.impacto || []
        if (impData.length > 0) {
          setImpacto(impData.reduce(
            (acc: ImpactoSum, i: ImpactoRecoleccion) => ({
              co2:     acc.co2     + i.co2_ahorrado,
              agua:    acc.agua    + i.agua_ahorrada,
              energia: acc.energia + i.energia_ahorrada,
              arboles: acc.arboles + i.arboles_eq,
            }),
            { co2: 0, agua: 0, energia: 0, arboles: 0 }
          ))
        }

        const desglose: Record<string, number> = {}
        metFilt.forEach((m: MetricaMensual) => {
          if (m.desglose_materiales) {
            Object.entries(m.desglose_materiales).forEach(([k, v]) => {
              desglose[k] = (desglose[k] || 0) + Number(v)
            })
          }
        })
        setMaterialesTop(
          Object.entries(desglose).map(([nombre, total]) => ({ nombre, total }))
            .sort((a, b) => b.total - a.total).slice(0, 5)
        )
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [empresa_id, anio])

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
    </div>
  )
  if (!empresa) return (
    <div className="text-center py-16 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>Empresa no encontrada</div>
  )

  const totalKg = metricas.reduce((s, m) => s + m.total_kg, 0)
  const maxKg   = Math.max(...metricas.map(m => m.total_kg), 1)

  const impactCards = [
    { label: 'CO₂ ahorrado',       value: `${(impacto.co2     || 0).toFixed(1)} kg`,  color: 'var(--teal-700)',  bg: 'var(--teal-50)'  },
    { label: 'Agua ahorrada',       value: `${(impacto.agua    || 0).toFixed(0)} L`,   color: '#0284c7',          bg: '#e0f2fe'          },
    { label: 'Energía ahorrada',    value: `${(impacto.energia || 0).toFixed(1)} kWh`, color: '#d97706',          bg: '#fef3c7'          },
    { label: 'Árboles equivalentes',value: `${(impacto.arboles || 0).toFixed(1)}`,     color: '#0f766e',          bg: '#ccfbf1'          },
  ]

  return (
    <div className="max-w-3xl mx-auto px-1 space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[13px]">
        <Link href={`/admin/empresas/${empresa_id}`} className="flex items-center gap-1 hover:underline transition-colors" style={{ color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd"/>
          </svg>
          {empresa.nombre}
        </Link>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Reporte {anio}</span>
      </motion.div>

      {/* Título */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Reporte Anual {anio}
        </h1>
        <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {empresa.nombre} · {empresa.ciudad}
        </p>
      </motion.div>

      {/* Impacto */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {impactCards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            className="bg-white rounded-2xl p-4"
            style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="w-8 h-8 rounded-lg mb-3" style={{ background: c.color, opacity: 0.15 }} />
            <p className="text-[20px] font-bold tabular-nums" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Gráfico de barras */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <h2 className="text-[14px] font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          Kg reciclados por mes
        </h2>
        <div className="flex items-end gap-1.5 h-28">
          {Array.from({ length: 12 }, (_, i) => {
            const m = metricas.find(x => x.mes === i + 1)
            const h = m ? (m.total_kg / maxKg) * 100 : 0
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums" style={{ color: 'var(--text-muted)' }}>
                  {m ? m.total_kg.toFixed(0) : ''}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, m ? 3 : 0)}%` }}
                  transition={{ duration: 0.5, delay: 0.22 + i * 0.04, ease: 'easeOut' }}
                  className="w-full rounded-t-md"
                  style={{
                    minHeight: m ? '3px' : '0',
                    background: m ? 'var(--f-500)' : 'var(--n-100)',
                  }}
                  title={m ? `${MESES_FULL[i]}: ${m.total_kg.toFixed(1)} kg` : MESES_FULL[i]}
                />
                <span className="text-[9px]" style={{ color: 'var(--n-300)' }}>{MESES_SHORT[i]}</span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Tabla mensual */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>Detalle por mes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--n-50)' }}>
              {['Mes', 'Kg reciclados', 'CO₂ (kg)', 'Recolecciones'].map((h, i) => (
                <th key={h} className={`text-[11px] font-semibold uppercase tracking-[0.07em] px-6 py-3 ${i === 0 ? 'text-left' : 'text-right'}`} style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 12 }, (_, i) => {
              const m = metricas.find(x => x.mes === i + 1)
              return (
                <tr
                  key={i}
                  className="transition-colors"
                  style={{
                    borderBottom: i < 11 ? '1px solid var(--border)' : 'none',
                    opacity: m ? 1 : 0.35,
                  }}
                  onMouseEnter={e => m && (e.currentTarget.style.background = 'var(--n-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="px-6 py-3 text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{MESES_FULL[i]}</td>
                  <td className="px-6 py-3 text-right text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {m ? `${m.total_kg.toFixed(1)} kg` : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {m ? m.co2_ahorrado.toFixed(2) : '—'}
                  </td>
                  <td className="px-6 py-3 text-right text-[13px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {m ? m.num_recolecciones : '—'}
                  </td>
                </tr>
              )
            })}
            <tr style={{ borderTop: '2px solid var(--border)' }}>
              <td className="px-6 py-3.5 text-[13px] font-bold" style={{ color: 'var(--text-primary)' }}>Total {anio}</td>
              <td className="px-6 py-3.5 text-right text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{totalKg.toFixed(1)} kg</td>
              <td className="px-6 py-3.5 text-right text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{(impacto.co2 || 0).toFixed(2)}</td>
              <td className="px-6 py-3.5 text-right text-[13px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{metricas.reduce((s, m) => s + m.num_recolecciones, 0)}</td>
            </tr>
          </tbody>
        </table>
      </motion.div>

      {/* Materiales */}
      {materialesTop.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Materiales más reciclados
          </h2>
          <div className="space-y-3.5">
            {materialesTop.map((mat, i) => {
              const pct = (mat.total / materialesTop[0].total) * 100
              return (
                <div key={mat.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {mat.nombre}
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {mat.total.toFixed(1)} kg
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--n-100)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.07, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: 'var(--f-500)' }}
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
