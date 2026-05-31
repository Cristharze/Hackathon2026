'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Material { nombre: string; kg: number; color: string }
interface Externo {
  id: string; nombre: string; total_kg: number
  primera_vez: string; ultima_vez: string
  materiales: Material[]
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

  const filtered = data.filter(e => !search || e.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalKg  = data.reduce((s, e) => s + (e.total_kg || 0), 0)

  function fmt(fecha: string) {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Externos</h1>
          <p className="text-[14px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Empresas que reciclan vía WhatsApp pero no están registradas como aliadas
          </p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--gray-400)' }}>
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/>
          </svg>
          <input type="search" placeholder="Buscar empresa…" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-56 outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={e => (e.target.style.borderColor = '#1e9070')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
        </div>
      </motion.div>

      {/* Banner */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-start gap-3 px-5 py-4 rounded-xl"
        style={{ background: 'var(--warning-bg)', border: '1px solid #fcd34d' }}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"/>
        </svg>
        <p className="text-[13.5px]" style={{ color: '#92400e' }}>
          Estos contribuyentes envían recolecciones por WhatsApp pero <strong>no están registrados como empresas aliadas</strong>.
          Considerá invitarlos formalmente para mejorar la trazabilidad y el impacto reportado.
        </p>
      </motion.div>

      {/* Stats rápidos */}
      {!loading && data.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex gap-4 flex-wrap">
          {[
            { label: 'Externos registrados', value: data.length, color: '#d97706' },
            { label: 'Kg totales aportados', value: `${totalKg.toFixed(0)} kg`, color: '#1e9070' },
            { label: 'Tipos de material',    value: new Set(data.flatMap(e => e.materiales.map(m => m.nombre))).size, color: '#7c3aed' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl px-5 py-4 flex items-center gap-4"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>
              <p className="text-[24px] font-bold tabular" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Lista de externos */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl h-28 skeleton" style={{ border: '1px solid var(--border)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl py-16 text-center" style={{ border: '1px solid var(--border)' }}>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--text)' }}>
            {search ? `Sin coincidencias para "${search}"` : 'Sin contribuyentes externos'}
          </p>
          <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
            {!search && 'Todas las recolecciones provienen de empresas aliadas registradas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e, i) => (
            <motion.div key={e.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.04 }}
              className="bg-white rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}>

              {/* Header del externo */}
              <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: e.materiales.length > 0 ? '1px solid var(--border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                    style={{ background: '#d97706' }}>
                    {e.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{e.nombre}</p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Primera vez: {fmt(e.primera_vez)} · Última: {fmt(e.ultima_vez)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[20px] font-bold tabular" style={{ color: '#d97706' }}>
                    {(e.total_kg || 0).toFixed(0)} kg
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>total aportado</p>
                </div>
              </div>

              {/* Materiales con barras */}
              {e.materiales.length > 0 && (
                <div className="px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                    Materiales reciclados
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {e.materiales.map(mat => {
                      const pct = e.total_kg > 0 ? (mat.kg / e.total_kg) * 100 : 0
                      return (
                        <div key={mat.nombre} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: mat.color }} />
                              <span className="text-[12.5px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {mat.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12.5px] font-bold tabular" style={{ color: 'var(--text)' }}>
                                {mat.kg} kg
                              </span>
                              <span className="text-[10.5px]" style={{ color: 'var(--text-muted)' }}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                            <motion.div className="h-full rounded-full"
                              style={{ background: mat.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: 0.2 + i * 0.04 }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {e.materiales.length === 0 && (
                <div className="px-5 py-3">
                  <p className="text-[12.5px] italic" style={{ color: 'var(--text-muted)' }}>
                    Sin detalle de materiales registrado
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
