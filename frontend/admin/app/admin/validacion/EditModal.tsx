'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Recoleccion } from './page'

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO']

const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all'

interface Props {
  recoleccion: Recoleccion
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

export default function EditModal({ recoleccion: r, onSave, onClose }: Props) {
  const [estado, setEstado] = useState(r.estado)
  const [mensajeRaw, setMensajeRaw] = useState(r.mensaje_raw || '')
  const [notas, setNotas] = useState(r.notas || '')
  const [imagenUrl, setImagenUrl] = useState(r.imagen_url || '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(r.id, {
      estado,
      mensaje_raw: mensajeRaw || null,
      notas: notas || null,
      imagen_url: imagenUrl || null,
    })
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">Editar recolección</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {r.empresas?.nombre || 'Sin empresa'} ·{' '}
              {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Estado</label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(e => (
                <button
                  key={e}
                  onClick={() => setEstado(e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    estado === e
                      ? e === 'APROBADO'   ? 'bg-emerald-600 text-white border-emerald-600'
                      : e === 'RECHAZADO'  ? 'bg-rose-600 text-white border-rose-600'
                      : e === 'PENDIENTE'  ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Mensaje del recolector</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              value={mensajeRaw}
              onChange={e => setMensajeRaw(e.target.value)}
              placeholder="Texto del mensaje original..."
            />
          </div>

          {/* URL imagen */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">URL de imagen</label>
            <input
              className={inputCls}
              value={imagenUrl}
              onChange={e => setImagenUrl(e.target.value)}
              placeholder="https://..."
            />
            {imagenUrl && (
              <a href={imagenUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 hover:underline mt-1 inline-block">
                Ver imagen →
              </a>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Notas internas</label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={2}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones adicionales..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
