'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/ui/Toast'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import EditModal from './EditModal'

export interface Recoleccion {
  id: string
  empresa_id: string | null
  empresas?: { nombre: string } | null
  estado: string
  fecha_recoleccion: string
  mensaje_raw: string | null
  imagen_url: string | null
  notas: string | null
  extraido_por_ia: boolean
  ia_confidence: number | null
  created_at: string
}

const ESTADO_CFG: Record<string, string> = {
  PENDIENTE:   'bg-amber-50 text-amber-700 border border-amber-200',
  APROBADO:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RECHAZADO:   'bg-rose-50 text-rose-700 border border-rose-200',
  EN_REVISION: 'bg-sky-50 text-sky-700 border border-sky-200',
}

function ConfBadge({ v }: { v: number | null }) {
  if (v === null) return <span className="text-slate-300">—</span>
  const pct = Math.round(v * 100)
  const cls = v >= 0.8 ? 'bg-emerald-100 text-emerald-700' : v >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cls}`}>{pct}%</span>
}

export default function RecoleccionesPage() {
  const [items, setItems] = useState<Recoleccion[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editTarget, setEditTarget] = useState<Recoleccion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')

  const cargar = useCallback(async () => {
    const res = await fetch('/api/recolecciones', { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    cargar()
    const ch = supabase
      .channel('recolecciones-all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, cargar)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [cargar])

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/recoleccion/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(prev => prev.filter(i => i.id !== id))
      setToast({ message: 'Recolección eliminada', type: 'success' })
    } else {
      setToast({ message: 'Error al eliminar', type: 'error' })
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function handleSave(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/recoleccion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      setToast({ message: 'Cambios guardados', type: 'success' })
      cargar()
    } else {
      setToast({ message: 'Error al guardar', type: 'error' })
    }
    setEditTarget(null)
  }

  const filtered = items.filter(i => {
    const q = search.toLowerCase()
    const empresa = i.empresas?.nombre || ''
    return !q || empresa.toLowerCase().includes(q) || (i.mensaje_raw || '').toLowerCase().includes(q) || i.estado.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Recolecciones</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '...' : `${items.length} registros en total`}
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search" placeholder="Buscar empresa, mensaje..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all w-64"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Tabla */}
      {loading ? <TableSkeleton rows={8} /> : filtered.length === 0 ? (
        <EmptyState
          icon={<svg viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>}
          title="Sin recolecciones"
          description={search ? `No hay resultados para "${search}"` : 'Aún no hay recolecciones registradas.'}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Empresa', 'Fecha', 'Mensaje', 'Confianza IA', 'Estado', 'Acciones'].map((h, i) => (
                    <th key={h} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-5 py-3.5 text-left ${i === 2 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors group"
                    >
                      {/* Empresa */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold shrink-0">
                            {(r.empresas?.nombre || '?').charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 truncate max-w-[140px]">
                            {r.empresas?.nombre || <span className="text-slate-400 italic text-xs">Sin empresa</span>}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>

                      {/* Mensaje */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-slate-600 truncate max-w-xs text-xs">{r.mensaje_raw || <span className="text-slate-300 italic">Sin texto</span>}</p>
                      </td>

                      {/* Confianza */}
                      <td className="px-5 py-3.5">
                        <ConfBadge v={r.ia_confidence} />
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ESTADO_CFG[r.estado] || 'bg-slate-100 text-slate-500'}`}>
                          {r.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Editar */}
                          <button
                            onClick={() => setEditTarget(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            title="Editar"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                            </svg>
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => setDeleteTarget(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Eliminar"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modal de edición */}
      <AnimatePresence>
        {editTarget && (
          <EditModal
            recoleccion={editTarget}
            onSave={handleSave}
            onClose={() => setEditTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="w-11 h-11 rounded-2xl bg-rose-100 flex items-center justify-center mb-4">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-rose-600">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 text-lg">Eliminar recolección</h3>
              <p className="text-sm text-slate-500 mt-1">Esta acción no se puede deshacer. El registro será eliminado permanentemente.</p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 active:scale-95"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
