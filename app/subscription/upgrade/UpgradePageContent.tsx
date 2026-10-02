'use client'

import { useState, useEffect } from 'react'
import { formatRupees } from '@/lib/tier'
import QRPaymentModal from '@/components/payment/QRPaymentModal'
import TierLedger from '@/components/subscription/TierLedger'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
const plans = {
  basic_99: {
    name: 'Explorer',
    monthlyPrice: 99,
    annualPrice: 999,
    savings: 189,
    features: ['10 events per month', 'Free and Explorer events', 'Unlimited manual events'],
  },
  premium_149: {
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 1499,
    savings: 289,
    features: ['Highest monthly limit', 'Every event, all tiers', 'Unlimited manual events'],
  },
} as const

type PlanId = keyof typeof plans

export default function UpgradePageContent() {
  const [qrOpen, setQrOpen] = useState(false)
  const { profile } = useAuth()
  const searchParams = useSearchParams()
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('basic_99')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  useEffect(() => {
    // /pricing and /subscription both link here as ?tier=&cycle=. This read
    // ?plan= and never read the cycle at all, so choosing Professional on the
    // pricing page arrived as Explorer, billed monthly.
    const tier = searchParams.get('tier') ?? searchParams.get('plan')
    if (tier === 'basic_99' || tier === 'premium_149') setSelectedPlan(tier)
    const cycle = searchParams.get('cycle')
    if (cycle === 'annual' || cycle === 'monthly') setBillingCycle(cycle)
  }, [searchParams])

  if (!profile) {
    return (
      <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
        </div>
    )
  }

  const currentPlan = plans[selectedPlan]
  const finalPrice = billingCycle === 'annual' ? currentPlan.annualPrice : currentPlan.monthlyPrice

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 lg:px-8 py-8">

      <Link
        href="/subscription"
        className="inline-flex items-center gap-2 text-ui text-type-secondary hover:text-type-primary mb-6"
      >
        <Glyph name="arrow-left" className="w-4 h-4" />
        Back to subscription
      </Link>

      <div className="mb-8">
        <h1 className="text-title font-semibold text-type-primary mb-1">Upgrade your plan</h1>
        <p className="text-ui text-type-muted">Choose the plan that works for you.</p>
      </div>

      {/* One comparison ledger, as /pricing uses. Choosing a tier here sets
          the selection the summary below checks out. Checkmark lists
          are banned, so the ledger's filled/outline marks carry presence. */}
      <TierLedger
        currentTier={profile.subscription_tier}
        onChoose={(tier, annual) => {
          setSelectedPlan(tier as PlanId)
          setBillingCycle(annual ? 'annual' : 'monthly')
        }}
      />

      <div className="mt-8 border border-rule p-4">
        <div className="flex items-start justify-between gap-4 border-b border-rule pb-4">
          <div>
            <p className="font-sans text-ui text-type-primary">{currentPlan.name}</p>
            <p className="font-sans text-ui-s text-type-muted">
              {billingCycle === 'monthly' ? 'Billed monthly' : 'Billed annually'}
            </p>
          </div>
          <div className="text-right">
            <span className="font-display text-mono-l text-type-primary">{formatRupees(finalPrice)}</span>
            <p data-mono className="text-mono text-type-muted">
              {billingCycle === 'monthly' ? 'per month' : 'per year'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setQrOpen(true)}
          className="flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
        >
          Pay {formatRupees(finalPrice)} by UPI
        </button>
      </div>

      <QRPaymentModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        selectedTier={selectedPlan}
        amount={finalPrice}
        billingCycle={billingCycle}
      />

      <p className="text-ui-s text-type-muted text-center">
        Scan the QR, pay, then upload the screenshot. A person checks it and activates your tier, usually within 48 hours.{' '}
        <a href="/refund" className="text-type-muted hover:text-type-secondary underline underline-offset-2">Refund policy</a>
      </p>
    </main>
  )
}
