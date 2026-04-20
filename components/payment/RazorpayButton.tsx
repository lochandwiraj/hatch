'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface RazorpayButtonProps {
  tier: 'basic_99' | 'premium_149'
  amount: number
  billingCycle: 'monthly' | 'annual'
}

declare global {
  interface Window {
    Razorpay: any
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function RazorpayButton({ tier, amount, billingCycle }: RazorpayButtonProps) {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const tierName = tier === 'basic_99' ? 'Explorer' : 'Professional'
  const durationLabel = billingCycle === 'annual' ? '365 days' : '30 days'

  const handlePayment = async () => {
    if (!user || !profile) { toast.error('Please log in to continue.'); return }
    setLoading(true)

    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Payment service unavailable. Check your internet connection.')
        return
      }

      // Step 1: Create order on server
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          tier,
          billingCycle,
          userId: user.id,
          userEmail: user.email,
          userName: profile.full_name,
        }),
      })
      const order = await orderRes.json()
      if (!orderRes.ok) {
        toast.error(order.error || 'Failed to initiate payment. Try again.')
        return
      }

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'HATCH',
        description: `${tierName} · ${durationLabel}`,
        order_id: order.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          // Step 3: Verify payment on server and activate subscription
          const verifyRes = await fetch('/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user.id,
              tier,
              billingCycle,
              amount,
            }),
          })
          const result = await verifyRes.json()

          if (verifyRes.ok && result.success) {
            toast.success(`🎉 ${tierName} activated for ${durationLabel}!`)
            await refreshProfile?.()
            router.push('/dashboard')
          } else {
            toast.error(result.error || 'Payment verified but activation failed. Contact support.')
          }
          setLoading(false)
        },
        prefill: {
          name: profile.full_name || '',
          email: user.email || '',
        },
        theme: { color: '#7c3aed' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response: any) => {
        toast.error(`Payment failed: ${response.error.description}`)
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      console.error('Razorpay error:', err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
        boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.3)',
      }}
    >
      {loading ? 'Processing...' : `Pay ₹${amount}`}
    </button>
  )
}
