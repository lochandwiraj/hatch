'use client'

import Header from './Header'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}