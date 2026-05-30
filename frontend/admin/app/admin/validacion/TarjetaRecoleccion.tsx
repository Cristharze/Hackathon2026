'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { VistaPendiente } from '@/lib/types'

interface Props {
  recoleccion: VistaPendiente
  onAprobar: (id: string, correcciones: Record<string, unknown>) => Promise<void>
  onRechazar: (id: string, motivo: string) => Promise<void>
}

function ConfidenceBadge({ valor }: { valor: number | null }) {
  if (valor === null) return null
  const pct = Math.round(valor * 100)
  const cfg =
    valor >= 0.8
      ? { label: 'Alta confianza', bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' }
      : valor >= 0.5
      ? { label: 'Confianza media', bar: 'bg-amber-400', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' }
      : { label: 'Baja confianza', bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' }

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${cfg.bg}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
          <span className={`text-xs font-bold tabular-nums ${cfg.text}`}>{pct}%</span>
        </div>
        <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className={`h-full ${cfg.bar} rounded-full`}
          />
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all'

export default function TarjetaRecoleccion({ recoleccion: r, onAprobar, onRechazar }: Props) {
  const [material, setMaterial] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [empresa, setEmpresa] = useState(r.empresa || '')
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [busy, setBusy] = useState(false)

  const accentColor =
    (r.ia_confidence ?? 0) >= 0.8
      ? 'from-emerald-500'
      : (r.ia_confidence ?? 0) >= 0.5
      ? 'from-amber-400'
      : 'from-rose-500'

  async function handleAprobar() {
    setBusy(true)
    try {
      const correcciones: Record<string, unknown> = {}
      if (material) correcciones.material = material
      if (cantidad) correcciones.cantidad = parseFloat(cantidad)
      if (empresa) correcciones.empresa = empresa
      await onAprobar(r.id, correcciones)
    } finally {
      setBusy(false)
    }
  }

  async function handleRechazar() {
    if (!motivo.trim()) return
    setBusy(true)
    try {
      await onRechazar(r.id, motivo)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Top accent line */}
      <div className={`h-0.5 bg-gradient-to-r ${accentColor} to-transparent`} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-500">
              <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-sm leading-none">{r.empresa || 'Empresa desconocida'}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
          PENDIENTE
        </span>
      </div>

      {/* Body */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mensaje original */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Mensaje del recolector
          </p>
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 min-h-[72px]">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {r.mensaje_raw || <span className="italic text-slate-400">Sin texto adjunto</span>}
            </p>
          </div>
          {r.imagen_url && (
            <a href={r.imagen_url} target="_blank" rel="noopener noreferrer" className="block group">
              <div className="relative overflow-hidden rounded-xl border border-slate-200">
                <img
                  src={r.imagen_url}
                  alt="Foto recolección"
                  className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium bg-black/60 px-2 py-1 rounded-lg">
                    Ver imagen
                  </span>
                </div>
              </div>
            </a>
          )}
        </div>

        {/* Extracción IA */}
        <div className="space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Extracción IA — editable
          </p>

          <ConfidenceBadge valor={r.ia_confidence} />

          <div className="space-y-2.5">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Empresa detectada</label>
              <input className={inputCls} value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Nombre de empresa" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 mb-1">Material</label>
                <input className={inputCls} value={material} onChange={e => setMaterial(e.target.value)} placeholder="Ej: Plástico PET" />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad (kg)</label>
                <input type="number" className={inputCls} value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder="0.0" />
              </div>
            </div>
            {r.notas && (
              <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2">
                {r.notas}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-5">
        <AnimatePresence mode="wait">
          {rechazando ? (
            <motion.div
              key="rechazar"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex gap-3 items-start"
            >
              <textarea
                className="flex-1 bg-slate-50 border border-rose-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all resize-none"
                placeholder="Describe el motivo del rechazo..."
                rows={2}
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
              />
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  disabled={busy || !motivo.trim()}
                  onClick={handleRechazar}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      Procesando
                    </span>
                  ) : 'Confirmar'}
                </button>
                <button
                  onClick={() => setRechazando(false)}
                  className="px-4 py-2.5 text-slate-600 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex gap-3"
            >
              <button
                disabled={busy}
                onClick={handleAprobar}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-all shadow-sm shadow-emerald-600/20"
              >
                {busy ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                  </svg>
                )}
                {busy ? 'Procesando...' : 'Aprobar'}
              </button>
              <button
                disabled={busy}
                onClick={() => setRechazando(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 text-sm font-semibold rounded-xl disabled:opacity-40 transition-all"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                Rechazar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
