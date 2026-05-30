'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Home() {
  const { user, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.replace('/login')
    } else if (profile) {
      router.replace(profile.role === 'admin' ? '/admin/dashboard' : '/empresa/dashboard')
    }
  }, [user, profile, router])

  return null
}
