'use client'

import { useAuth } from './AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loading from '@/components/ui/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth' 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        router.push(redirectTo)
      } else if (!requireAuth && user) {
        router.push('/dashboard')
      }
    }
  }, [user, loading, requireAuth, redirectTo, router])

  if (loading) {
    return <Loading />
  }

  if (requireAuth && !user) {
    return <Loading />
  }

  if (!requireAuth && user) {
    return <Loading />
  }

  return <>{children}</>
}