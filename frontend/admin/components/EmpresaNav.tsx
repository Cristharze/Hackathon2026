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

const TEAL = '#165c54'
const LIME = '#43b349'

export default function EmpresaNav() {
  const path    = usePathname()
  const router  = useRouter()
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
    <header className="sticky top-0 z-40 w-full" style={{ background: TEAL, boxShadow: '0 1px 0 rgba(0,0,0,.15)' }}>
      <div className="max-w-screen-xl mx-auto px-6 flex items-center h-[56px] gap-6">

        {/* Logo */}
        <Link href="/empresa/dashboard" className="shrink-0">
          <img
            src="/fundares-logo.png"
            alt="Fundares"
            className="h-[38px] w-auto object-contain"
            style={{ mixBlendMode: 'multiply' }}
          />
        </Link>

        <div className="h-5 w-px hidden lg:block" style={{ background: 'rgba(255,255,255,.2)' }} />

        {/* Empresa badge */}
        {profile?.nombre && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,.1)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: LIME }} />
            <span className="text-[12px] font-semibold truncate max-w-[180px] text-white">{profile.nombre}</span>
          </div>
        )}

        <nav className="hidden lg:flex items-center gap-1 flex-1">
          {LINKS.map(({ href, label }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href}
                className="relative px-3.5 py-1.5 rounded-lg text-[13.5px] font-medium transition-all"
                style={{ color: active ? LIME : 'rgba(255,255,255,.75)', background: active ? 'rgba(67,179,73,.12)' : 'transparent' }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,.75)' } }}>
                <span className="relative">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="relative ml-auto flex items-center gap-2">
          <button onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,.1)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ background: LIME }}>
              {initials}
            </div>
            <span className="hidden sm:block text-[13px] font-medium max-w-[120px] truncate text-white">
              {profile?.nombre ?? 'Mi empresa'}
            </span>
          </button>

          <AnimatePresence>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.14 }}
                  className="absolute right-0 top-full mt-2 z-20 w-48 rounded-xl overflow-hidden bg-white"
                  style={{ boxShadow: '0 8px 24px rgba(0,0,0,.15)', border: '1px solid rgba(0,0,0,.08)' }}>
                  <div className="p-1.5">
                    <Link href="/empresa/perfil" onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                      Mi perfil
                    </Link>
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] hover:bg-red-50 transition-colors"
                      style={{ color: '#dc2626' }}>
                      Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <button className="lg:hidden p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            onClick={() => setMenuOpen(v => !v)}>
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd"/>
            </svg>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
            <nav className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(({ href, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg text-[14px] font-medium"
                  style={{ color: path.startsWith(href) ? LIME : 'rgba(255,255,255,.8)', background: path.startsWith(href) ? 'rgba(67,179,73,.12)' : 'transparent' }}>
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
