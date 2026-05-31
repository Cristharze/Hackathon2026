'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface Empresa {
  id: string; nombre: string; sector: string | null
  ciudad: string | null; email: string | null; contacto: string | null; activa: boolean
}
interface Detalle { cantidad: number; materiales?: { nombre: string } }
interface Recoleccion {
  id: string; estado: string; fecha_recoleccion: string
  mensaje_raw: string | null; ia_confidence: number | null
  notas: string | null; imagen_url: string | null
  detalle_recoleccion?: Detalle[]
}

const CONF_LEVEL = (v: number | null) => !v ? 'low' : v >= 0.8 ? 'high' : v >= 0.5 ? 'medium' : 'low'
const CONF_STYLE = {
  high:   { label: 'Alta',  color: '#16a34a', bg: '#dcfce7' },
  medium: { label: 'Media', color: '#d97706', bg: '#fef3c7' },
  low:    { label: 'Baja',  color: '#dc2626', bg: '#fee2e2' },
}
const ESTADO_S: Record<string, { text: string; color: string; bg: string }> = {
  APROBADO:  { text: 'Aprobado',  color: '#16a34a', bg: '#dcfce7' },
  RECHAZADO: { text: 'Rechazado', color: '#dc2626', bg: '#fee2e2' },
}

function Skeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-5 w-28" />
      <div className="bg-white rounded-xl p-6 space-y-4" style={{ border: '1px solid var(--border)' }}>
        <div className="skeleton h-6 w-48" /><div className="skeleton h-4 w-32" />
        <div className="flex gap-3 mt-2">
          <div className="skeleton h-16 w-28 rounded-xl" />
          <div className="skeleton h-16 w-28 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="skeleton flex-1 h-3.5" /><div className="skeleton w-20 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EmpresaDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [empresa,       setEmpresa]       = useState<Empresa | null>(null)
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([])
  const [loading,       setLoading]       = useState(true)
  const [deleteId,      setDeleteId]      = useState<string | null>(null)
  const [deleting,      setDeleting]      = useState(false)
  const [toast,         setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [search,        setSearch]        = useState('')
  const [filter,        setFilter]        = useState<'TODOS' | 'APROBADO' | 'RECHAZADO'>('TODOS')

  const loadRecolecciones = useCallback(async () => {
    const res  = await fetch(`/api/empresa/recolecciones?empresa_id=${id}`, { cache: 'no-store' })
    const data = await res.json()
    setRecolecciones(Array.isArray(data) ? data : [])
  }, [id])

  useEffect(() => {
    Promise.all([
      fetch(`/api/empresa/${id}`).then(r => r.json()),
      fetch(`/api/empresa/recolecciones?empresa_id=${id}`, { cache: 'no-store' }).then(r => r.json()),
    ]).then(([emp, recs]) => {
      setEmpresa(emp.empresa ?? null)
      setRecolecciones(Array.isArray(recs) ? recs : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const interval = setInterval(loadRecolecciones, 30000)
    const ch = supabase
      .channel(`recolecciones-admin-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recolecciones', filter: `empresa_id=eq.${id}` }, loadRecolecciones)
      .subscribe()
    return () => { clearInterval(interval); supabase.removeChannel(ch) }
  }, [id, loadRecolecciones])

  async function handleDelete(rid: string) {
    setDeleting(true)
    const res = await fetch(`/api/recoleccion/${rid}`, { method: 'DELETE' })
    if (res.ok) {
      setRecolecciones(p => p.filter(r => r.id !== rid))
      setToast({ msg: 'Registro eliminado', ok: true })
    } else {
      setToast({ msg: 'Error al eliminar', ok: false })
    }
    setDeleting(false)
    setDeleteId(null)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  if (loading) return <Skeleton />
  if (!empresa) return (
    <div className="text-center py-16 text-[14px]" style={{ color: 'var(--text-muted)' }}>
      Empresa no encontrada
    </div>
  )

  const visible = recolecciones.filter(r => {
    const q = search.toLowerCase()
    const matchQ = !q || (r.mensaje_raw ?? '').toLowerCase().includes(q) ||
      (r.detalle_recoleccion ?? []).some(d => (d.materiales?.nombre ?? '').toLowerCase().includes(q))
    const matchF = filter === 'TODOS' || r.estado === filter
    return matchQ && matchF
  })

  const counts = recolecciones.reduce((a, r) => { a[r.estado] = (a[r.estado] || 0) + 1; return a }, {} as Record<string, number>)

  const FILTERS = [
    { key: 'TODOS',     label: 'Todos',      count: recolecciones.length },
    { key: 'APROBADO',  label: 'Aprobados',  count: counts['APROBADO']  || 0 },
    { key: 'RECHAZADO', label: 'Rechazados', count: counts['RECHAZADO'] || 0 },
  ] as const

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-[13px]">
        <Link href="/admin/empresas" className="flex items-center gap-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Empresas Aliadas
        </Link>
        <span style={{ color: 'var(--gray-300)' }}>/</span>
        <span className="font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{empresa.nombre}</span>
      </motion.div>

      {/* Header empresa */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'var(--teal-700)' }}>
              {empresa.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>{empresa.nombre}</h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {[empresa.sector, empresa.ciudad].filter(Boolean).join(' · ')}
              </p>
              {empresa.email && <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{empresa.email}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)' }}>
              <p className="text-[22px] font-bold tabular" style={{ color: 'var(--teal-800)' }}>{recolecciones.length}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: 'var(--teal-700)' }}>recolecciones</p>
            </div>
            <div className="text-center px-5 py-3 rounded-xl" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <p className="text-[22px] font-bold tabular" style={{ color: '#15803d' }}>{counts['APROBADO'] || 0}</p>
              <p className="text-[11px] font-medium mt-0.5" style={{ color: '#166534' }}>aprobadas</p>
            </div>
          </div>
        </div>
        <div className="mt-5 pt-5 flex gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link href={`/admin/reporte/${id}`}
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white px-4 py-2.5 rounded-xl transition-all active:scale-95"
            style={{ background: 'var(--teal-700)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-800)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--teal-700)')}>
            Ver reporte anual →
          </Link>
        </div>
      </motion.div>

      {/* Filtros + búsqueda */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}
        className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => {
            const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
                className="flex items-center gap-1.5 text-[12.5px] font-medium px-3.5 py-1.5 rounded-lg transition-all"
                style={{
                  background: active ? 'var(--teal-700)' : 'var(--surface)',
                  color:      active ? '#fff' : 'var(--text-secondary)',
                  border:     `1px solid ${active ? 'var(--teal-700)' : 'var(--border)'}`,
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
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input type="search" placeholder="Buscar material o mensaje…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-56 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
        </div>
      </motion.div>

      {/* Tabla de registros */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>

        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Registros de recolección</h2>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{visible.length} registros</span>
        </div>

        {visible.length === 0 ? (
          <p className="text-[13px] text-center py-12" style={{ color: 'var(--text-muted)' }}>
            {search || filter !== 'TODOS' ? 'Sin resultados para los filtros aplicados.' : 'Sin recolecciones registradas.'}
          </p>
        ) : (
          <>
            {/* Header tabla */}
            <div className="grid px-5 py-3 text-[11px] font-semibold uppercase tracking-wide"
              style={{ gridTemplateColumns: '120px 1fr 90px 110px 48px', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
              <span>Fecha</span>
              <span>Materiales / Mensaje</span>
              <span>Confianza</span>
              <span>Estado</span>
              <span></span>
            </div>

            <AnimatePresence initial={false}>
              {visible.map((r, i) => {
                const es   = ESTADO_S[r.estado] ?? { text: r.estado, color: 'var(--gray-500)', bg: 'var(--gray-100)' }
                const conf = CONF_STYLE[CONF_LEVEL(r.ia_confidence)]
                const mats = r.detalle_recoleccion?.filter(d => d.cantidad > 0) ?? []

                return (
                  <motion.div key={r.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="group" style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div className="grid items-start px-5 py-4 transition-colors"
                      style={{ gridTemplateColumns: '120px 1fr 90px 110px 48px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}>

                      {/* Fecha */}
                      <div className="pt-0.5">
                        <p className="text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>

                      {/* Materiales / Mensaje */}
                      <div className="pr-4">
                        {mats.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {mats.map((d, j) => (
                              <span key={j} className="text-[11.5px] font-medium px-2 py-0.5 rounded-md"
                                style={{ background: '#e8f5ec', color: '#1e9070', border: '1px solid #c3e6cd' }}>
                                {d.materiales?.nombre ?? 'Material'} · {d.cantidad} kg
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[12px] truncate max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                            {r.mensaje_raw ?? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin mensaje</span>}
                          </p>
                        )}
                        {r.notas && (
                          <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>{r.notas}</p>
                        )}
                      </div>

                      {/* Confianza */}
                      <div className="flex items-start pt-0.5">
                        <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: conf.bg, color: conf.color }}>
                          {r.ia_confidence ? `${Math.round(r.ia_confidence * 100)}%` : '—'}
                        </span>
                      </div>

                      {/* Estado */}
                      <div className="flex items-start pt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: es.bg, color: es.color }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: es.color }} />
                          {es.text}
                        </span>
                      </div>

                      {/* Acción eliminar */}
                      <div className="flex items-center justify-center pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setDeleteId(r.id)} title="Eliminar registro"
                          className="p-2 rounded-lg transition-all flex items-center justify-center"
                          style={{ color: 'var(--gray-400)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Modal confirmar eliminar */}
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

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: toast.ok ? '#16a34a' : '#dc2626', boxShadow: '0 4px 20px rgba(0,0,0,.2)' }}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
