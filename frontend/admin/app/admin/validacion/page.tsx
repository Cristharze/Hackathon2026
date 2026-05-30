'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getPendientes, aprobarRecoleccion, rechazarRecoleccion } from '@/lib/api'
import type { VistaPendiente } from '@/lib/types'
import TarjetaRecoleccion from './TarjetaRecoleccion'

export default function ValidacionPage() {
  const [items, setItems] = useState<VistaPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      setError(null)
      const data = await getPendientes()
      setItems(data)
    } catch {
      setError('No se pudo conectar al backend. Asegurate que corre en localhost:8000')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()

    // Realtime: escucha inserciones en recolecciones
    const channel = supabase
      .channel('recolecciones-pendientes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recolecciones' },
        () => cargar()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [cargar])

  async function onAprobar(id: string, correcciones: Record<string, unknown>) {
    await aprobarRecoleccion(id, correcciones)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function onRechazar(id: string, motivo: string) {
    await rechazarRecoleccion(id, motivo)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validacion de Recolecciones</h1>
          <p className="text-sm text-gray-500 mt-1">Revisa y aprueba los mensajes enviados por los recolectores</p>
        </div>
        {!loading && (
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            items.length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {items.length} pendiente{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-40 text-gray-400">Cargando...</div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
          <span className="text-4xl mb-2">&#10003;</span>
          <p>No hay recolecciones pendientes</p>
        </div>
      )}

      <div className="space-y-4">
        {items.map(item => (
          <TarjetaRecoleccion
            key={item.id}
            recoleccion={item}
            onAprobar={onAprobar}
            onRechazar={onRechazar}
          />
        ))}
      </div>
    </div>
  )
}
