'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Recoleccion } from './page'

const ESTADOS = ['PENDIENTE', 'EN_REVISION', 'APROBADO', 'RECHAZADO']

interface Props {
  recoleccion: Recoleccion
  onSave: (id: string, updates: Record<string, unknown>) => Promise<void>
  onClose: () => void
}

const inputStyle = {
  width: '100%',
  background: 'var(--gray-50)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '13px',
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color 150ms',
}

export default function EditModal({ recoleccion: r, onSave, onClose }: Props) {
  const [estado,  setEstado]  = useState(r.estado)
  const [msg,     setMsg]     = useState(r.mensaje_raw || '')
  const [notas,   setNotas]   = useState(r.notas || '')
  const [imgUrl,  setImgUrl]  = useState(r.imagen_url || '')
  const [saving,  setSaving]  = useState(false)

  async function handleSave() {
    setSaving(true)
    await onSave(r.id, { estado, mensaje_raw: msg || null, notas: notas || null, imagen_url: imgUrl || null })
    setSaving(false)
  }

  const empresa = r.empresas?.nombre || r.empresa_nombre_raw || 'Sin empresa'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden"
        style={{ boxShadow: 'var(--shadow-lg)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>Editar registro</h2>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {empresa} · {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO')}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100" style={{ color: 'var(--gray-400)' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Estado */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Estado</label>
            <div className="flex gap-2 flex-wrap">
              {ESTADOS.map(e => {
                const active = estado === e
                const colors: Record<string, { fg: string; bg: string }> = {
                  PENDIENTE:   { fg: 'var(--warning)', bg: 'var(--warning-bg)' },
                  EN_REVISION: { fg: 'var(--info)',    bg: 'var(--info-bg)' },
                  APROBADO:    { fg: 'var(--success)', bg: 'var(--success-bg)' },
                  RECHAZADO:   { fg: 'var(--error)',   bg: 'var(--error-bg)' },
                }
                const c = colors[e] || { fg: 'var(--text)', bg: 'var(--gray-100)' }
                return (
                  <button key={e} onClick={() => setEstado(e)}
                    className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? c.fg : c.bg,
                      color:      active ? '#fff' : c.fg,
                      border:     `1px solid ${active ? c.fg : 'transparent'}`,
                    }}>
                    {e === 'EN_REVISION' ? 'En revisión' : e.charAt(0) + e.slice(1).toLowerCase()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Mensaje</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} value={msg} onChange={e => setMsg(e.target.value)}
              placeholder="Mensaje del recolector…"
              onFocus={e  => (e.target.style.borderColor = 'var(--teal-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')} />
          </div>

          {/* Imagen URL */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>URL de imagen</label>
            <input style={inputStyle} value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://…"
              onFocus={e  => (e.target.style.borderColor = 'var(--teal-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')} />
            {imgUrl && <a href={imgUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] mt-1 inline-block hover:underline" style={{ color: 'var(--teal-700)' }}>Ver imagen →</a>}
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[11.5px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>Notas internas</label>
            <textarea style={{ ...inputStyle, resize: 'none' }} rows={2} value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones…"
              onFocus={e  => (e.target.style.borderColor = 'var(--teal-400)')}
              onBlur={e   => (e.target.style.borderColor = 'var(--border)')} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border)', background: 'var(--gray-50)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 text-[13px] font-medium rounded-xl transition-colors"
            style={{ background: '#fff', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 text-[13px] font-semibold text-white rounded-xl transition-all active:scale-[.98] disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--teal-700)' }}
            onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLElement).style.background = 'var(--teal-800)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal-700)' }}>
            {saving ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Guardando…</>
            ) : 'Guardar cambios'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
