'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin/validacion', label: 'Validacion', icon: '✓' },
  { href: '/admin/dashboard', label: 'Dashboard', icon: '■' },
  { href: '/admin/empresas', label: 'Empresas', icon: '◆' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-56 bg-green-700 text-white flex flex-col min-h-screen">
      <div className="px-6 py-5 border-b border-green-600">
        <span className="font-bold text-lg tracking-wide">Fundares</span>
        <p className="text-xs text-green-200 mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label, icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-green-600 text-white'
                  : 'text-green-100 hover:bg-green-600/50'
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-6 py-4 border-t border-green-600 text-xs text-green-300">
        FUNDARES_ADMIN
      </div>
    </aside>
  )
}
