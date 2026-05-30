'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empresa, MetricaMensual, ImpactoRecoleccion } from '@/lib/types'
import Link from 'next/link'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

export default function ReportePage() {
  const { empresa_id } = useParams<{ empresa_id: string }>()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [impacto, setImpacto] = useState<Partial<{ co2: number; agua: number; energia: number; arboles: number }>>({})
  const [materialesTop, setMaterialesTop] = useState<{ nombre: string; total: number }[]>([])
  const [loading, setLoading] = useState(true)
  const anio = new Date().getFullYear()

  useEffect(() => {
    async function cargar() {
      const [empRes, metRes, impRes, recIds] = await Promise.all([
        supabase.from('empresas').select('*').eq('id', empresa_id).single(),
        supabase.from('metricas_mensuales').select('*').eq('empresa_id', empresa_id).eq('anio', anio).order('mes'),
        supabase.from('recolecciones').select('id').eq('empresa_id', empresa_id).eq('estado', 'APROBADO'),
        supabase.from('recolecciones').select('id').eq('empresa_id', empresa_id).eq('estado', 'APROBADO'),
      ])
      setEmpresa(empRes.data)
      setMetricas(metRes.data || [])

      const ids = (impRes.data || []).map((r: { id: string }) => r.id)
      if (ids.length > 0) {
        const { data: impData } = await supabase
          .from('impacto_recoleccion')
          .select('*')
          .in('recoleccion_id', ids)
        const sum = (impData || []).reduce(
          (acc: { co2: number; agua: number; energia: number; arboles: number }, i: ImpactoRecoleccion) => ({
            co2: acc.co2 + i.co2_ahorrado,
            agua: acc.agua + i.agua_ahorrada,
            energia: acc.energia + i.energia_ahorrada,
            arboles: acc.arboles + i.arboles_eq,
          }),
          { co2: 0, agua: 0, energia: 0, arboles: 0 }
        )
        setImpacto(sum)

        // Materiales top desde desglose_materiales de metricas
        const desglose: Record<string, number> = {}
        ;(metRes.data || []).forEach((m: MetricaMensual) => {
          if (m.desglose_materiales) {
            Object.entries(m.desglose_materiales).forEach(([mat, kg]) => {
              desglose[mat] = (desglose[mat] || 0) + Number(kg)
            })
          }
        })
        const sorted = Object.entries(desglose)
          .map(([nombre, total]) => ({ nombre, total }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 5)
        setMaterialesTop(sorted)
      }

      setLoading(false)
    }
    cargar()
  }, [empresa_id, anio])

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando...</div>
  if (!empresa) return <div className="text-center py-16 text-gray-500">Empresa no encontrada</div>

  const totalKg = metricas.reduce((s, m) => s + m.total_kg, 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/empresas/${empresa_id}`} className="text-green-600 hover:text-green-800 text-sm">
          ← Volver
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporte Anual {anio}</h1>
        <p className="text-gray-500 mt-1">{empresa.nombre} · {empresa.ciudad}</p>
      </div>

      {/* Resumen de impacto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'CO₂ ahorrado', value: `${(impacto.co2 || 0).toFixed(1)} kg`, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Agua ahorrada', value: `${(impacto.agua || 0).toFixed(0)} L`, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: 'Energía ahorrada', value: `${(impacto.energia || 0).toFixed(1)} kWh`, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Árboles equivalentes', value: `${(impacto.arboles || 0).toFixed(1)}`, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-200`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabla mensual */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Detalle por mes — {anio}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="pb-2 pr-4">Mes</th>
              <th className="pb-2 pr-4 text-right">Kg reciclados</th>
              <th className="pb-2 pr-4 text-right">CO₂ (kg)</th>
              <th className="pb-2 text-right">Recolecciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.from({ length: 12 }, (_, i) => {
              const m = metricas.find(x => x.mes === i + 1)
              return (
                <tr key={i} className={m ? '' : 'opacity-40'}>
                  <td className="py-2 pr-4 text-gray-700">{MESES[i]}</td>
                  <td className="py-2 pr-4 text-right font-medium">{m ? `${m.total_kg.toFixed(1)} kg` : '—'}</td>
                  <td className="py-2 pr-4 text-right">{m ? m.co2_ahorrado.toFixed(2) : '—'}</td>
                  <td className="py-2 text-right">{m ? m.num_recolecciones : '—'}</td>
                </tr>
              )
            })}
            <tr className="border-t border-gray-300 font-semibold">
              <td className="pt-3 pr-4 text-gray-900">Total</td>
              <td className="pt-3 pr-4 text-right text-gray-900">{totalKg.toFixed(1)} kg</td>
              <td className="pt-3 pr-4 text-right text-gray-900">{(impacto.co2 || 0).toFixed(2)}</td>
              <td className="pt-3 text-right text-gray-900">{metricas.reduce((s, m) => s + m.num_recolecciones, 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Materiales top */}
      {materialesTop.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Materiales mas reciclados</h2>
          <div className="space-y-2">
            {materialesTop.map(mat => (
              <div key={mat.nombre} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 capitalize">{mat.nombre}</span>
                <span className="text-sm font-medium text-gray-900">{mat.total.toFixed(1)} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
