'use client'
import { useState } from 'react'
import type { VistaPendiente } from '@/lib/types'

interface Props {
  recoleccion: VistaPendiente
  onAprobar: (id: string, correcciones: Record<string, unknown>) => Promise<void>
  onRechazar: (id: string, motivo: string) => Promise<void>
}

function BarraConfianza({ valor }: { valor: number | null }) {
  if (valor === null) return null
  const pct = Math.round(valor * 100)
  const color = valor >= 0.8 ? 'bg-green-500' : valor >= 0.5 ? 'bg-yellow-400' : 'bg-red-500'
  const label = valor >= 0.8 ? 'Alta' : valor >= 0.5 ? 'Media' : 'Baja'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${
        valor >= 0.8 ? 'text-green-700' : valor >= 0.5 ? 'text-yellow-700' : 'text-red-700'
      }`}>
        {label} ({pct}%)
      </span>
    </div>
  )
}

export default function TarjetaRecoleccion({ recoleccion: r, onAprobar, onRechazar }: Props) {
  const [material, setMaterial] = useState(r.material || '')
  const [cantidad, setCantidad] = useState(r.cantidad?.toString() || '')
  const [empresa, setEmpresa] = useState(r.empresa_nombre || '')
  const [motivo, setMotivo] = useState('')
  const [rechazando, setRechazando] = useState(false)
  const [busy, setBusy] = useState(false)

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div>
          <span className="font-semibold text-gray-900">{r.empresa_nombre || 'Empresa desconocida'}</span>
          <span className="ml-3 text-sm text-gray-500">
            {new Date(r.fecha_recoleccion).toLocaleDateString('es-BO', {
              day: '2-digit', month: 'short', year: 'numeric'
            })}
          </span>
        </div>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">PENDIENTE</span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Mensaje original */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Mensaje del recolector</p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 whitespace-pre-wrap min-h-[60px]">
            {r.mensaje_raw || <span className="italic text-gray-400">Sin texto</span>}
          </p>
          {r.imagen_url && (
            <a href={r.imagen_url} target="_blank" rel="noopener noreferrer">
              <img
                src={r.imagen_url}
                alt="Foto recoleccion"
                className="mt-2 rounded-lg border border-gray-200 max-h-48 object-cover w-full"
              />
            </a>
          )}
        </div>

        {/* Extraccion IA + correcciones */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Extraccion IA — editable</p>
          <BarraConfianza valor={r.ia_confidence} />

          <div className="space-y-2">
            <label className="block">
              <span className="text-xs text-gray-500">Empresa detectada</span>
              <input
                className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                value={empresa}
                onChange={e => setEmpresa(e.target.value)}
              />
            </label>
            <div className="flex gap-2">
              <label className="flex-1 block">
                <span className="text-xs text-gray-500">Material</span>
                <input
                  className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={material}
                  onChange={e => setMaterial(e.target.value)}
                />
              </label>
              <label className="w-28 block">
                <span className="text-xs text-gray-500">Cantidad (kg)</span>
                <input
                  type="number"
                  className="mt-0.5 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={cantidad}
                  onChange={e => setCantidad(e.target.value)}
                />
              </label>
            </div>
            {r.notas && (
              <p className="text-xs text-gray-400 italic">{r.notas}</p>
            )}
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="px-5 pb-4">
        {rechazando ? (
          <div className="flex gap-2 items-start">
            <textarea
              className="flex-1 border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="Motivo del rechazo..."
              rows={2}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
            />
            <div className="flex flex-col gap-1">
              <button
                disabled={busy || !motivo.trim()}
                onClick={handleRechazar}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? '...' : 'Confirmar rechazo'}
              </button>
              <button
                onClick={() => setRechazando(false)}
                className="px-4 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              disabled={busy}
              onClick={handleAprobar}
              className="flex-1 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Procesando...' : 'Aprobar'}
            </button>
            <button
              disabled={busy}
              onClick={() => setRechazando(true)}
              className="flex-1 py-2 border border-red-300 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              Rechazar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
