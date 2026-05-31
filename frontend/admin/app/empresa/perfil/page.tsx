'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/ui/Toast'

const SECTORES = ['MANUFACTURA','SERVICIOS','COMERCIO','SALUD','EDUCACION','TECNOLOGIA','CONSTRUCCION','ALIMENTOS','OTRO']

interface ProfileData {
  user:    { id: string; email: string }
  perfil:  { nombre?: string; role: string; empresa_id?: string }
  empresa: { id: string; nombre: string; sector: string; ciudad: string; contacto: string; email: string; telefono?: string; direccion?: string } | null
}

export default function EmpresaPerfilPage() {
  const { user: authUser } = useAuth()
  const [data, setData]     = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // editable copies
  const [nombre,    setNombre]    = useState('')
  const [empresa,   setEmpresa]   = useState<NonNullable<ProfileData['empresa']> | null>(null)
  const [newPass,   setNewPass]   = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/perfil', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const d: ProfileData = await res.json()
      setData(d)
      setNombre(d.perfil?.nombre ?? '')
      setEmpresa(d.empresa ? { ...d.empresa } : null)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, empresa }),
    })

    if (newPass) {
      if (newPass !== confirmPass) {
        setToast({ message: 'Las contraseñas no coinciden.', type: 'error' })
        setSaving(false); return
      }
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) { setToast({ message: 'Error al cambiar contraseña.', type: 'error' }); setSaving(false); return }
      setNewPass(''); setConfirmPass('')
    }

    if (res.ok) {
      setToast({ message: 'Perfil actualizado correctamente.', type: 'success' })
      setEditing(false)
      load()
    } else {
      setToast({ message: 'Error al guardar.', type: 'error' })
    }
    setSaving(false)
  }

  const initials = (nombre || data?.empresa?.nombre || 'E').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mi perfil</h1>
          <p className="text-sm text-slate-500 mt-1">Información de tu empresa y cuenta</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-600 transition-all">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /></svg>
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); load() }} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </motion.div>

      <div className="space-y-5">
        {/* Avatar + name card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre del contacto" className={inputCls} />
            ) : (
              <p className="font-semibold text-slate-900 text-lg">{nombre || '—'}</p>
            )}
            <p className="text-slate-500 text-sm mt-0.5">{data?.user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Empresa aliada
            </span>
          </div>
        </motion.div>

        {/* Empresa info */}
        {empresa && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-500">
                <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4z" clipRule="evenodd" />
              </svg>
              Datos de la empresa
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Nombre" value={empresa.nombre} editing={editing} onChange={v => setEmpresa(e => e ? {...e, nombre: v} : e)} />
              <InfoField label="Sector" value={empresa.sector} editing={editing} type="select" options={SECTORES} onChange={v => setEmpresa(e => e ? {...e, sector: v} : e)} />
              <InfoField label="Ciudad" value={empresa.ciudad} editing={editing} onChange={v => setEmpresa(e => e ? {...e, ciudad: v} : e)} />
              <InfoField label="Teléfono" value={empresa.telefono ?? ''} editing={editing} onChange={v => setEmpresa(e => e ? {...e, telefono: v} : e)} />
              <div className="col-span-2">
                <InfoField label="Dirección" value={empresa.direccion ?? ''} editing={editing} onChange={v => setEmpresa(e => e ? {...e, direccion: v} : e)} />
              </div>
            </div>
          </motion.div>
        )}

        {/* Change password */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Cambiar contraseña <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nueva contraseña</label>
                <input type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Confirmar contraseña</label>
                <input type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className={inputCls} />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}

const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all'
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide'

function InfoField({ label, value, editing, onChange, type = 'text', options = [] }: {
  label: string; value: string; editing: boolean
  onChange: (v: string) => void; type?: string; options?: string[]
}) {
  return (
    <div>
      <p className={labelCls}>{label}</p>
      {editing ? (
        type === 'select' ? (
          <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
            {options.map(o => <option key={o} value={o}>{o.charAt(0) + o.slice(1).toLowerCase()}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} />
        )
      ) : (
        <p className="text-sm text-slate-800 font-medium">{value || <span className="text-slate-400">—</span>}</p>
      )}
    </div>
  )
}
