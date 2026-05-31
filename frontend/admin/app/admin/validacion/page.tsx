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

const ESTADO: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:   { label: 'Pendiente',   color: 'var(--a-600)',  bg: 'var(--a-50)' },
  APROBADO:    { label: 'Aprobado',    color: 'var(--f-600)',  bg: 'var(--f-75)' },
  RECHAZADO:   { label: 'Rechazado',   color: '#dc2626',        bg: '#fff1f1' },
  EN_REVISION: { label: 'En revisión', color: '#0284c7',        bg: '#e0f2fe' },
}

function Badge({ estado }: { estado: string }) {
  const cfg = ESTADO[estado] ?? { label: estado, color: 'var(--n-500)', bg: 'var(--n-75)' }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

function ConfBadge({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[12px]" style={{ color: 'var(--n-300)' }}>—</span>
  const pct = Math.round(v * 100)
  const color = v >= 0.8 ? 'var(--f-600)' : v >= 0.5 ? 'var(--a-500)' : '#dc2626'
  const bg    = v >= 0.8 ? 'var(--f-75)'  : v >= 0.5 ? 'var(--a-50)'  : '#fff1f1'
  return (
    <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
      style={{ color, background: bg }}>
      {pct}%
    </span>
  )
}

export default function RecoleccionesPage() {
  const [items,       setItems]       = useState<Recoleccion[]>([])
  const [loading,     setLoading]     = useState(true)
  const [toast,       setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [editTarget,  setEditTarget]  = useState<Recoleccion | null>(null)
  const [deleteTarget,setDeleteTarget]= useState<string | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('TODOS')

  const cargar = useCallback(async () => {
    const res  = await fetch('/api/recolecciones', { cache: 'no-store' })
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
    const q  = search.toLowerCase()
    const ok = !q
      || (i.empresas?.nombre || '').toLowerCase().includes(q)
      || (i.mensaje_raw     || '').toLowerCase().includes(q)
      || i.estado.toLowerCase().includes(q)
    const fOk = filter === 'TODOS' || i.estado === filter
    return ok && fOk
  })

  const counts = items.reduce((acc, i) => {
    acc[i.estado] = (acc[i.estado] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const FILTERS = ['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_REVISION']

  return (
    <div className="max-w-6xl mx-auto px-1">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-6 flex-wrap gap-4"
      >
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Recolecciones
          </h1>
          <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? '...' : `${items.length} registros en total`}
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor"
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--n-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input
            type="search"
            placeholder="Buscar empresa, mensaje..."
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-60 transition-all outline-none"
            style={{
              background: '#fff',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--f-400)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </motion.div>

      {/* ── Filtros ─────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {FILTERS.map(f => {
          const active = filter === f
          const count  = f === 'TODOS' ? items.length : (counts[f] || 0)
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full transition-all"
              style={{
                background: active ? 'var(--f-600)' : '#fff',
                color:      active ? '#fff' : 'var(--text-secondary)',
                border:     active ? '1px solid var(--f-600)' : '1px solid var(--border)',
              }}
            >
              {f === 'TODOS' ? 'Todos' : (ESTADO[f]?.label ?? f)}
              <span
                className="text-[11px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                style={{
                  background: active ? 'rgba(255,255,255,.2)' : 'var(--n-100)',
                  color:      active ? '#fff' : 'var(--text-muted)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Tabla ────────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={7} />
      ) : filtered.length === 0 ? (
        <div
          className="bg-white rounded-2xl"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <EmptyState
            icon={
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6z" clipRule="evenodd"/>
              </svg>
            }
            title="Sin recolecciones"
            description={search ? `Sin resultados para "${search}"` : 'No hay recolecciones registradas.'}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--n-50)' }}>
                  {['Empresa', 'Fecha', 'Mensaje', 'Confianza IA', 'Estado', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`text-left text-[11px] font-semibold uppercase tracking-[0.07em] px-5 py-3.5 ${i >= 2 && i !== 4 && i !== 5 ? 'hidden md:table-cell' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {h}
                    </th>
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
                      transition={{ delay: i * 0.015 }}
                      className="group transition-colors"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      {/* Empresa */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: 'var(--f-600)' }}
                          >
                            {(r.empresas?.nombre || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[13px] font-medium truncate max-w-[140px]" style={{ color: 'var(--text-primary)' }}>
                            {r.empresas?.nombre ?? <em className="not-italic" style={{ color: 'var(--n-300)' }}>Sin empresa</em>}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                        {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>

                      {/* Mensaje */}
                      <td className="px-5 py-3.5 hidden md:table-cell max-w-[240px]">
                        <p className="text-[12.5px] truncate" style={{ color: 'var(--text-secondary)' }}>
                          {r.mensaje_raw ?? <em className="not-italic" style={{ color: 'var(--n-300)' }}>Sin texto</em>}
                        </p>
                      </td>

                      {/* Confianza */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <ConfBadge v={r.ia_confidence} />
                      </td>

                      {/* Estado */}
                      <td className="px-5 py-3.5">
                        <Badge estado={r.estado} />
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3.5 w-20">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditTarget(r)}
                            title="Editar"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--n-400)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--f-75)'; (e.currentTarget as HTMLElement).style.color = 'var(--f-600)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--n-400)' }}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z"/>
                              <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(r.id)}
                            title="Eliminar"
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: 'var(--n-400)' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff1f1'; (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--n-400)' }}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd"/>
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

      {/* ── Edit Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {editTarget && (
          <EditModal recoleccion={editTarget} onSave={handleSave} onClose={() => setEditTarget(null)} />
        )}
      </AnimatePresence>

      {/* ── Delete confirm ─────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(13,31,20,.35)', backdropFilter: 'blur(6px)' }}
            onClick={() => !deleting && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#fff1f1' }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" style={{ color: '#dc2626' }}>
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                Eliminar recolección
              </h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                Esta acción es permanente y no se puede deshacer.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-xl transition-colors disabled:opacity-40"
                  style={{ background: 'var(--n-75)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#dc2626' }}
                >
                  {deleting ? 'Eliminando…' : 'Eliminar'}
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
