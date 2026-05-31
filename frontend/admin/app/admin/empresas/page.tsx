'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

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
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [sector,   setSector]   = useState('TODOS')

  useEffect(() => {
    // Try backend first, fallback to Supabase proxy
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
            onFocus={e => (e.target.style.borderColor = 'var(--green-400)')}
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
                background: sector === s ? 'var(--green-600)' : 'var(--surface)',
                color:      sector === s ? '#fff' : 'var(--text-secondary)',
                border:     `1px solid ${sector === s ? 'var(--green-600)' : 'var(--border)'}`,
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
                      style={{ background: 'var(--green-600)' }}>
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
                  <Link href={`/admin/empresas/${e.id}`}
                    className="p-2 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                    style={{ color: 'var(--gray-400)' }}
                    onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--green-50)'; (ev.currentTarget as HTMLElement).style.color = 'var(--green-600)' }}
                    onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = ''; (ev.currentTarget as HTMLElement).style.color = 'var(--gray-400)' }}>
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                    </svg>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
