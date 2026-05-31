'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/ui/Toast'

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
  ia_confidence: number | null
  rechazado_motivo?: string | null
  created_at: string
  detalle_recoleccion?: { cantidad: number; materiales?: { nombre: string } }[]
}

const CONF_LEVEL = (v: number | null) => !v ? 'low' : v >= 0.8 ? 'high' : v >= 0.5 ? 'medium' : 'low'
const CONF_STYLE = {
  high:   { label: 'Alta',  color: '#16a34a', bg: '#dcfce7' },
  medium: { label: 'Media', color: '#d97706', bg: '#fef3c7' },
  low:    { label: 'Baja',  color: '#dc2626', bg: '#fee2e2' },
}

export default function RegistrosPage() {
  const [items,       setItems]       = useState<Recoleccion[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState<'TODOS' | 'APROBADO' | 'RECHAZADO'>('TODOS')
  const [rejectId,    setRejectId]    = useState<string | null>(null)
  const [rejectMotivo,setRejectMotivo]= useState('')
  const [rejecting,   setRejecting]   = useState(false)
  const [deleteId,    setDeleteId]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [toast,       setToast]       = useState<{ message: string; type: 'success' | 'error' } | null>(null)

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

  async function handleReject() {
    if (!rejectId || !rejectMotivo.trim()) return
    setRejecting(true)
    const res = await fetch(`/api/rechazar/${rejectId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo: rejectMotivo }),
    })
    if (res.ok) {
      setItems(p => p.map(i => i.id === rejectId ? { ...i, estado: 'RECHAZADO', rechazado_motivo: rejectMotivo } : i))
      setToast({ message: 'Recolección rechazada', type: 'success' })
    } else {
      setToast({ message: 'Error al rechazar', type: 'error' })
    }
    setRejecting(false); setRejectId(null); setRejectMotivo('')
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/recoleccion/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setItems(p => p.filter(i => i.id !== id))
      setToast({ message: 'Registro eliminado', type: 'success' })
    } else {
      setToast({ message: 'Error al eliminar', type: 'error' })
    }
    setDeleting(false); setDeleteId(null)
  }

  const counts   = items.reduce((a, i) => { a[i.estado] = (a[i.estado] || 0) + 1; return a }, {} as Record<string, number>)
  const visible  = items.filter(i => {
    const q = search.toLowerCase()
    const match = !q || (i.empresas?.nombre || i.empresa_nombre_raw || '').toLowerCase().includes(q) || (i.mensaje_raw || '').toLowerCase().includes(q)
    const st    = filter === 'TODOS' || i.estado === filter
    return match && st
  })

  const FILTERS = [
    { key: 'TODOS',     label: 'Todos',     count: items.length },
    { key: 'APROBADO',  label: 'Aprobados', count: counts['APROBADO']  || 0 },
    { key: 'RECHAZADO', label: 'Rechazados',count: counts['RECHAZADO'] || 0 },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Recolecciones</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? '…' : `${items.length} registros · el admin puede rechazar o eliminar`}
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input type="search" placeholder="Buscar empresa o mensaje…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-64 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = '#1e9070')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
        </div>
      </motion.div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTERS.map(f => {
          const active = filter === f.key
          return (
            <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-1.5 rounded-lg transition-all"
              style={{
                background: active ? '#1e9070' : 'var(--surface)',
                color:      active ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${active ? '#1e9070' : 'var(--border)'}`,
              }}>
              {f.label}
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                style={{ background: active ? 'rgba(255,255,255,.2)' : 'var(--gray-100)', color: active ? '#fff' : 'var(--text-muted)' }}>
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton w-8 h-8 rounded-lg" /><div className="skeleton flex-1 h-3.5" /><div className="skeleton w-20 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Sin registros</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {search ? `Sin resultados para "${search}"` : 'No hay recolecciones.'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>

          {/* Thead */}
          <div className="grid px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
            style={{ gridTemplateColumns: '200px 1fr auto auto auto', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
            <span>Empresa</span>
            <span className="hidden md:block">Materiales / Mensaje</span>
            <span>Confianza</span>
            <span>Estado</span>
            <span className="w-20"></span>
          </div>

          <AnimatePresence initial={false}>
            {visible.map((r, i) => {
              const empresa  = r.empresas?.nombre || r.empresa_nombre_raw || null
              const isExt    = !r.empresa_id && !!r.empresa_nombre_raw
              const conf     = CONF_STYLE[CONF_LEVEL(r.ia_confidence)]
              const aprobado = r.estado === 'APROBADO'

              return (
                <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="group border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="grid items-start px-5 py-4 transition-colors"
                    style={{ gridTemplateColumns: '200px 1fr auto auto auto' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>

                    {/* Empresa */}
                    <div className="flex items-start gap-2.5 pr-4">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
                        style={{ background: isExt ? '#d97706' : '#1e9070' }}>
                        {(empresa || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                          {empresa ?? <span style={{ color: 'var(--text-muted)' }}>Sin empresa</span>}
                        </p>
                        <p className="text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                          {isExt && <span className="ml-2 font-bold" style={{ color: '#d97706' }}>EXTERNO</span>}
                        </p>
                      </div>
                    </div>

                    {/* Materiales / mensaje */}
                    <div className="pr-4 hidden md:block">
                      {r.detalle_recoleccion && r.detalle_recoleccion.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {r.detalle_recoleccion.map((d, j) => (
                            <span key={j} className="text-[11.5px] font-medium px-2 py-0.5 rounded-md"
                              style={{ background: '#e8f5ec', color: '#1e9070', border: '1px solid #c3e6cd' }}>
                              {d.materiales?.nombre ?? 'Material'} · {d.cantidad} kg
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                          {r.mensaje_raw ?? '—'}
                        </p>
                      )}
                      {r.rechazado_motivo && (
                        <p className="text-[11.5px] mt-1 italic" style={{ color: '#dc2626' }}>
                          Motivo: {r.rechazado_motivo}
                        </p>
                      )}
                    </div>

                    {/* Confianza */}
                    <div className="flex items-start pt-0.5 px-3">
                      <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: conf.bg, color: conf.color }}>
                        {r.ia_confidence ? `${Math.round(r.ia_confidence * 100)}%` : '—'}
                      </span>
                    </div>

                    {/* Estado */}
                    <div className="flex items-start pt-0.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: aprobado ? '#dcfce7' : '#fee2e2',
                          color:      aprobado ? '#16a34a' : '#dc2626',
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: aprobado ? '#16a34a' : '#dc2626' }} />
                        {aprobado ? 'Aprobado' : 'Rechazado'}
                      </span>
                    </div>

                    {/* Acciones — solo admin: rechazar o eliminar */}
                    <div className="flex items-start gap-1 pt-0.5 w-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      {aprobado && (
                        <button onClick={() => { setRejectId(r.id); setRejectMotivo('') }}
                          title="Rechazar"
                          className="flex items-center gap-1 text-[11.5px] font-semibold px-2 py-1 rounded-lg transition-all"
                          style={{ color: '#dc2626', background: '#fee2e2' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fecaca')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fee2e2')}>
                          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z"/>
                          </svg>
                          Rechazar
                        </button>
                      )}
                      <button onClick={() => setDeleteId(r.id)} title="Eliminar"
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: 'var(--gray-400)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                          <path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75Zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.49.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.74-1.575l-.66-6.6a.75.75 0 1 1 1.491-.15Z"/>
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

      {/* Modal rechazar */}
      <AnimatePresence>
        {rejectId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => !rejecting && setRejectId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}>
              <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>Rechazar recolección</h3>
              <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>Indicá el motivo para que la empresa pueda corregirlo.</p>
              <textarea
                autoFocus
                rows={3}
                className="w-full rounded-xl px-3 py-2.5 text-[13px] outline-none resize-none transition-all"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', color: 'var(--text)' }}
                placeholder="Ej: Datos insuficientes, empresa no identificada..."
                value={rejectMotivo}
                onChange={e => setRejectMotivo(e.target.value)}
                onFocus={e => (e.target.style.borderColor = '#dc2626')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setRejectId(null)} disabled={rejecting}
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-xl disabled:opacity-40"
                  style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
                <button onClick={handleReject} disabled={rejecting || !rejectMotivo.trim()}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-40"
                  style={{ background: '#dc2626' }}>
                  {rejecting ? 'Rechazando…' : 'Confirmar rechazo'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal eliminar */}
      <AnimatePresence>
        {deleteId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => !deleting && setDeleteId(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}>
              <h3 className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>Eliminar registro</h3>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Esta acción es permanente e irreversible.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-xl disabled:opacity-40"
                  style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                  Cancelar
                </button>
                <button onClick={() => handleDelete(deleteId)} disabled={deleting}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-40 active:scale-95"
                  style={{ background: '#dc2626' }}>
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
