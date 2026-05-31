'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const SECTORES = [
  'MANUFACTURA','SERVICIOS','COMERCIO','SALUD',
  'EDUCACION','TECNOLOGIA','CONSTRUCCION','ALIMENTOS','OTRO',
]

type Tab = 'empresa' | 'admin'

export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>('empresa')
  const router = useRouter()

  return (
    <div className="min-h-screen flex">
      {/* ── Brand panel ── */}
      <div className="hidden lg:flex lg:w-5/12 relative flex-col justify-between p-12 bg-slate-950 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />

        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Fundares</span>
        </div>

        <div className="relative z-10 space-y-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Únete al programa<br />
              <span className="text-emerald-400">de reciclaje</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Registrá tu empresa y empezá a medir el impacto ambiental de tu programa de reciclaje con Fundares Bolivia.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
            {[
              { icon: '🌿', text: 'Seguimiento de kg reciclados por mes' },
              { icon: '📊', text: 'Métricas de CO₂ ahorrado en tiempo real' },
              { icon: '📱', text: 'Reporte vía WhatsApp con IA integrada' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Fundares Bolivia
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-slate-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900">Fundares</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
            <p className="text-slate-500 text-sm mt-1">¿Ya tenés cuenta? <Link href="/login" className="text-emerald-600 font-medium hover:underline">Iniciá sesión</Link></p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-2xl p-1 mb-7 gap-1">
            {([['empresa', 'Empresa'], ['admin', 'Admin Fundares']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`relative flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                  tab === key ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === key && (
                  <motion.span
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-white rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {tab === 'empresa'
              ? <EmpresaForm key="empresa" onSuccess={() => router.push('/empresa/dashboard')} />
              : <AdminForm   key="admin"   onSuccess={() => router.push('/admin/dashboard')} />
            }
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Empresa registration form ─── */
function EmpresaForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ nombre: '', sector: 'OTRO', ciudad: 'Santa Cruz', contacto: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/register/empresa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, sector: form.sector, ciudad: form.ciudad, contacto: form.contacto, email: form.email, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al registrar.'); setLoading(false); return }

    // Auto sign-in after registration
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (signInErr) { setError('Cuenta creada. Por favor iniciá sesión.'); setLoading(false); return }
    setSuccess(true)
    setTimeout(onSuccess, 800)
  }

  if (success) return <SuccessScreen message="¡Empresa registrada! Redirigiendo..." />

  return (
    <motion.form
      key="empresa-form"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Field label="Nombre de la empresa" required>
        <input type="text" required placeholder="Ej: Supermercados Norte S.R.L." value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Sector">
          <select value={form.sector} onChange={e => set('sector', e.target.value)} className={inputCls}>
            {SECTORES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Ciudad">
          <input type="text" placeholder="Santa Cruz" value={form.ciudad} onChange={e => set('ciudad', e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Nombre del contacto" required>
        <input type="text" required placeholder="María García" value={form.contacto} onChange={e => set('contacto', e.target.value)} className={inputCls} />
      </Field>

      <Field label="Correo electrónico" required>
        <input type="email" required placeholder="empresa@correo.com" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contraseña" required>
          <input type="password" required placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Confirmar" required>
          <input type="password" required placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} className={inputCls} />
        </Field>
      </div>

      {error && <ErrorMsg msg={error} />}

      <button type="submit" disabled={loading} className={btnCls}>
        {loading ? <Spinner /> : 'Crear cuenta empresa'}
      </button>
    </motion.form>
  )
}

/* ─── Admin registration form ─── */
function AdminForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '', codigo: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/register/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, codigo: form.codigo }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al registrar.'); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (signInErr) { setError('Cuenta creada. Por favor iniciá sesión.'); setLoading(false); return }
    setSuccess(true)
    setTimeout(onSuccess, 800)
  }

  if (success) return <SuccessScreen message="¡Cuenta admin creada! Redirigiendo..." />

  return (
    <motion.form
      key="admin-form"
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0 text-amber-500">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <span>Esta cuenta es exclusiva para el equipo de <strong>Fundares Bolivia</strong>. Necesitás el código de verificación proporcionado por Fundares.</span>
      </div>

      <Field label="Nombre completo" required>
        <input type="text" required placeholder="Juan Pérez" value={form.nombre} onChange={e => set('nombre', e.target.value)} className={inputCls} />
      </Field>

      <Field label="Correo electrónico" required>
        <input type="email" required placeholder="admin@fundares.bo" value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Contraseña" required>
          <input type="password" required placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} className={inputCls} />
        </Field>
        <Field label="Confirmar" required>
          <input type="password" required placeholder="••••••••" value={form.confirm} onChange={e => set('confirm', e.target.value)} className={inputCls} />
        </Field>
      </div>

      <Field label="Código de verificación Fundares" required>
        <input
          type="text"
          required
          placeholder="Código proporcionado por Fundares"
          value={form.codigo}
          onChange={e => set('codigo', e.target.value.toUpperCase())}
          className={`${inputCls} tracking-widest font-mono`}
        />
      </Field>

      {error && <ErrorMsg msg={error} />}

      <button type="submit" disabled={loading} className={btnCls}>
        {loading ? <Spinner /> : 'Crear cuenta Fundares'}
      </button>
    </motion.form>
  )
}

/* ─── Shared UI helpers ─── */
const inputCls = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all'
const btnCls   = 'w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-emerald-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
      {msg}
    </motion.div>
  )
}

function Spinner() {
  return (
    <>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Creando cuenta...
    </>
  )
}

function SuccessScreen({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
        <svg viewBox="0 0 20 20" fill="white" className="w-8 h-8">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-slate-700 font-medium">{message}</p>
    </motion.div>
  )
}
