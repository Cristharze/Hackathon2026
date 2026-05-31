'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import { Toast } from '@/components/ui/Toast'

interface ProfileData {
  user:   { id: string; email: string }
  perfil: { nombre?: string; role: string }
}

export default function AdminPerfilPage() {
  const { profile: authProfile } = useAuth()
  const [data, setData]     = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [editing, setEditing] = useState(false)
  const [toast, setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const [nombre,      setNombre]      = useState('')
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  async function load() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const res = await fetch('/api/perfil', { headers: { Authorization: `Bearer ${session.access_token}` } })
    if (res.ok) {
      const d: ProfileData = await res.json()
      setData(d)
      setNombre(d.perfil?.nombre ?? '')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    if (newPass) {
      if (newPass !== confirmPass) {
        setToast({ message: 'Las contraseñas no coinciden.', type: 'error' })
        setSaving(false); return
      }
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) { setToast({ message: 'Error al cambiar contraseña.', type: 'error' }); setSaving(false); return }
      setNewPass(''); setConfirmPass('')
    }

    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })

    if (res.ok) {
      setToast({ message: 'Perfil actualizado.', type: 'success' })
      setEditing(false); load()
    } else {
      setToast({ message: 'Error al guardar.', type: 'error' })
    }
    setSaving(false)
  }

  const initials = (nombre || 'A').split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()

  if (loading) return (
    <div className="max-w-xl mx-auto space-y-4">
      {[1,2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="max-w-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mi perfil</h1>
          <p className="text-sm text-slate-500 mt-1">Configuración de tu cuenta de administrador</p>
        </div>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-600 transition-all">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /></svg>
            Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); load() }} className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </motion.div>

      <div className="space-y-5">
        {/* Avatar card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-600/20 shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
            ) : (
              <p className="font-semibold text-slate-900 text-lg">{nombre || '—'}</p>
            )}
            <p className="text-slate-500 text-sm mt-0.5">{data?.user?.email}</p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-emerald-400">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
              </svg>
              Fundares Admin
            </span>
          </div>
        </motion.div>

        {/* Cuenta info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Información de la cuenta</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</span>
              <span className="text-sm text-slate-800 font-medium">{data?.user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</span>
              <span className="text-sm text-slate-800 font-medium">Administrador Fundares</span>
            </div>
          </div>
        </motion.div>

        {/* Change password */}
        {editing && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-5 flex items-center gap-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
              </svg>
              Cambiar contraseña <span className="text-slate-400 text-xs font-normal">(opcional)</span>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Nueva</label>
                <input type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Confirmar</label>
                <input type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
    </div>
  )
}
