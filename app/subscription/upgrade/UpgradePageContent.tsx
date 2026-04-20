'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RazorpayButton from '@/components/payment/RazorpayButton'
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

const plans = {
  basic_99: {
    name: 'Explorer',
    monthlyPrice: 99,
    annualPrice: 999,
    savings: 189,
    features: ['7 curated events', 'Priority registration', 'Advanced filtering', 'Event reminders', 'Profile showcase'],
  },
  premium_149: {
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 1499,
    savings: 289,
    features: ['All events', 'Early access', 'VIP events', 'Networking', 'Career guidance', 'Priority support'],
  },
} as const

type PlanId = keyof typeof plans

export default function UpgradePageContent() {
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('basic_99')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    const p = searchParams.get('plan')
    if (p === 'basic_99' || p === 'premium_149') setSelectedPlan(p)
  }, [searchParams])

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const currentPlan = plans[selectedPlan]
  const finalPrice = billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <Link
        href="/subscription"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to subscription
      </Link>

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white mb-1">Upgrade your plan</h1>
        <p className="text-sm text-zinc-500">Choose the plan that works for you.</p>
      </div>

      {/* Plan selector */}
      <div className="flex gap-3 mb-6">
        {(Object.keys(plans) as PlanId[]).map(id => {
          const p = plans[id]
          const isSelected = selectedPlan === id
          return (
            <button
              key={id}
              onClick={() => setSelectedPlan(id)}
              className={`flex-1 p-4 rounded-xl border text-left transition-colors ${
                isSelected
                  ? 'border-violet-500/40 bg-violet-500/10'
                  : 'border-white/[0.07] bg-[#111111] hover:border-white/[0.14]'
              }`}
            >
              <p className={`text-sm font-medium mb-0.5 ${isSelected ? 'text-white' : 'text-zinc-300'}`}>{p.name}</p>
              <p className={`text-xs ${isSelected ? 'text-violet-300' : 'text-zinc-500'}`}>
                ₹{p.monthlyPrice}/mo
              </p>
            </button>
          )
        })}
      </div>

      {/* Billing toggle */}
      <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-1 flex gap-1 mb-6">
        {(['monthly', 'annual'] as const).map(cycle => (
          <button
            key={cycle}
            onClick={() => setBillingCycle(cycle)}
            className={`flex-1 text-sm py-2 rounded-lg transition-all duration-200 ${
              billingCycle === cycle ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            style={billingCycle === cycle ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' } : {}}
          >
            {cycle === 'monthly' ? 'Monthly' : `Annual · save ₹${currentPlan.savings}`}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-white font-medium">{currentPlan.name}</p>
            <p className="text-xs text-zinc-500">{billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">₹{finalPrice}</p>
            <p className="text-xs text-zinc-500">{billingCycle === 'monthly' ? 'per month' : 'per year'}</p>
          </div>
        </div>
        <ul className="space-y-2.5 mb-6">
          {currentPlan.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-zinc-400">
              <CheckIcon className={`w-4 h-4 flex-shrink-0 ${selectedPlan === 'premium_149' ? 'text-emerald-400' : 'text-sky-400'}`} />
              {f}
            </li>
          ))}
        </ul>
        <RazorpayButton
          tier={selectedPlan}
          amount={finalPrice}
          billingCycle={billingCycle}
        />
      </div>

      <p className="text-xs text-zinc-600 text-center">
        Payments secured by Razorpay. Activates instantly.{' '}
        <a href="/refund" className="text-zinc-500 hover:text-zinc-400 transition-colors underline underline-offset-2">Refund policy</a>
      </p>
    </main>
  )
}
