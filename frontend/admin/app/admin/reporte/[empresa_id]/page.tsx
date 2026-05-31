'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface Empresa { id: string; nombre: string; ciudad: string | null; sector: string | null }
interface Metrica {
  id: string; empresa_id: string; anio: number; mes: number; mes_label: string
  total_kg: number; co2_ahorrado: number; agua_ahorrada: number
  energia_ahorrada: number; arboles_eq: number; num_recolecciones: number
  desglose_materiales: Record<string, number> | null
}
interface Impacto { co2: number; agua: number; energia: number; arboles: number }
interface Material { nombre: string; kg: number; color: string }

export default function ReportePage() {
  const { empresa_id } = useParams<{ empresa_id: string }>()
  const [empresa,      setEmpresa]       = useState<Empresa | null>(null)
  const [metricas,     setMetricas]      = useState<Metrica[]>([])
  const [impacto,      setImpacto]       = useState<Impacto>({ co2: 0, agua: 0, energia: 0, arboles: 0 })
  const [materialesTop,setMaterialesTop] = useState<Material[]>([])
  const [loading,      setLoading]       = useState(true)

  useEffect(() => {
    fetch(`/api/reporte/${empresa_id}`)
      .then(r => r.json())
      .then(d => {
        setEmpresa(d.empresa ?? null)
        setMetricas(d.metricas ?? [])
        setImpacto(d.impacto ?? { co2: 0, agua: 0, energia: 0, arboles: 0 })
        setMaterialesTop(d.materiales_top ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [empresa_id])

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl skeleton" />)}
    </div>
  )
  if (!empresa) return (
    <div className="text-center py-16 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
      Empresa no encontrada
    </div>
  )

  const totalKg  = metricas.reduce((s, m) => s + m.total_kg, 0)
  const maxKg    = Math.max(...metricas.map(m => m.total_kg), 1)
  const today    = new Date().toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' })

  const impactCards = [
    { label: 'CO₂ ahorrado',        value: `${impacto.co2.toFixed(1)} kg`,     color: '#1e9070', bg: '#e8f5ec', unit: 'kg CO₂ equiv.' },
    { label: 'Agua ahorrada',        value: `${impacto.agua.toFixed(0)} L`,      color: '#0284c7', bg: '#e0f2fe', unit: 'litros' },
    { label: 'Energía ahorrada',     value: `${impacto.energia.toFixed(1)} kWh`, color: '#d97706', bg: '#fef3c7', unit: 'kWh' },
    { label: 'Árboles equivalentes', value: `${impacto.arboles.toFixed(2)}`,     color: '#0f766e', bg: '#ccfbf1', unit: 'árboles' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-1 space-y-6">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[13px]">
        <Link href={`/admin/empresas/${empresa_id}`}
          className="flex items-center gap-1 hover:underline transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 010 1.06L8.06 10l3.72 3.72a.75.75 0 11-1.06 1.06l-4.25-4.25a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0z" clipRule="evenodd"/>
          </svg>
          {empresa.nombre}
        </Link>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Reporte anual</span>
      </motion.div>

      {/* Título + PDF */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            Reporte Anual
          </h1>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {empresa.nombre}{empresa.ciudad ? ` · ${empresa.ciudad}` : ''} · {today}
          </p>
        </div>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-95 print:hidden"
          style={{ background: '#1e9070' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2h1a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Zm2 0h6v3H7V4Zm-1 9v-1h8v4H6v-3h.001Zm5-1H9v-1h3v1Z" clipRule="evenodd"/>
          </svg>
          Descargar PDF
        </button>
      </motion.div>

      {/* Sin datos */}
      {metricas.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Sin recolecciones registradas</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>Esta empresa aún no tiene recolecciones aprobadas.</p>
        </div>
      )}

      {metricas.length > 0 && (<>

      {/* Tarjetas de impacto */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {impactCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <div className="bg-white rounded-2xl p-4 h-full"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <div className="w-8 h-8 rounded-xl mb-3 flex items-center justify-center"
                style={{ background: c.bg }}>
                <div className="w-4 h-4 rounded" style={{ background: c.color, opacity: 0.7 }} />
              </div>
              <p className="text-[22px] font-bold tabular-nums leading-tight" style={{ color: c.color }}>
                {c.value}
              </p>
              <p className="text-[11px] font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {c.label}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.unit}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Gráfico de barras — todos los meses con datos */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="bg-white rounded-2xl p-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
            Kg reciclados por mes
          </h2>
          <span className="text-[12px] font-bold tabular-nums" style={{ color: '#1e9070' }}>
            {totalKg.toFixed(1)} kg total
          </span>
        </div>
        <div className="flex items-end gap-1 overflow-x-auto pb-1" style={{ minHeight: '120px' }}>
          {metricas.map((m, i) => {
            const h = (m.total_kg / maxKg) * 100
            return (
              <div key={m.id} className="flex flex-col items-center gap-1 group shrink-0" style={{ minWidth: '32px', flex: 1 }}>
                <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity tabular-nums"
                  style={{ color: 'var(--text-muted)' }}>
                  {m.total_kg.toFixed(0)}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(h, 3)}%` }}
                  transition={{ duration: 0.5, delay: 0.22 + i * 0.03, ease: 'easeOut' }}
                  className="w-full rounded-t-md"
                  style={{ background: '#1e9070', minHeight: '3px' }}
                  title={`${m.mes_label}: ${m.total_kg.toFixed(1)} kg`}
                />
                <span className="text-[9px] text-center leading-tight"
                  style={{ color: 'var(--text-muted)', writingMode: 'horizontal-tb' }}>
                  {m.mes_label.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Tabla mensual detallada */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className="bg-white rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Detalle mensual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                {['Mes', 'Kg reciclados', 'CO₂ (kg)', 'Agua (L)', 'Energía (kWh)', 'Árb. equiv.', 'Recolecciones'].map((h, i) => (
                  <th key={h} className={`text-[11px] font-semibold uppercase tracking-[0.07em] px-5 py-3 ${i === 0 ? 'text-left' : 'text-right'}`}
                    style={{ color: 'var(--text-muted)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricas.map((m, i) => (
                <tr key={m.id} className="transition-colors"
                  style={{ borderBottom: i < metricas.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td className="px-5 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {m.mes_label}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                    {m.total_kg.toFixed(1)} kg
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums" style={{ color: '#1e9070' }}>
                    {m.co2_ahorrado.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums" style={{ color: '#0284c7' }}>
                    {m.agua_ahorrada.toFixed(0)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums" style={{ color: '#d97706' }}>
                    {m.energia_ahorrada.toFixed(1)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums" style={{ color: '#0f766e' }}>
                    {m.arboles_eq.toFixed(3)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                    {m.num_recolecciones}
                  </td>
                </tr>
              ))}
              {/* Totales */}
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--gray-50)' }}>
                <td className="px-5 py-3.5 font-bold" style={{ color: 'var(--text)' }}>Total acumulado</td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                  {totalKg.toFixed(1)} kg
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: '#1e9070' }}>
                  {impacto.co2.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: '#0284c7' }}>
                  {impacto.agua.toFixed(0)}
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: '#d97706' }}>
                  {impacto.energia.toFixed(1)}
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: '#0f766e' }}>
                  {impacto.arboles.toFixed(3)}
                </td>
                <td className="px-5 py-3.5 text-right font-bold tabular-nums" style={{ color: 'var(--text)' }}>
                  {metricas.reduce((s, m) => s + m.num_recolecciones, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Materiales más reciclados */}
      {materialesTop.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="bg-white rounded-2xl p-6"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 className="text-[14px] font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Materiales reciclados
          </h2>
          <div className="space-y-3.5">
            {materialesTop.map((mat, i) => {
              const pct = materialesTop[0].kg > 0 ? (mat.kg / materialesTop[0].kg) * 100 : 0
              const totalMat = materialesTop.reduce((s, m) => s + m.kg, 0)
              const pctTotal = totalMat > 0 ? ((mat.kg / totalMat) * 100).toFixed(1) : '0'
              return (
                <div key={mat.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: mat.color }} />
                      <span className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {mat.nombre}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--text)' }}>
                        {mat.kg.toFixed(1)} kg
                      </span>
                      <span className="text-[11px] ml-1.5" style={{ color: 'var(--text-muted)' }}>
                        {pctTotal}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.42 + i * 0.07, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: mat.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Pie de página PDF */}
      <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
        Fundares Bolivia · Reporte de {empresa.nombre} · {today}
      </div>

      </>)}

      <style>{`
        @media print {
          header, nav, .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}
