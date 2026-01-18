'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    full_name: '',
    college: '',
    graduation_year: new Date().getFullYear()
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'graduation_year' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signUp(formData.email, formData.password, {
        username: formData.username,
        full_name: formData.full_name,
        college: formData.college,
        graduation_year: formData.graduation_year
      })
      
      toast.success('Account created successfully! Please check your email to verify your account.')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYear + i)

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Join Hatch</h2>
            <p className="text-neutral-200">Create your account and start managing events</p>
          </div>
          
          <div className="backdrop-blur-glass rounded-xl p-8 border border-white/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
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
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-white mb-2">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="college" className="block text-sm font-medium text-white mb-2">
                    College/Organization
                  </label>
                  <input
                    id="college"
                    name="college"
                    type="text"
                    required
                    value={formData.college}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Enter your college or organization"
                  />
                </div>

                <div>
                  <label htmlFor="graduation_year" className="block text-sm font-medium text-white mb-2">
                    Graduation Year
                  </label>
                  <select
                    id="graduation_year"
                    name="graduation_year"
                    required
                    value={formData.graduation_year}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year} className="bg-primary-800">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-white/30 rounded-lg bg-white/10 text-white placeholder-neutral-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full bg-white text-primary-600 hover:bg-neutral-100"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-neutral-300">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-accent-300 hover:text-accent-200 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}