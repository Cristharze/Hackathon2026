'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router  = useRouter()
  const { user, profile } = useAuth()

  // If already authenticated, redirect
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
      return
    }
    // AuthProvider will detect the new session and set profile;
    // the useEffect above will then redirect.
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: brand ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-slate-950 overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 20 20" fill="white" className="w-5 h-5">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Fundares</span>
        </div>

        {/* Center copy */}
        <div className="relative z-10 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h1 className="text-4xl font-bold text-white leading-tight">
              Reciclaje que<br />
              <span className="text-emerald-400">genera impacto</span>
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed max-w-sm">
              Plataforma de gestión de recolección de residuos reciclables para empresas aliadas de Fundares Bolivia.
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex gap-8 pt-4"
          >
            {[
              { value: 'CO₂', label: 'reducido' },
              { value: '100%', label: 'trazabilidad' },
              { value: 'IA', label: 'integrada' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-emerald-400">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-slate-600 text-xs">
          © {new Date().getFullYear()} Fundares Bolivia — Sistema de Gestión de Reciclaje
        </p>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900">Fundares</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Bienvenido de vuelta</h2>
            <p className="text-slate-500 text-sm mt-1">Ingresá con tu cuenta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                >
                  {showPass ? (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                      <path d="M10.748 13.93l2.523 2.523a10.029 10.029 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Ingresando...
                </>
              ) : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
              Registrate aquí
            </Link>
          </p>
          <p className="text-center text-xs text-slate-400 mt-2">
            ¿Problemas para ingresar? Contactá al administrador de Fundares.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
