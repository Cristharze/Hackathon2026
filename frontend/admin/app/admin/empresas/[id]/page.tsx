'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Empresa, Recoleccion, MetricaMensual } from '@/lib/types'
import Link from 'next/link'

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-700',
  APROBADO: 'bg-green-100 text-green-700',
  RECHAZADO: 'bg-red-100 text-red-700',
  EN_REVISION: 'bg-blue-100 text-blue-700',
}

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])
  const [metricas, setMetricas] = useState<MetricaMensual[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function cargar() {
      const [empRes, recRes, metRes] = await Promise.all([
        supabase.from('empresas').select('*').eq('id', id).single(),
        supabase.from('recolecciones').select('*').eq('empresa_id', id).order('fecha_recoleccion', { ascending: false }).limit(20),
        supabase.from('metricas_mensuales').select('*').eq('empresa_id', id).order('anio').order('mes'),
      ])
      setEmpresa(empRes.data)
      setRecolecciones(recRes.data || [])
      setMetricas(metRes.data || [])
      setLoading(false)
    }
    cargar()
  }, [id])

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando...</div>
  if (!empresa) return <div className="text-center py-16 text-gray-500">Empresa no encontrada</div>

  const totalKg = metricas.reduce((s, m) => s + m.total_kg, 0)
  const totalCo2 = metricas.reduce((s, m) => s + m.co2_ahorrado, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/empresas" className="text-green-600 hover:text-green-800 text-sm">
          ← Volver
        </Link>
      </div>

      {/* Header empresa */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{empresa.nombre}</h1>
            <p className="text-gray-500 mt-1">{empresa.sector} · {empresa.ciudad}</p>
            {empresa.email && <p className="text-sm text-gray-400 mt-0.5">{empresa.email}</p>}
          </div>
          <div className="flex gap-3 text-center">
            <div className="bg-green-50 rounded-lg px-4 py-2">
              <p className="text-2xl font-bold text-green-700">{totalKg.toFixed(0)}</p>
              <p className="text-xs text-gray-500">kg reciclados</p>
            </div>
            <div className="bg-blue-50 rounded-lg px-4 py-2">
              <p className="text-2xl font-bold text-blue-700">{totalCo2.toFixed(1)}</p>
              <p className="text-xs text-gray-500">kg CO₂ ahorrado</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href={`/admin/reporte/${id}`}
            className="inline-block text-sm text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Ver reporte anual
          </Link>
        </div>
      </div>

      {/* Metricas mensuales */}
      {metricas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Metricas mensuales</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-2 pr-4">Mes</th>
                  <th className="pb-2 pr-4">Kg reciclados</th>
                  <th className="pb-2 pr-4">CO₂ ahorrado</th>
                  <th className="pb-2">Recolecciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {metricas.map(m => (
                  <tr key={m.id}>
                    <td className="py-2 pr-4 text-gray-600">{MESES[m.mes - 1]} {m.anio}</td>
                    <td className="py-2 pr-4 font-medium text-gray-900">{m.total_kg.toFixed(1)} kg</td>
                    <td className="py-2 pr-4 text-gray-600">{m.co2_ahorrado.toFixed(2)} kg</td>
                    <td className="py-2 text-gray-600">{m.num_recolecciones}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historial recolecciones */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Historial de recolecciones</h2>
        {recolecciones.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin recolecciones registradas</p>
        ) : (
          <div className="space-y-2">
            {recolecciones.map(r => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{new Date(r.fecha_recoleccion).toLocaleDateString('es-BO')}</p>
                  <p className="text-xs text-gray-400 truncate max-w-xs">{r.mensaje_raw || r.notas || '—'}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLOR[r.estado] || 'bg-gray-100 text-gray-500'}`}>
                  {r.estado}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
