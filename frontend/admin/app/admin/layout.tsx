'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import AdminNav from '@/components/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else if (profile && profile.role !== 'admin') {
      router.replace('/empresa/dashboard')
    }
  }, [user, profile, router])

  if (!user || !profile || profile.role !== 'admin') return null

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <AdminNav />
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
