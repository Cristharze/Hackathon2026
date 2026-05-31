'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const LINKS = [
  { href: '/admin/dashboard',  label: 'Dashboard' },
  { href: '/admin/validacion', label: 'Registros' },
  { href: '/admin/empresas',   label: 'Empresas' },
  { href: '/admin/externos',   label: 'Externos' },
]

/* Colores Fundares extraídos del sitio web real */
const TEAL = '#1e9070'
const LIME = '#43b349'

export default function AdminNav() {
  const path    = usePathname()
  const router  = useRouter()
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const initials = (profile?.nombre ?? profile?.email ?? 'A')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  async function handleSignOut() {
    setUserOpen(false)
    await signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full" style={{ background: TEAL, boxShadow: '0 1px 0 rgba(0,0,0,.15)' }}>
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-[56px] gap-6">

        {/* Logo — mix-blend-mode:multiply disuelve el fondo blanco sobre el teal */}
        <Link href="/admin/dashboard" className="shrink-0 flex items-center">
          <img
            src="/fundares-logo.png"
            alt="Fundares"
            className="h-[38px] w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>

        {/* Divisor */}
        <div className="h-5 w-px hidden lg:block" style={{ background: 'rgba(255,255,255,.2)' }} />

        {/* Nav links */}
        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {LINKS.map(({ href, label }) => {
            const active = path === href || (href !== '/admin/dashboard' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="relative px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium transition-all duration-150"
                style={{
                  color:      active ? LIME : 'rgba(255,255,255,.75)',
                  background: active ? 'rgba(67,179,73,.12)' : 'transparent',
                }}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.08)'
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#fff'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
                  if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.75)'
                }}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-teal"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'rgba(67,179,73,.12)', border: `1px solid rgba(67,179,73,.25)` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                <span className="relative">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User menu */}
        <div className="relative ml-auto">
          <button
            onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,.1)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{ background: LIME, color: '#fff' }}
            >
              {initials}
            </div>
            <span className="hidden sm:block text-[13px] font-medium max-w-[120px] truncate text-white">
              {profile?.nombre ?? 'Admin'}
            </span>
            <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-white/60">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <AnimatePresence>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl overflow-hidden bg-white"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,.15)', border: '1px solid rgba(0,0,0,.08)' }}
                >
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{profile?.nombre ?? 'Administrador'}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{profile?.email}</p>
                  </div>
                  <div className="p-1.5">
                    <Link href="/admin/perfil" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-gray-600 transition-colors hover:bg-gray-50">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd"/>
                      </svg>
                      Mi perfil
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors hover:bg-red-50"
                      style={{ color: '#dc2626' }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
                        <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd"/>
                      </svg>
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          onClick={() => setMenuOpen(v => !v)}>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <nav className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ href, label }) => {
                const active = path.startsWith(href)
                return (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                    className="px-3 py-2.5 rounded-lg text-[14px] font-medium"
                    style={{
                      color:      active ? LIME : 'rgba(255,255,255,.8)',
                      background: active ? 'rgba(67,179,73,.12)' : 'transparent',
                    }}>
                    {label}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
