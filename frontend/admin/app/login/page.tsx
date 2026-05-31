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
    if (user && profile) {
      router.replace(profile.role === 'admin' ? '/admin/dashboard' : '/empresa/dashboard')
    }
  }, [user, profile, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo: identidad de marca ───────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: '#f4f9f5' }}
      >
        {/* Decoración de fondo sutil */}
        <div className="absolute bottom-0 right-0 w-[480px] h-[480px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, var(--f-100) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />
        <div className="absolute top-0 left-0 w-[320px] h-[320px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, var(--f-100) 0%, transparent 70%)', transform: 'translate(-40%, -40%)' }} />

        {/* Logo institucional — a plena escena, sin contenedor */}
        <div className="relative z-10">
          <img
            src="/fundares-logo.png"
            alt="Fundares — Reciclaje Energía Sostenibilidad"
            className="h-14 w-auto object-contain object-left"
            style={{ maxWidth: '220px' }}
          />
        </div>

        {/* Contenido central */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 space-y-8"
        >
          <div>
            <h1 className="text-[40px] font-bold leading-tight tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Reciclaje que<br />
              <span style={{ color: 'var(--f-600)' }}>genera impacto</span>
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--text-secondary)' }}>
              Plataforma de gestión de recolección de residuos reciclables para empresas aliadas de Fundares Bolivia.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-10">
            {[
              { value: 'CO₂', label: 'Reducido' },
              { value: '100%', label: 'Trazabilidad' },
              { value: 'IA', label: 'Integrada' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[26px] font-bold" style={{ color: 'var(--f-600)' }}>{s.value}</p>
                <p className="text-[11px] uppercase tracking-widest font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* Pillars */}
          <div className="space-y-3">
            {[
              { icon: '♻️', text: 'Gestión de recolecciones vía WhatsApp' },
              { icon: '🤖', text: 'Extracción automática de datos con IA' },
              { icon: '📊', text: 'Reportes de impacto ambiental en tiempo real' },
            ].map(p => (
              <div key={p.text} className="flex items-center gap-3">
                <span className="text-[18px]">{p.icon}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--text-secondary)' }}>{p.text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <p className="relative z-10 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} Fundares Bolivia — Sistema de Gestión de Reciclaje
        </p>
      </div>

      {/* ── Panel derecho: formulario ─────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-14 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Logo mobile */}
          <div className="lg:hidden mb-8">
            <img
              src="/fundares-logo.png"
              alt="Fundares"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="mb-8">
            <h2 className="text-[24px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Bienvenido de vuelta
            </h2>
            <p className="text-[13.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Ingresá con tu cuenta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Correo electrónico
              </label>
              <input
                type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full rounded-xl px-4 py-3 text-[13.5px] outline-none transition-all"
                style={{ background: 'var(--n-50)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e  => (e.target.style.borderColor = 'var(--f-500)')}
                onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} autoComplete="current-password" required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-4 py-3 pr-12 text-[13.5px] outline-none transition-all"
                  style={{ background: 'var(--n-50)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onFocus={e  => (e.target.style.borderColor = 'var(--f-500)')}
                  onBlur={e   => (e.target.style.borderColor = 'var(--border)')}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: 'var(--n-400)' }}>
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
                style={{ background: '#fff1f1', border: '1px solid #fecaca', color: '#dc2626' }}>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                </svg>
                {error}
              </motion.div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full font-semibold py-3 rounded-xl text-[14px] text-white transition-all active:scale-[.98] flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--f-600)' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--f-700)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--f-600)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Ingresando…
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: 'var(--f-600)' }}>
              Registrate aquí
            </Link>
          </p>
          <p className="text-center text-[12px] mt-1.5" style={{ color: 'var(--n-300)' }}>
            ¿Problemas para ingresar? Contactá al administrador de Fundares.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
