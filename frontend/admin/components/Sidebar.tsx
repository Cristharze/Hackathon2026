'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV = [
  {
    href: '/admin/validacion',
    label: 'Validación',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    href: '/admin/empresas',
    label: 'Empresas',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
        <path fillRule="evenodd" d="M4 16.5v-13h-.25a.75.75 0 010-1.5h12.5a.75.75 0 010 1.5H16v13h.25a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75v-2.5a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v2.5a.75.75 0 01-.75.75h-3.5a.75.75 0 010-1.5H4zm3-11a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 017 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5zM11 5.5a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5A.75.75 0 0111 5.5zm.75 2.25a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside className="w-[260px] shrink-0 bg-slate-950 flex flex-col min-h-screen border-r border-slate-800">
      {/* Logo */}
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Fundares</p>
          <p className="text-slate-500 text-xs mt-0.5">Admin Panel</p>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-800" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2">
          Módulos
        </p>
        {NAV.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} className="block">
              <span
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={active ? 'text-emerald-400' : 'text-slate-500'}>{icon}</span>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-slate-800" />
      <div className="px-4 py-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          F
        </div>
        <div className="min-w-0">
          <p className="text-slate-300 text-xs font-medium truncate">FUNDARES_ADMIN</p>
          <p className="text-slate-600 text-[10px] truncate">Administrador</p>
        </div>
      </div>
    </aside>
  )
}
