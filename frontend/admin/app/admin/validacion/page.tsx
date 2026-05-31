'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/ui/Toast'
import EditModal from './EditModal'

interface Material { material?: string; cantidad?: number; unidad?: string }

export interface Recoleccion {
  id: string
  empresa_id: string | null
  empresas?: { nombre: string } | null
  empresa_nombre_raw?: string | null
  estado: string
  fecha_recoleccion: string
  mensaje_raw: string | null
  imagen_url: string | null
  notas: string | null
  extraido_por_ia: boolean
  ia_confidence: number | null
  created_at: string
  detalle_recoleccion?: { cantidad: number; materiales?: { nombre: string } }[]
}

const CONF_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  high:   { text: 'Alta',  color: 'var(--success)',  bg: 'var(--success-bg)' },
  medium: { text: 'Media', color: 'var(--warning)',  bg: 'var(--warning-bg)' },
  low:    { text: 'Baja',  color: 'var(--error)',    bg: 'var(--error-bg)'   },
}
const confLevel = (v: number | null) => !v ? 'low' : v >= 0.8 ? 'high' : v >= 0.5 ? 'medium' : 'low'

const ESTADO_STYLE: Record<string, { text: string; color: string; bg: string }> = {
  PENDIENTE:   { text: 'Pendiente',   color: 'var(--warning)', bg: 'var(--warning-bg)' },
  APROBADO:    { text: 'Aprobado',    color: 'var(--success)', bg: 'var(--success-bg)' },
  RECHAZADO:   { text: 'Rechazado',   color: 'var(--error)',   bg: 'var(--error-bg)'   },
  EN_REVISION: { text: 'En revisión', color: 'var(--info)',    bg: 'var(--info-bg)'    },
}

const FILTERS = ['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO', 'EN_REVISION'] as const
type Filter = typeof FILTERS[number]

