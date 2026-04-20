'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'motion/react'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      if (error) {
        if (error.message.includes('not found')) toast.error('No account found with this email')
        else throw error
        return
      }
      toast.success('OTP sent to your email!')
      sessionStorage.setItem('reset_email', email)
      router.push('/auth/verify-otp')
    } catch { toast.error('Failed to send OTP. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full orb-drift-1"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="font-qepho text-2xl text-white hover:opacity-80 transition-opacity">HATCH</Link>
          <p className="text-sm text-zinc-500 mt-2">Reset your password</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'rgba(10,10,18,0.9)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl mx-auto mb-5"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <EnvelopeIcon className="w-6 h-6 text-violet-400" />
          </div>
          <h1 className="text-lg font-bold text-white text-center mb-1">Forgot password?</h1>
          <p className="text-sm text-zinc-500 text-center mb-6">Enter your email and we'll send you an OTP to reset it.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email address</label>
              <input type="email" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="yourmail@gmail.com"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
                style={{ background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}>
              {loading ? 'Sending...' : 'Send OTP'}
            </motion.button>
          </form>

          <div className="mt-5 text-center">
            <Link href="/auth" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-3.5 h-3.5" />
              Back to sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
