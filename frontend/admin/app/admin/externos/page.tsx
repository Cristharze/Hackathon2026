'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Externo {
  id: string
  nombre: string
  total_kg: number
  primera_vez: string
  ultima_vez: string
}

export default function ExternosPage() {
  const [data,    setData]    = useState<Externo[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    fetch('/api/externos', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const maxKg    = Math.max(...data.map(e => e.total_kg || 0), 1)
  const filtered = data.filter(e => !search || e.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalKg  = data.reduce((s, e) => s + (e.total_kg || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Externos</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Empresas que contribuyen vía WhatsApp pero no están registradas como aliadas
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

      {/* Info banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center gap-3 px-5 py-4 rounded-xl" style={{ background: 'var(--amber-50)', border: '1px solid var(--amber-100)' }}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0" style={{ color: 'var(--amber-500)' }}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"/>
          </svg>
          <p className="text-[13.5px]" style={{ color: 'var(--amber-800)' }}>
            Estos contribuyentes envían recolecciones pero no están en el sistema de empresas aliadas.
            Considera registrarlos formalmente para mejorar la trazabilidad.
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      {!loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-4 flex-wrap">
          {[
            { label: 'Externos únicos',  value: data.length },
            { label: 'Kg total aportados', value: `${totalKg.toFixed(0)} kg` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl px-5 py-4 flex items-center gap-4"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <p className="text-[24px] font-bold tabular" style={{ color: 'var(--amber-500)' }}>{s.value}</p>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton w-8 h-8 rounded-lg" /><div className="skeleton flex-1 h-3.5" /><div className="skeleton w-20 h-3.5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[28px] mb-2">🌱</p>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            {search ? `Sin coincidencias para "${search}"` : 'Sin contribuyentes externos'}
          </p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {!search && 'Todas las recolecciones provienen de empresas registradas.'}
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>

          <div className="grid px-5 py-3" style={{
            gridTemplateColumns: '1fr 140px 120px 120px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--gray-50)',
          }}>
            {['Empresa', 'Volumen total', 'Primera vez', 'Última vez'].map(h => (
              <span key={h} className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{h}</span>
            ))}
          </div>

          {filtered.map((e, i) => {
            const pct = ((e.total_kg || 0) / maxKg) * 100
            return (
              <motion.div key={e.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18 + i * 0.03 }}
                className="group"
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <div
                  className="grid items-center px-5 py-4 transition-colors"
                  style={{ gridTemplateColumns: '1fr 140px 120px 120px' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--gray-50)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  {/* Nombre */}
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                      style={{ background: 'var(--amber-500)' }}>
                      {e.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{e.nombre}</p>
                      {/* Mini bar */}
                      <div className="mt-1 h-1 rounded-full w-24 overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, delay: 0.2 + i * 0.03 }}
                          className="h-full rounded-full" style={{ background: 'var(--amber-400)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Kg */}
                  <span className="text-[14px] font-bold tabular" style={{ color: 'var(--amber-600)' }}>
                    {(e.total_kg || 0).toFixed(0)} kg
                  </span>

                  {/* Primera vez */}
                  <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {e.primera_vez ? new Date(e.primera_vez).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </span>

                  {/* Última vez */}
                  <span className="text-[12.5px]" style={{ color: 'var(--text-secondary)' }}>
                    {e.ultima_vez ? new Date(e.ultima_vez).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
