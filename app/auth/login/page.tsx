'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from '@/lib/auth'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(email, password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-neutral-200">Sign in to your HATCH account</p>
          </div>
          
          <div className="backdrop-blur-glass rounded-xl p-8 border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-accent-300 hover:text-accent-200 text-sm"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-white text-primary-600 hover:bg-neutral-100"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-neutral-300">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-accent-300 hover:text-accent-200 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}