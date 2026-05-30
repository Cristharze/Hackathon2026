'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Sidebar from '@/components/Sidebar'

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
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 overflow-auto">{children}</main>
    </div>
  )
}