export default function RegistrosPage() {
  const [items,        setItems]        = useState<Recoleccion[]>([])
  const [loading,      setLoading]      = useState(true)
  const [filter,       setFilter]       = useState<Filter>('TODOS')
  const [search,       setSearch]       = useState('')
  const [editTarget,   setEditTarget]   = useState<Recoleccion | null>(null)
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [toast,        setToast]        = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch('/api/recolecciones', { cache: 'no-store' })
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const ch = supabase.channel('reg').on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load])

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/recoleccion/${id}`, { method: 'DELETE' })
    if (res.ok) { setItems(p => p.filter(i => i.id !== id)); setToast({ message: 'Eliminado', type: 'success' }) }
    else setToast({ message: 'Error al eliminar', type: 'error' })
    setDeleting(false); setDeleteId(null)
  }

  async function handleSave(id: string, updates: Record<string, unknown>) {
    const res = await fetch(`/api/recoleccion/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) })
    if (res.ok) { setToast({ message: 'Guardado', type: 'success' }); load() }
    else setToast({ message: 'Error al guardar', type: 'error' })
    setEditTarget(null)
  }

  const counts  = items.reduce((a, i) => { a[i.estado] = (a[i.estado] || 0) + 1; return a }, {} as Record<string, number>)
  const visible = items.filter(i => {
    const q = search.toLowerCase()
    const nameMatch = !q || (i.empresas?.nombre || i.empresa_nombre_raw || '').toLowerCase().includes(q) || (i.mensaje_raw || '').toLowerCase().includes(q)
    const stateMatch = filter === 'TODOS' || i.estado === filter
    return nameMatch && stateMatch
  })

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Registros</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? '…' : `${items.length} registros totales · ${counts['PENDIENTE'] || 0} pendientes`}
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input
            type="search" placeholder="Buscar empresa o mensaje…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-64 outline-none transition-all"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e  => (e.target.style.borderColor = 'var(--green-400)')}
            onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </motion.div>

      {/* ── Filter tabs ───────────────────────────────────── */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map(f => {
          const active = filter === f
          const count  = f === 'TODOS' ? items.length : (counts[f] || 0)
          const style  = ESTADO_STYLE[f]
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: active ? (style?.bg || 'var(--green-50)') : 'var(--surface)',
                color:      active ? (style?.color || 'var(--green-600)') : 'var(--text-secondary)',
                border:     `1px solid ${active ? (style?.bg || 'var(--green-100)') : 'var(--border)'}`,
              }}>
              {f === 'TODOS' ? 'Todos' : (style?.text ?? f)}
              <span className="text-[11px] px-1.5 py-0.5 rounded-md font-bold"
                style={{ background: active ? 'rgba(0,0,0,.08)' : 'var(--gray-100)', color: active ? 'inherit' : 'var(--text-muted)' }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Table ─────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton flex-1 h-3.5" />
              <div className="skeleton w-20 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Sin registros</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {search ? `No hay coincidencias para "${search}"` : 'No hay registros en esta categoría.'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
          {/* Table header */}
          <div className="grid items-center px-5 py-3" style={{
            gridTemplateColumns: '220px 1fr auto auto auto',
            borderBottom: '1px solid var(--border)',
            background: 'var(--gray-50)',
          }}>
            {['Empresa', 'Materiales extraídos', 'Confianza IA', 'Estado', ''].map(h => (
              <span key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          <AnimatePresence initial={false}>
            {visible.map((r, i) => {
              const empresa   = r.empresas?.nombre || r.empresa_nombre_raw || null
              const conf      = confLevel(r.ia_confidence)
              const confStyle = CONF_LABEL[conf]
              const estado    = ESTADO_STYLE[r.estado] ?? { text: r.estado, color: 'var(--gray-500)', bg: 'var(--gray-100)' }
              const isExterno = !r.empresa_id && !!r.empresa_nombre_raw

              return (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="group"
                  style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none' }}
                >
                  <div
                    className="grid items-start px-5 py-4 transition-colors cursor-pointer"
                    style={{ gridTemplateColumns: '220px 1fr auto auto auto' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}
                  >
                    {/* Empresa */}
                    <div className="flex items-start gap-2.5 pr-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                        style={{ background: isExterno ? 'var(--amber-500)' : 'var(--green-600)' }}>
                        {(empresa || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {empresa ?? <em className="font-normal" style={{ color: 'var(--text-muted)' }}>Sin empresa</em>}
                        </p>
                        <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                          {isExterno && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>EXTERNO</span>}
                        </p>
                      </div>
                    </div>

                    {/* Materiales — lo nuevo: muestra múltiples */}
                    <div className="pr-4">
                      {r.mensaje_raw && (
                        <p className="text-[12.5px] truncate mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                          "{r.mensaje_raw.slice(0, 80)}{r.mensaje_raw.length > 80 ? '…' : ''}"
                        </p>
                      )}
                      {r.detalle_recoleccion && r.detalle_recoleccion.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.detalle_recoleccion.map((d, j) => (
                            <span key={j} className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2 py-0.5 rounded-md"
                              style={{ background: 'var(--green-50)', color: 'var(--green-700)', border: '1px solid var(--green-100)' }}>
                              {d.materiales?.nombre ?? 'Material'} · {d.cantidad} kg
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>Sin detalle extraído</span>
                      )}
                    </div>

                    {/* Confianza */}
                    <div className="flex items-start pt-0.5 px-3">
                      <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: confStyle.bg, color: confStyle.color }}>
                        {r.ia_confidence ? `${Math.round(r.ia_confidence * 100)}%` : '—'}
                      </span>
                    </div>

                    {/* Estado */}
                    <div className="flex items-start pt-0.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: estado.bg, color: estado.color }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: estado.color }} />
                        {estado.text}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-start gap-1 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditTarget(r)} title="Editar"
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--gray-400)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--green-50)'; (e.currentTarget as HTMLElement).style.color = 'var(--green-600)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                        </svg>
                      </button>
                      <button onClick={() => setDeleteId(r.id)} title="Eliminar"
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: 'var(--gray-400)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--error-bg)'; (e.currentTarget as HTMLElement).style.color = 'var(--error)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 011.49.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.74-1.575l-.66-6.6a.75.75 0 011.491-.15z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Edit modal ───────────────────────────────────── */}
      <AnimatePresence>
        {editTarget && <EditModal recoleccion={editTarget} onSave={handleSave} onClose={() => setEditTarget(null)} />}
      </AnimatePresence>

      {/* ── Delete confirm ───────────────────────────────── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              style={{ boxShadow: 'var(--shadow-lg)' }}>
              <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>Eliminar registro</h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Esta acción es permanente e irreversible.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-xl disabled:opacity-40"
                  style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-40"
                  style={{ background: 'var(--error)' }}>
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
