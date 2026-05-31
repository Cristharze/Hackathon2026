'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/hooks/useTheme'

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/empresas',  label: 'Empresas Aliadas' },
  { href: '/admin/externos',  label: 'Externos' },
  { href: '/admin/reportes',  label: 'Reportes' },
]

const TEAL = '#1e9070'
const LIME = '#43b349'

export default function AdminNav() {
  const path    = usePathname()
  const router  = useRouter()
  const { profile, signOut } = useAuth()
  const { dark, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initials = (profile?.nombre ?? profile?.email ?? 'A')
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
            Fundares Bolivia — Plataforma de Gestión de Reciclaje
          </span>
          <span className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,.6)' }}>
            Panel Administrativo
          </span>
        </div>
      </div>

      {/* ── Barra principal blanca ──────────────────────── */}
      <motion.div
        initial={false}
        animate={{ boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,.10)' : '0 1px 0 #e5e7eb' }}
        transition={{ duration: 0.2 }}
        style={{ background: '#fff' }}
      >
        <div className="max-w-screen-xl mx-auto px-6 flex items-center h-[60px] gap-8">

          {/* Logo — fondo blanco natural, sin contenedor */}
          <Link href="/admin/dashboard" className="shrink-0 flex items-center">
            <motion.img
              src="/fundares-logo.png"
              alt="Fundares"
              className="w-auto object-contain"
              style={{ height: '42px' }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          </Link>

          {/* Divisor */}
          <div className="h-7 w-px hidden lg:block" style={{ background: '#e5e7eb' }} />

          {/* Nav links desktop */}
          <nav className="hidden lg:flex items-center gap-1 flex-1">
            {LINKS.map(({ href, label }) => {
              const active = path === href || (href !== '/admin/dashboard' && path.startsWith(href))
              return (
                <Link key={href} href={href} className="relative px-3.5 py-2 text-[13.5px] font-medium group">
                  {/* Fondo hover */}
                  <motion.span
                    className="absolute inset-0 rounded-lg"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                    style={{ background: active ? `${LIME}12` : '#f4f4f5' }}
                  />
                  {/* Texto */}
                  <span
                    className="relative transition-colors duration-150"
                    style={{ color: active ? TEAL : '#374151' }}
                  >
                    {label}
                  </span>
                  {/* Indicador activo inferior */}
                  {active && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                      style={{ background: TEAL }}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Tema oscuro/claro */}
          <motion.button onClick={toggle}
            title={dark ? 'Modo claro' : 'Modo oscuro'}
            className="p-2 rounded-xl hidden lg:flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,.1)', color: 'rgba(255,255,255,.85)' }}
            whileHover={{ backgroundColor: 'rgba(255,255,255,.2)' }}
            whileTap={{ scale: 0.88 }}>
            <AnimatePresence mode="wait" initial={false}>
              {dark ? (
                <motion.svg key="sun" viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]"
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.8 }} transition={{ duration: 0.2 }}>
                  <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.061zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.061 1.06l1.061 1.06z"/>
                </motion.svg>
              ) : (
                <motion.svg key="moon" viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]"
                  initial={{ opacity: 0, rotate: 90, scale: 0.8 }} animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: -90, scale: 0.8 }} transition={{ duration: 0.2 }}>
                  <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" clipRule="evenodd"/>
                </motion.svg>
              )}
            </AnimatePresence>
          </motion.button>

          {/* User menu */}
          <div className="relative ml-auto">
            <motion.button
              onClick={() => setUserOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors"
              whileHover={{ backgroundColor: '#f4f4f5' }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: TEAL }}
                whileHover={{ scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {initials}
              </motion.div>
              <span className="hidden sm:block text-[13px] font-medium max-w-[120px] truncate" style={{ color: '#374151' }}>
                {profile?.nombre ?? 'Admin'}
              </span>
              <motion.svg
                viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"
                style={{ color: '#9ca3af' }}
                animate={{ rotate: userOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
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
                    className="absolute right-0 top-full mt-2 z-20 w-56 rounded-2xl overflow-hidden"
                    style={{ background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,.12)', border: '1px solid #f0f0f0' }}
                  >
                    <div className="px-4 py-3.5" style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#111827' }}>
                        {profile?.nombre ?? 'Administrador'}
                      </p>
                      <p className="text-[11px] truncate mt-0.5" style={{ color: '#9ca3af' }}>{profile?.email}</p>
                    </div>
                    <div className="p-1.5">
                      {[
                        { href: '/admin/perfil', label: 'Mi perfil' },
                      ].map(item => (
                        <Link key={item.href} href={item.href} onClick={() => setUserOpen(false)}>
                          <motion.div
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer"
                            style={{ color: '#374151' }}
                            whileHover={{ backgroundColor: '#f9fafb' }}
                          >
                            {item.label}
                          </motion.div>
                        </Link>
                      ))}
                      <motion.button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px]"
                        style={{ color: '#dc2626' }}
                        whileHover={{ backgroundColor: '#fff1f2' }}
                      >
                        Cerrar sesión
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile hamburger */}
          <motion.button
            className="lg:hidden p-2 rounded-xl"
            style={{ color: '#374151' }}
            whileHover={{ backgroundColor: '#f4f4f5' }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setMenuOpen(v => !v)}
          >
            <motion.svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"
              animate={{ rotate: menuOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              {menuOpen
                ? <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                : <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
              }
            </motion.svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="lg:hidden overflow-hidden"
            style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
          >
            <nav className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ href, label }, i) => {
                const active = path.startsWith(href)
                return (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={href} onClick={() => setMenuOpen(false)}
                      className="flex items-center px-3 py-2.5 rounded-xl text-[14px] font-medium"
                      style={{
                        color: active ? TEAL : '#374151',
                        background: active ? `${LIME}10` : 'transparent',
                      }}>
                      {active && <span className="w-1.5 h-1.5 rounded-full mr-2.5 shrink-0" style={{ background: TEAL }} />}
                      {label}
                    </Link>
                  </motion.div>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
