'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { getPendientes, aprobarRecoleccion, rechazarRecoleccion } from '@/lib/api'
import type { VistaPendiente } from '@/lib/types'
import TarjetaRecoleccion from './TarjetaRecoleccion'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Toast } from '@/components/ui/Toast'

export default function ValidacionPage() {
  const [items, setItems] = useState<VistaPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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
    const channel = supabase
      .channel('recolecciones-pendientes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, () => cargar())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [cargar])

  async function onAprobar(id: string, correcciones: Record<string, unknown>) {
    await aprobarRecoleccion(id, correcciones)
    setItems(prev => prev.filter(i => i.id !== id))
    setToast({ message: 'Recolección aprobada correctamente', type: 'success' })
  }

  async function onRechazar(id: string, motivo: string) {
    await rechazarRecoleccion(id, motivo)
    setItems(prev => prev.filter(i => i.id !== id))
    setToast({ message: 'Recolección rechazada', type: 'error' })
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Validación de Recolecciones
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Revisa y aprueba los mensajes enviados por los recolectores vía WhatsApp
          </p>
        </div>
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              key={items.length}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold ${
                items.length > 0
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {items.length > 0 && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              {items.length} pendiente{items.length !== 1 ? 's' : ''}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-6 text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 shrink-0">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          }
          title="Todo al día"
          description="No hay recolecciones pendientes de validación en este momento."
        />
      )}

      {/* Lista */}
      <motion.div className="space-y-4" layout>
        <AnimatePresence initial={false}>
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            >
              <TarjetaRecoleccion
                recoleccion={item}
                onAprobar={onAprobar}
                onRechazar={onRechazar}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
