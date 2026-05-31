'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Recoleccion } from './page'

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO']
const ESTADO_STYLES: Record<string, { color: string; bg: string; activeBg: string }> = {
  PENDIENTE:   { color: 'var(--a-600)', bg: 'var(--a-50)',  activeBg: 'var(--a-500)' },
  EN_REVISION: { color: '#0284c7',       bg: '#e0f2fe',      activeBg: '#0284c7' },
  APROBADO:    { color: 'var(--f-600)', bg: 'var(--f-75)',  activeBg: 'var(--f-600)' },
  RECHAZADO:   { color: '#dc2626',       bg: '#fff1f1',      activeBg: '#dc2626' },
}

const inputStyle = {
  background: 'var(--n-50)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
  transition: 'border-color 150ms',
}

interface Props {
  recoleccion: Recoleccion
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

export default function EditModal({ recoleccion: r, onSave, onClose }: Props) {
  const [estado,     setEstado]     = useState(r.estado)
  const [mensajeRaw, setMensajeRaw] = useState(r.mensaje_raw || '')
  const [notas,      setNotas]      = useState(r.notas || '')
  const [imagenUrl,  setImagenUrl]  = useState(r.imagen_url || '')
  const [saving,     setSaving]     = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(r.id, {
      estado,
      mensaje_raw: mensajeRaw || null,
      notas:       notas      || null,
      imagen_url:  imagenUrl  || null,
    })
    setSaving(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,31,20,.35)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-[14.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Editar recolección
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {r.empresas?.nombre ?? 'Sin empresa'} ·{' '}
              {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'var(--n-400)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--n-100)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Estado */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Estado
            </label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(e => {
                const s      = ESTADO_STYLES[e]
                const active = estado === e
                return (
                  <button
                    key={e}
                    onClick={() => setEstado(e)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? s.activeBg : s.bg,
                      color:      active ? '#fff' : s.color,
                      border:     active ? `1px solid ${s.activeBg}` : `1px solid transparent`,
                    }}
                  >
                    {e === 'EN_REVISION' ? 'En revisión' : e.charAt(0) + e.slice(1).toLowerCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Mensaje del recolector
            </label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={3}
              value={mensajeRaw}
              onChange={e => setMensajeRaw(e.target.value)}
              placeholder="Texto del mensaje original..."
              onFocus={e  => (e.target.style.borderColor = 'var(--f-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>

          {/* URL imagen */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--text-muted)' }}>
              URL de imagen
            </label>
            <input
              style={inputStyle}
              value={imagenUrl}
              onChange={e => setImagenUrl(e.target.value)}
              placeholder="https://..."
              onFocus={e  => (e.target.style.borderColor = 'var(--f-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
            />
            {imagenUrl && (
              <a href={imagenUrl} target="_blank" rel="noopener noreferrer"
                className="text-[12px] mt-1.5 inline-block"
                style={{ color: 'var(--f-600)' }}>
                Ver imagen →
              </a>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-[0.07em] mb-2" style={{ color: 'var(--text-muted)' }}>
              Notas internas
            </label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={2}
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones adicionales..."
              onFocus={e  => (e.target.style.borderColor = 'var(--f-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--n-50)' }}>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-[13px] font-medium rounded-xl transition-all"
            style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--n-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all active:scale-[.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--f-600)' }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = 'var(--f-700)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--f-600)' }}
          >
            {saving ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Guardando…
              </>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
