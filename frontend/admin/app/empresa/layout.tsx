'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import EmpresaSidebar from '@/components/EmpresaSidebar'

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
    <div className="flex min-h-screen">
      <EmpresaSidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
    </div>
  )
}
