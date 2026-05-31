'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/AuthProvider'

const NAV = [
  {
    href: '/empresa/dashboard',
    label: 'Mi impacto',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>,
  },
  {
    href: '/empresa/recolecciones',
    label: 'Mis recolecciones',
    icon: <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" /></svg>,
  },
]

export default function EmpresaSidebar() {
  const path   = usePathname()
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const initials = (profile?.nombre ?? profile?.email ?? 'E')
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  return (
    <aside className="w-[260px] shrink-0 bg-slate-950 flex flex-col min-h-screen border-r border-slate-800/60">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <svg viewBox="0 0 20 20" fill="white" className="w-4.5 h-4.5">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.83-4.401z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">Fundares</p>
          <p className="text-emerald-500/60 text-[10px] mt-0.5 font-medium uppercase tracking-widest">Empresa</p>
        </div>
      </div>

      <div className="mx-4 h-px bg-slate-800/60" />

      {/* Company pill */}
      {profile?.nombre && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5">
          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Mi empresa</p>
          <p className="text-white text-sm font-medium truncate mt-0.5">{profile.nombre}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 pb-2.5">Módulos</p>
        {NAV.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href} className="block">
              <span className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                {active && <motion.span layoutId="empresa-sidebar-indicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />}
                <span className={active ? 'text-emerald-400' : 'text-slate-500'}>{icon}</span>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mx-4 h-px bg-slate-800/60" />
      <div className="px-3 py-3 space-y-0.5">
        <Link href="/empresa/perfil" className="block">
          <span className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${path === '/empresa/perfil' ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{initials}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate leading-none">{profile?.email ?? 'Mi cuenta'}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">Ver perfil</p>
            </div>
          </span>
        </Link>
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5 shrink-0"><path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" /><path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" /></svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
