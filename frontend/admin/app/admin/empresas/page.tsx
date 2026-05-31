'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Empresa } from '@/lib/types'
import Link from 'next/link'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    fetch('/api/empresas')
      .then(r => r.json())
      .then(d => { setEmpresas(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const filtered = empresas.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.ciudad  || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.sector  || '').toLowerCase().includes(search.toLowerCase())
  )

  const activas   = empresas.filter(e => e.activa).length
  const inactivas = empresas.length - activas

  return (
    <div className="max-w-5xl mx-auto px-1">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-6 flex-wrap gap-4"
      >
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Empresas aliadas
          </h1>
          {!loading && (
            <p className="text-[13.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {empresas.length} empresas · {activas} activas · {inactivas} inactivas
            </p>
          )}
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
            placeholder="Buscar empresa, ciudad..."
            className="pl-9 pr-4 py-2 text-[13px] rounded-xl w-60 transition-all outline-none"
            style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.target.style.borderColor = 'var(--f-400)')}
            onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>
      </motion.div>

      {error && (
        <div className="text-[13px] px-4 py-3 rounded-xl mb-5" style={{ background: '#fff1f1', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--n-50)' }}>
                {['Empresa', 'Sector', 'Ciudad', 'Contacto', 'Estado', ''].map((h, i) => (
                  <th
                    key={i}
                    className={`text-left text-[11px] font-semibold uppercase tracking-[0.07em] px-5 py-3.5 ${
                      i === 1 ? 'hidden sm:table-cell' :
                      i === 2 ? 'hidden sm:table-cell' :
                      i === 3 ? 'hidden lg:table-cell' : ''
                    }`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr
                  key={e.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="group transition-colors"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--n-50)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = '')}
                >
                  {/* Empresa */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                        style={{ background: 'var(--f-600)' }}
                      >
                        {e.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[13.5px] font-medium" style={{ color: 'var(--text-primary)' }}>
                        {e.nombre}
                      </span>
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="px-5 py-4 text-[13px] hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {e.sector || '—'}
                  </td>

                  {/* Ciudad */}
                  <td className="px-5 py-4 text-[13px] hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {e.ciudad || '—'}
                  </td>

                  {/* Contacto */}
                  <td className="px-5 py-4 text-[13px] hidden lg:table-cell" style={{ color: 'var(--text-secondary)' }}>
                    {e.contacto || e.email || '—'}
                  </td>

                  {/* Estado */}
                  <td className="px-5 py-4">
                    <span
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        color:      e.activa ? 'var(--f-600)' : 'var(--n-500)',
                        background: e.activa ? 'var(--f-75)'  : 'var(--n-75)',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: e.activa ? 'var(--f-500)' : 'var(--n-400)' }}
                      />
                      {e.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>

                  {/* Ver detalle */}
                  <td className="px-4 py-4 w-10">
                    <Link
                      href={`/admin/empresas/${e.id}`}
                      className="p-1.5 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: 'var(--n-400)' }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = 'var(--f-75)'; (ev.currentTarget as HTMLElement).style.color = 'var(--f-600)' }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = ''; (ev.currentTarget as HTMLElement).style.color = 'var(--n-400)' }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd"/>
                      </svg>
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="Sin resultados"
                      description={search ? `Sin coincidencias para "${search}"` : 'No hay empresas registradas.'}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
