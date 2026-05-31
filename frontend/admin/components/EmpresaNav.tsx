'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const LINKS = [
  { href: '/empresa/dashboard',     label: 'Mi impacto' },
  { href: '/empresa/recolecciones', label: 'Mis recolecciones' },
]

const TEAL = '#1e9070'
const LIME = '#43b349'

export default function EmpresaNav() {
  const path    = usePathname()
  const router  = useRouter()
  const { profile, signOut } = useAuth()
  const [userOpen, setUserOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initials = (profile?.nombre ?? profile?.email ?? 'E')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  async function handleSignOut() {
    setUserOpen(false)
    await signOut()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full">

      {/* ── Barra superior teal ─────────────────────────── */}
      <div style={{ background: TEAL, height: '32px' }}>
        <div className="max-w-screen-xl mx-auto px-6 h-full flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide" style={{ color: 'rgba(255,255,255,.7)' }}>
            Fundares Bolivia — Plataforma de Reciclaje
          </span>
          {profile?.nombre && (
            <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,.75)' }}>
              {profile.nombre}
            </span>
          )}
        </div>
      </div>

      {/* ── Barra principal blanca ──────────────────────── */}
      <motion.div
        animate={{ boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,.10)' : '0 1px 0 #e5e7eb' }}
        transition={{ duration: 0.2 }}
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-6 flex items-center h-[60px] gap-8">

          {/* Logo */}
          <Link href="/empresa/dashboard" className="shrink-0">
            <motion.img
              src="/fundares-logo.png"
              alt="Fundares"
              style={{ height: '42px' }}
              className="w-auto object-contain"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          </Link>

          <div className="h-7 w-px hidden lg:block" style={{ background: '#e5e7eb' }} />

          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {LINKS.map(({ href, label }) => {
              const active = path.startsWith(href)
              return (
                <Link key={href} href={href} className="relative px-3.5 py-2 text-[13.5px] font-medium group">
                  <motion.span className="absolute inset-0 rounded-lg" initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }} transition={{ duration: 0.15 }}
                    style={{ background: active ? `${LIME}12` : '#f4f4f5' }} />
                  <span className="relative transition-colors duration-150" style={{ color: active ? TEAL : '#374151' }}>
                    {label}
                  </span>
                  {active && (
                    <motion.span layoutId="empresa-nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: TEAL }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }} />
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="relative ml-auto">
            <motion.button
              onClick={() => setUserOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              whileHover={{ backgroundColor: '#f4f4f5' }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: TEAL }} whileHover={{ scale: 1.08 }} transition={{ type: 'spring', stiffness: 400 }}>
                {initials}
              </motion.div>
              <span className="hidden sm:block text-[13px] font-medium max-w-[120px] truncate" style={{ color: '#374151' }}>
                {profile?.nombre ?? 'Mi empresa'}
              </span>
              <motion.svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" style={{ color: '#9ca3af' }}
                animate={{ rotate: userOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </motion.svg>
            </motion.button>

            <AnimatePresence>
              {userOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    className="absolute right-0 top-full mt-2 z-20 w-52 rounded-2xl overflow-hidden"
                    style={{ background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #f0f0f0' }}>
                    <div className="p-1.5">
                      <Link href="/empresa/perfil" onClick={() => setUserOpen(false)}>
                        <motion.div className="px-3 py-2.5 rounded-xl text-[13px]" style={{ color: '#374151' }}
                          whileHover={{ backgroundColor: '#f9fafb' }}>
                          Mi perfil
                        </motion.div>
                      </Link>
                      <motion.button onClick={handleSignOut}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-[13px]"
                        style={{ color: '#dc2626' }} whileHover={{ backgroundColor: '#fff1f2' }}>
                        Cerrar sesión
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <motion.button className="lg:hidden p-2 rounded-xl" style={{ color: '#374151' }}
            whileHover={{ backgroundColor: '#f4f4f5' }} whileTap={{ scale: 0.92 }}
            onClick={() => setMenuOpen(v => !v)}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
            </svg>
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="lg:hidden overflow-hidden" style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
            <nav className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-[14px] font-medium"
                  style={{ color: path.startsWith(href) ? TEAL : '#374151', background: path.startsWith(href) ? `${LIME}10` : 'transparent' }}>
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
