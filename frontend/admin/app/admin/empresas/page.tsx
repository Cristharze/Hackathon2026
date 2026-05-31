'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const SECTORES = ['MANUFACTURA','SERVICIOS','COMERCIO','SALUD','EDUCACION','TECNOLOGIA','CONSTRUCCION','ALIMENTOS','OTRO']

interface Empresa {
  id: string; nombre: string; sector: string | null
  ciudad: string | null; contacto: string | null; email: string | null; activa: boolean
}

const SECTOR_COLORS: Record<string, { bg: string; color: string }> = {
  COMERCIO:      { bg: '#dbeafe', color: '#1d4ed8' },
  SALUD:         { bg: '#dcfce7', color: '#166534' },
  CONSTRUCCION:  { bg: '#fed7aa', color: '#9a3412' },
  TECNOLOGIA:    { bg: '#e9d5ff', color: '#6b21a8' },
  EDUCACION:     { bg: '#fef9c3', color: '#854d0e' },
  INDUSTRIA:     { bg: '#f3f4f6', color: '#374151' },
  ALIMENTACION:  { bg: '#ecfdf5', color: '#065f46' },
}
const sectorStyle = (s: string | null) => SECTOR_COLORS[s ?? ''] ?? { bg: 'var(--gray-100)', color: 'var(--gray-600)' }

export default function EmpresasPage() {
  const [empresas,   setEmpresas]   = useState<Empresa[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [sector,     setSector]     = useState('TODOS')
  const [editTarget, setEditTarget] = useState<Empresa | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [editSector, setEditSector] = useState('')
  const [editContacto, setEditContacto] = useState('')

  function openEdit(e: Empresa) {
    setEditTarget(e)
    setEditSector(e.sector || '')
    setEditContacto(e.contacto || '')
  }

  async function handleSave() {
    if (!editTarget) return
    setSaving(true)
    const res = await fetch(`/api/empresa-edit/${editTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector: editSector || null, contacto: editContacto || null }),
    })
    if (res.ok) {
      setEmpresas(prev => prev.map(e =>
        e.id === editTarget.id ? { ...e, sector: editSector || null, contacto: editContacto || null } : e
      ))
    }
    setSaving(false)
    setEditTarget(null)
  }

  useEffect(() => {
    fetch('/api/backend/empresas', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : fetch('/api/empresas').then(r2 => r2.json()))
      .then(d => { setEmpresas(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const sectors  = ['TODOS', ...Array.from(new Set(empresas.map(e => e.sector).filter(Boolean))) as string[]]
  const filtered = empresas.filter(e => {
    const q = search.toLowerCase()
    const nameOk = !q || e.nombre.toLowerCase().includes(q) || (e.ciudad || '').toLowerCase().includes(q)
    const secOk  = sector === 'TODOS' || e.sector === sector
    return nameOk && secOk
  })
  const activas   = empresas.filter(e => e.activa).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Empresas</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {loading ? '…' : `${empresas.length} registradas · ${activas} activas`}
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input type="search" placeholder="Buscar empresa…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-56 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
        </div>
      </motion.div>

      {/* Sector filters */}
      {sectors.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {sectors.map(s => (
            <button key={s} onClick={() => setSector(s)}
              className="text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: sector === s ? 'var(--teal-700)' : 'var(--surface)',
                color:      sector === s ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${sector === s ? 'var(--teal-700)' : 'var(--border)'}`,
              }}>
              {s === 'TODOS' ? 'Todos los sectores' : s}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton w-9 h-9 rounded-xl" /><div className="skeleton flex-1 h-3.5" /><div className="skeleton w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>Sin resultados</p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>No hay empresas que coincidan con tu búsqueda.</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>

          <div className="grid px-5 py-3" style={{ gridTemplateColumns: '1fr 120px 130px 130px 90px 44px', borderBottom: '1px solid var(--border)', background: 'var(--gray-50)' }}>
            {['Empresa', 'Sector', 'Ciudad', 'Contacto', 'Estado', ''].map(h => (
              <span key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</span>
            ))}
          </div>

          {filtered.map((e, i) => {
            const ss = sectorStyle(e.sector)
            return (
              <motion.div key={e.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }} className="group"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div
                  className="grid items-center px-5 py-3.5 transition-colors"
                  style={{ gridTemplateColumns: '1fr 120px 130px 130px 90px 44px' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                      style={{ background: 'var(--teal-700)' }}>
                      {e.nombre.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--text)' }}>{e.nombre}</span>
                  </div>
                  <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-md w-fit"
                    style={{ background: ss.bg, color: ss.color }}>
                    {e.sector || '—'}
                  </span>
                  <span className="text-[13px] pr-2" style={{ color: 'var(--text-secondary)' }}>{e.ciudad || '—'}</span>
                  <span className="text-[13px] truncate pr-2" style={{ color: 'var(--text-secondary)' }}>{e.contacto || e.email || '—'}</span>
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full w-fit"
                    style={{
                      background: e.activa ? 'var(--success-bg)' : 'var(--gray-100)',
                      color:      e.activa ? 'var(--success)'    : 'var(--gray-500)',
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: e.activa ? 'var(--success)' : 'var(--gray-400)' }} />
                    {e.activa ? 'Activa' : 'Inactiva'}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {/* Editar sector y contacto */}
                    <button onClick={() => openEdit(e)}
                      className="p-1.5 rounded-lg transition-all"
                      style={{ color: 'var(--gray-400)' }}
                      title="Editar sector y contacto"
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--teal-50)'; (ev.currentTarget as HTMLElement).style.color = 'var(--teal-700)' }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = ''; (ev.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z"/>
                      </svg>
                    </button>
                    {/* Ver detalle */}
                    <Link href={`/admin/empresas/${e.id}`}
                      className="p-1.5 rounded-lg flex items-center justify-center transition-all"
                      style={{ color: 'var(--gray-400)' }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--teal-50)'; (ev.currentTarget as HTMLElement).style.color = 'var(--teal-700)' }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = ''; (ev.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                      <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* ── Modal editar sector y contacto ───────────── */}
      <AnimatePresence>
        {editTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
            onClick={() => !saving && setEditTarget(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
              style={{ boxShadow: '0 8px 30px rgba(0,0,0,.15)' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Editar empresa</p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{editTarget.nombre}</p>
                </div>
                <button onClick={() => setEditTarget(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: 'var(--gray-400)' }}>
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
                    <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
                  </svg>
                </button>
              </div>

              {/* Campos */}
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Sector</label>
                  <select value={editSector} onChange={e => setEditSector(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none transition-all"
                    style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border)')}>
                    <option value="">— Sin sector —</option>
                    {SECTORES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>Contacto</label>
                  <input type="text" value={editContacto} onChange={e => setEditContacto(e.target.value)}
                    placeholder="Nombre del contacto"
                    className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none transition-all"
                    style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', color: 'var(--text)' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
                    onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-5 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
                <button onClick={() => setEditTarget(null)} disabled={saving}
                  className="flex-1 py-2.5 text-[13px] font-medium rounded-xl disabled:opacity-40 transition-colors"
                  style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
                  style={{ background: 'var(--teal-700)' }}>
                  {saving ? (
                    <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>Guardando…</>
                  ) : 'Guardar cambios'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
