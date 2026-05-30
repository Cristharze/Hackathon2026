'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface Rec {
  id: string
  estado: string
  fecha_recoleccion: string
  mensaje_raw: string | null
  notas: string | null
  ia_confidence: number | null
  extraido_por_ia: boolean
  imagen_url: string | null
}

const ESTADO_CFG: Record<string, string> = {
  PENDIENTE:   'bg-amber-50 text-amber-700 border border-amber-200',
  APROBADO:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  RECHAZADO:   'bg-rose-50 text-rose-700 border border-rose-200',
  EN_REVISION: 'bg-sky-50 text-sky-700 border border-sky-200',
}

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', EN_REVISION: 'En revisión',
}

const FILTROS = ['TODOS', 'PENDIENTE', 'APROBADO', 'RECHAZADO']

function ConfBadge({ v }: { v: number | null }) {
  if (v === null) return <span className="text-slate-300 text-xs">—</span>
  const pct = Math.round(v * 100)
  const cls = v >= 0.8 ? 'bg-emerald-100 text-emerald-700' : v >= 0.5 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${cls}`}>{pct}%</span>
}

export default function EmpresaRecolecciones() {
  const { profile }   = useAuth()
  const [items, setItems]   = useState<Rec[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!profile?.empresa_id) { setLoading(false); return }
    fetch(`/api/empresa/recolecciones?empresa_id=${profile.empresa_id}`)
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [profile])

  const filtered = items.filter(r => {
    if (filtro !== 'TODOS' && r.estado !== filtro) return false
    if (search) {
      const q = search.toLowerCase()
      return (r.mensaje_raw ?? '').toLowerCase().includes(q) || (r.notas ?? '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mis recolecciones</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? '...' : `${items.length} registros en total`}
          </p>
        </div>
        {/* Search */}
        <div className="relative">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search" placeholder="Buscar mensaje..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all w-52"
          />
        </div>
      </motion.div>

      {/* Filter tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 mb-5 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filtro === f
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            {f === 'TODOS' ? 'Todos' : ESTADO_LABELS[f]}
            {f !== 'TODOS' && (
              <span className={`ml-1.5 ${filtro === f ? 'text-white/70' : 'text-slate-400'}`}>
                {items.filter(r => r.estado === f).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Table */}
      {loading ? <TableSkeleton rows={6} /> : filtered.length === 0 ? (
        <EmptyState
          title="Sin recolecciones"
          description={filtro !== 'TODOS' || search ? 'Sin resultados para los filtros aplicados.' : 'Aún no hay recolecciones registradas para tu empresa.'}
        />
      ) : (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  {['Fecha', 'Mensaje', 'Notas IA', 'Confianza', 'Estado'].map((h, i) => (
                    <th key={h} className={`text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-5 py-3.5 text-left ${i === 1 ? 'hidden md:table-cell' : ''} ${i === 2 ? 'hidden lg:table-cell' : ''}`}>{h}</th>
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
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-xs">
                        {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-slate-600 truncate max-w-xs text-xs">{r.mensaje_raw || <span className="text-slate-300 italic">Sin mensaje</span>}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <p className="text-slate-500 truncate max-w-[200px] text-xs">{r.notas || <span className="text-slate-300">—</span>}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <ConfBadge v={r.ia_confidence} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ESTADO_CFG[r.estado] || 'bg-slate-100 text-slate-500'}`}>
                          {ESTADO_LABELS[r.estado] ?? r.estado}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
