'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router = useRouter()
  const { user, profile } = useAuth()

  useEffect(() => {
    if (user && profile) router.replace(profile.role === 'admin' ? '/admin/dashboard' : '/empresa/dashboard')
  }, [user, profile, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Correo o contraseña incorrectos.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">

      {/* ── Left: brand panel ───────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between p-14 relative overflow-hidden" style={{ background: '#f0faf9' }}>
        {/* Subtle ambient circles */}
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--teal-100) 0%, transparent 70%)' }} />
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, var(--teal-200) 0%, transparent 70%)' }} />

        {/* Logo — libre, sin contenedor */}
        <div className="relative z-10">
          <img src="/fundares-logo.png" alt="Fundares" className="h-[38px] w-auto object-contain object-left" />
        </div>

        {/* Main copy */}
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 space-y-8">
          <div>
            <h1 className="text-[42px] font-extrabold leading-[1.1] tracking-tight" style={{ color: 'var(--text)' }}>
              Reciclaje que<br />
              <span style={{ color: '#165c54' }}>genera impacto</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Plataforma de gestión de recolección de residuos reciclables para empresas aliadas de Fundares Bolivia.
            </p>
          </div>

          {/* Key metrics */}
          <div className="flex gap-10">
            {[
              { v: 'CO₂', l: 'reducido' },
              { v: '100%', l: 'trazabilidad' },
              { v: 'IA', l: 'integrada' },
            ].map(s => (
              <div key={s.l}>
                <p className="text-[28px] font-extrabold" style={{ color: '#165c54' }}>{s.v}</p>
                <p className="text-[11px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {[
              { icon: '♻️', t: 'Recolecciones vía WhatsApp' },
              { icon: '🤖', t: 'Extracción de datos con IA' },
              { icon: '📊', t: 'Reportes de impacto ambiental' },
            ].map(f => (
              <div key={f.t} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>{f.t}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <p className="relative z-10 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Fundares Bolivia
        </p>
      </div>

      {/* ── Right: form ─────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-14 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <img src="/fundares-logo.png" alt="Fundares" className="h-9 w-auto object-contain" />
          </div>

          <div className="mb-8">
            <h2 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--text)' }}>Bienvenido de vuelta</h2>
            <p className="text-[14px] mt-1" style={{ color: 'var(--text-muted)' }}>Ingresá con tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Correo electrónico</label>
              <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.com"
                className="w-full px-4 py-3 text-[13.5px] rounded-xl outline-none transition-all"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Contraseña</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 text-[13.5px] rounded-xl outline-none transition-all"
                  style={{ background: 'var(--gray-50)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--teal-400)')}
                  onBlur={e  => (e.target.style.borderColor = 'var(--border)')} />
                <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors" style={{ color: 'var(--gray-400)' }}>
                  {showPass ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd"/>
                      <path d="M10.748 13.93l2.523 2.523a10.029 10.029 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px]"
                style={{ background: 'var(--error-bg)', border: '1px solid #fca5a5', color: 'var(--error)' }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                </svg>
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 text-[14px] font-semibold text-white rounded-xl transition-all active:scale-[.98] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--teal-700)', marginTop: '8px' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--teal-800)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--teal-700)' }}>
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Ingresando…</>
              ) : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 space-y-1.5 text-center">
            <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
              ¿No tenés cuenta?{' '}
              <Link href="/register" className="font-semibold hover:underline" style={{ color: '#165c54' }}>Registrate aquí</Link>
            </p>
            <p className="text-[12px]" style={{ color: 'var(--gray-300)' }}>
              ¿Problemas? Contactá al administrador de Fundares.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
