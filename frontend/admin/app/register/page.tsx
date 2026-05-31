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
    <div className="min-h-screen grid lg:grid-cols-5">

      {/* ── Panel izquierdo: marca ──────────────────────── */}
      <div
        className="hidden lg:flex lg:col-span-2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'var(--teal-700)' }}
      >
        {/* Decoración */}
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10" style={{ background: '#fff' }} />
        <div className="absolute top-1/3 -left-16 w-48 h-48 rounded-full opacity-10" style={{ background: '#fff' }} />

        {/* Logo — sobre fondo teal oscuro, necesita versión clara */}
        {/* Usamos el logo con fondo blanco pequeño para que se vea sobre el teal */}
        <div className="relative z-10">
          <div className="bg-white inline-block px-4 py-2 rounded-xl">
            <img
              src="/fundares-logo.png"
              alt="Fundares"
              className="h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 space-y-6"
        >
          <div>
            <h1 className="text-[36px] font-extrabold leading-tight text-white">
              Únete al programa<br />
              <span style={{ color: 'var(--lime-300)' }}>de reciclaje</span>
            </h1>
            <p className="mt-4 text-[14px] leading-relaxed" style={{ color: 'var(--teal-200)' }}>
              Registrá tu empresa y empezá a medir el impacto ambiental de tu programa de reciclaje con Fundares Bolivia.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: '🌿', t: 'Seguimiento de kg reciclados por mes' },
              { icon: '📊', t: 'Métricas de CO₂ ahorrado en tiempo real' },
              { icon: '📱', t: 'Reporte vía WhatsApp con IA integrada' },
            ].map(item => (
              <div key={item.t} className="flex items-center gap-3">
                <span className="text-xl shrink-0">{item.icon}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--teal-100)' }}>{item.t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-[12px]" style={{ color: 'var(--teal-400)' }}>
          © {new Date().getFullYear()} Fundares Bolivia
        </p>
      </div>

      {/* ── Panel derecho: formulario ────────────────────── */}
      <div className="lg:col-span-3 flex items-start justify-center p-6 sm:p-10 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md py-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src="/fundares-logo.png" alt="Fundares" className="h-9 w-auto object-contain" />
          </div>

          <div className="mb-7">
            <h2 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Crear cuenta</h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--teal-700)' }}>
                Iniciá sesión
              </Link>
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-7 gap-1" style={{ background: 'var(--gray-100)' }}>
            {([['empresa', 'Empresa'], ['admin', 'Admin Fundares']] as [Tab, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="relative flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition-colors"
                style={{ color: tab === key ? 'var(--text)' : 'var(--text-muted)' }}
              >
                {tab === key && (
                  <motion.span
                    layoutId="reg-tab"
                    className="absolute inset-0 rounded-lg bg-white shadow-sm"
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

/* ─── Empresa form ────────────────────────────────── */
function EmpresaForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    nombre: '', sector: 'OTRO', ciudad: 'Santa Cruz',
    contacto: '', email: '', password: '', confirm: ''
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6)       { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/register/empresa', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, sector: form.sector, ciudad: form.ciudad, contacto: form.contacto, email: form.email, password: form.password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al registrar.'); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (signInErr) { setError('Cuenta creada. Por favor iniciá sesión.'); setLoading(false); return }
    setSuccess(true); setTimeout(onSuccess, 800)
  }

  if (success) return <SuccessScreen message="¡Empresa registrada! Redirigiendo..." />

  return (
    <motion.form key="empresa-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
      onSubmit={handleSubmit} className="space-y-4">

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

/* ─── Admin form ─────────────────────────────────── */
function AdminForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', confirm: '', codigo: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (form.password !== form.confirm) { setError('Las contraseñas no coinciden.'); return }
    if (form.password.length < 6)       { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)

    const res = await fetch('/api/register/admin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, email: form.email, password: form.password, codigo: form.codigo }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Error al registrar.'); setLoading(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    if (signInErr) { setError('Cuenta creada. Por favor iniciá sesión.'); setLoading(false); return }
    setSuccess(true); setTimeout(onSuccess, 800)
  }

  if (success) return <SuccessScreen message="¡Cuenta admin creada! Redirigiendo..." />

  return (
    <motion.form key="admin-form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}
      onSubmit={handleSubmit} className="space-y-4">

      <div className="flex items-start gap-3 px-4 py-3 rounded-xl text-[13px]"
        style={{ background: 'var(--warning-bg)', border: '1px solid #fcd34d' }}>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--warning)' }}>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
        </svg>
        <span style={{ color: '#92400e' }}>
          Cuenta exclusiva para el equipo de <strong>Fundares Bolivia</strong>. Necesitás el código de verificación.
        </span>
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
        <input type="text" required placeholder="Código proporcionado por Fundares"
          value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())}
          className={`${inputCls} tracking-widest font-mono`} />
      </Field>

      {error && <ErrorMsg msg={error} />}
      <button type="submit" disabled={loading} className={btnCls}>
        {loading ? <Spinner /> : 'Crear cuenta Fundares'}
      </button>
    </motion.form>
  )
}

/* ─── Helpers ────────────────────────────────────── */
const inputCls = `w-full bg-white px-4 py-2.5 text-[13.5px] outline-none transition-all rounded-xl`
const inputStyle = { border: '1px solid var(--border)', color: 'var(--text)' }
const btnStyle  = { background: 'var(--teal-700)' }
const btnCls    = `w-full font-semibold py-3 rounded-xl text-[14px] text-white transition-all active:scale-[.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-60`

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
        {label}{required && <span className="ml-0.5" style={{ color: 'var(--teal-600)' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px]"
      style={{ background: 'var(--error-bg)', border: '1px solid #fca5a5', color: 'var(--error)' }}>
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
      </svg>
      {msg}
    </motion.div>
  )
}

function Spinner() {
  return (
    <>
      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      Creando cuenta…
    </>
  )
}

function SuccessScreen({ message }: { message: string }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-12 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--teal-700)' }}>
        <svg viewBox="0 0 20 20" fill="white" className="w-8 h-8">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd"/>
        </svg>
      </div>
      <p className="font-semibold" style={{ color: 'var(--text)' }}>{message}</p>
    </motion.div>
  )
}
