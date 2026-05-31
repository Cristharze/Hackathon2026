'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import EmpresaNav from '@/components/EmpresaNav'

export default function EmpresaLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else if (profile && profile.role !== 'empresa') {
      router.replace('/admin/dashboard')
    }
  }, [user, profile, router])

  if (!user || !profile || profile.role !== 'empresa') return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <EmpresaNav />
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
