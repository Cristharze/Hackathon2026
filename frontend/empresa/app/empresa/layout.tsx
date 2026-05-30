'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Leaf, Lightbulb, FileText, Recycle } from 'lucide-react'
import { DEMO_EMPRESA_NOMBRE } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/empresa/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/empresa/impacto', label: 'Impacto', icon: Leaf },
  { href: '/empresa/tips', label: 'Tips', icon: Lightbulb },
  { href: '/empresa/reporte', label: 'Reporte Anual', icon: FileText },
]

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-sm no-print">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">EcoTrack</div>
              <div className="text-xs text-green-600 font-medium">Fundares Bolivia</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-green-600' : 'text-gray-400'}`} size={18} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Company badge */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="bg-green-50 rounded-xl p-3">
            <div className="text-xs text-green-600 font-medium mb-0.5">Empresa</div>
            <div className="text-xs font-semibold text-gray-800 leading-snug">
              {DEMO_EMPRESA_NOMBRE}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
