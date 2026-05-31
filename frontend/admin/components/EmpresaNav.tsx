'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const LINKS = [
  { href: '/empresa/dashboard',     label: 'Mi impacto' },
  { href: '/empresa/recolecciones', label: 'Mis recolecciones' },
]

export default function EmpresaNav() {
  const path   = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const initials = (profile?.nombre ?? profile?.email ?? 'E')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  async function handleSignOut() {
    setUserOpen(false)
    await signOut()
    router.replace('/login')
  }

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-[56px] gap-8">

        <Link href="/empresa/dashboard" className="shrink-0 flex items-center">
          <img src="/fundares-logo.png" alt="Fundares" className="h-[34px] w-auto object-contain object-left" />
        </Link>

        <div className="h-5 w-px hidden lg:block" style={{ background: 'var(--gray-200)' }} />

        {/* Empresa badge */}
        {profile?.nombre && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'var(--teal-50)', border: '1px solid var(--teal-100)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--teal-600)' }} />
            <span className="text-[12px] font-semibold truncate max-w-[160px]" style={{ color: 'var(--teal-800)' }}>
              {profile.nombre}
            </span>
          </div>
        )}

        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {LINKS.map(({ href, label }) => {
            const active = path.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="relative px-3 py-1.5 text-[13.5px] font-medium rounded-lg transition-colors"
                style={{ color: active ? 'var(--teal-700)' : 'var(--text-secondary)' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--gray-100)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                {active && (
                  <motion.span layoutId="empresa-nav-active" className="absolute inset-0 rounded-lg"
                    style={{ background: 'var(--teal-50)' }} transition={{ type: 'spring', stiffness: 400, damping: 35 }} />
                )}
                <span className="relative">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setUserOpen(v => !v)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{ background: 'var(--teal-700)' }}>
                {initials}
              </div>
              <span className="hidden sm:block text-[13px] font-medium max-w-[120px] truncate" style={{ color: 'var(--text)' }}>
                {profile?.nombre ?? 'Mi empresa'}
              </span>
            </button>
            <AnimatePresence>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1.5 z-20 w-48 rounded-xl overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}
                  >
                    <div className="p-1.5">
                      <Link href="/empresa/perfil" onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-100)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        Mi perfil
                      </Link>
                      <button onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
                        style={{ color: 'var(--error)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--error-bg)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        Cerrar sesión
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setMenuOpen(v => !v)} style={{ color: 'var(--text-secondary)' }}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden" style={{ borderTop: '1px solid var(--border)' }}>
            <nav className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-[14px] font-medium"
                  style={{ color: path.startsWith(href) ? 'var(--teal-700)' : 'var(--text-secondary)', background: path.startsWith(href) ? 'var(--teal-50)' : 'transparent' }}>
                  {label}
                </Link>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
