'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { Empresa } from '@/lib/types'
import Link from 'next/link'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/empresas')
      .then(r => r.json())
      .then(data => { setEmpresas(data); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const filtered = empresas.filter(e =>
    e.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (e.ciudad || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.sector || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Empresas Aliadas</h1>
          <p className="text-sm text-slate-500 mt-1">{loading ? '...' : `${empresas.length} empresas registradas`}</p>
        </div>
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search" placeholder="Buscar empresa..."
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all w-56"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </motion.div>

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl mb-6 text-sm">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {loading ? <TableSkeleton rows={6} /> : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Empresa', 'Sector', 'Ciudad', 'Contacto', 'Estado', ''].map((h, i) => (
                  <th key={i} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-6 py-3.5 text-left ${i > 3 ? '' : ''} ${i === 5 ? 'w-10' : ''} ${i >= 2 ? 'hidden sm:table-cell' : ''} ${i === 3 ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <motion.tr key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xs font-bold shrink-0">
                        {e.nombre.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-900">{e.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-500 hidden sm:table-cell">{e.sector || '—'}</td>
                  <td className="px-4 py-4 text-slate-500 hidden sm:table-cell">{e.ciudad || '—'}</td>
                  <td className="px-4 py-4 text-slate-500 hidden lg:table-cell">{e.contacto || e.email || '—'}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${e.activa ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${e.activa ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {e.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/admin/empresas/${e.id}`} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100" title="Ver detalle">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                    </Link>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6}>
                  <EmptyState title="Sin resultados" description={search ? `No se encontró "${search}"` : 'No hay empresas registradas.'} />
                </td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  )
}
