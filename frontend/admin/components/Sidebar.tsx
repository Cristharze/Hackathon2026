'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const NAV = [
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
      </svg>
    ),
  },
  {
    href: '/admin/validacion',
    label: 'Recolecciones',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd"/>
      </svg>
    ),
  },
  {
    href: '/admin/empresas',
    label: 'Empresas',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
        <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM11 5.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0111 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd"/>
      </svg>
    ),
  },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const initials = (profile?.nombre ?? profile?.email ?? 'A')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside
      style={{ background: '#fff', borderRight: '1px solid var(--border)' }}
      className="w-[252px] shrink-0 flex flex-col min-h-screen"
    >
      {/* ── Logo ─────────────────────────────────────────── */}
      <div className="px-6 pt-7 pb-5">
        {/* Logo institucional — sin contenedor, proporciones originales */}
        <img
          src="/fundares-logo.png"
          alt="Fundares — Reciclaje Energía Sostenibilidad"
          className="h-11 w-auto object-contain object-left"
          style={{ maxWidth: '180px' }}
        />
      </div>

      {/* ── Divisor ──────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '0 24px' }} />

      {/* ── Navegación ───────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4">
        <p
          className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: 'var(--text-muted)' }}
        >
          Módulos
        </p>

        <div className="space-y-0.5">
          {NAV.map(({ href, label, icon }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href} className="block relative">
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[10px]"
                    style={{ background: 'var(--f-75)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <span
                  className={`relative flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 ${
                    active ? '' : 'hover:bg-[var(--n-75)]'
                  }`}
                  style={{
                    color: active ? 'var(--f-600)' : 'var(--text-secondary)',
                  }}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ background: 'var(--f-600)' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <span style={{ color: active ? 'var(--f-600)' : 'var(--n-400)' }}>
                    {icon}
                  </span>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* ── Divisor ──────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'var(--border)', margin: '0 24px' }} />

      {/* ── Perfil y logout ───────────────────────────────── */}
      <div className="px-3 py-3 space-y-0.5">
        <Link href="/admin/perfil" className="block">
          <span
            className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 ${
              path === '/admin/perfil' ? 'bg-[var(--f-75)]' : 'hover:bg-[var(--n-75)]'
            }`}
            style={{ color: 'var(--text-secondary)' }}
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: 'var(--f-600)' }}
            >
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px]" style={{ color: 'var(--text-primary)' }}>
                {profile?.nombre ?? profile?.email ?? 'Administrador'}
              </span>
              <span className="block text-[11px]" style={{ color: 'var(--text-muted)' }}>Ver perfil</span>
            </span>
          </span>
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] font-medium transition-all duration-150 hover:bg-rose-50 group"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-[17px] h-[17px] shrink-0 group-hover:text-rose-500 transition-colors">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd"/>
            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd"/>
          </svg>
          <span className="group-hover:text-rose-500 transition-colors">Cerrar sesión</span>
        </button>
      </div>

      {/* ── Tag versión ──────────────────────────────────── */}
      <div className="px-6 py-3">
        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
          Fundares Admin · 2026
        </span>
      </div>
    </aside>
  )
}
