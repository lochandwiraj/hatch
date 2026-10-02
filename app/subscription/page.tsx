'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import BillingHistory from '@/components/subscription/BillingHistory'
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus'
import TierLedger from '@/components/subscription/TierLedger'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { getSubscriptionTierName, getEventLimitDescription } from '@/lib/utils'

const CARD = { background: 'var(--ink-raised)', border: '1px solid var(--rule)' }

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    description: 'Get started for free',
    features: ['5 events per month', 'Free-tier events', '2 manually added events'],
    tierColor: 'text-type-secondary',
    dotColor: 'bg-ink-raised',
    badgeStyle: { background: 'var(--ink-raised)', border: '1px solid var(--rule)', color: 'var(--type-secondary)' },
    checkColor: 'text-type-muted',
    popular: false,
  },
  {
    id: 'basic_99',
    name: 'Explorer',
    price: '₹99',
    annualPrice: '₹999/yr',
    description: 'For active participants',
    features: ['10 events per month', 'Free and Explorer events', 'Unlimited manual events'],
    tierColor: 'text-type-secondary',
    dotColor: 'bg-ink-raised',
    badgeStyle: { background: 'var(--ink-raised)', border: '1px solid var(--rule)', color: 'var(--type-secondary)' },
    checkColor: 'text-type-secondary',
    popular: true,
  },
  {
    id: 'premium_149',
    name: 'Professional',
    price: '₹149',
    annualPrice: '₹1499/yr',
    description: 'For serious builders',
    features: ['Highest monthly limit', 'Every event, all tiers', 'Unlimited manual events'],
    tierColor: 'text-verified',
    dotColor: 'bg-verified',
    badgeStyle: { background: 'var(--verified)', border: '1px solid var(--verified)', color: 'var(--verified)' },
    checkColor: 'text-verified',
    popular: false,
  },
]

const tierGlow: Record<string, string> = {
  free: 'var(--rule)',
  basic_99: 'var(--rule)',
  premium_149: 'var(--verified)',
}

export default function SubscriptionPage() {
  const router = useRouter()
  const { profile } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="px-4 py-16 lg:px-12" role="status" aria-live="polite">
          <p data-mono className="text-mono text-type-secondary">Loading</p>
          <div className="mt-3 h-px w-full bg-rule">
            <div className="h-px w-1/3 bg-signal" />
          </div>
        </div>
      </div>
    )
  }

  const currentTier = profile.subscription_tier
  const currentPlan = plans.find(p => p.id === currentTier)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">

        {/* Page header */}
        <div
          className="mb-8"
        >
          <h1 className="font-display text-display-m text-type-primary">Subscription</h1>
          <p className="mt-2 max-w-tight font-serif text-body text-type-secondary">Manage your plan and billing.</p>
        </div>

        <h2 className="mb-3 border-b border-rule pb-2 font-display text-title uppercase text-type-primary">Your plan</h2>
        <div className="mb-8">
          <SubscriptionStatus />
        </div>

        <div className="mb-8">
          <BillingHistory />
        </div>

        {/* One comparison ledger, not three cards. */}
        <div className="mb-12">
          <TierLedger
            currentTier={currentTier}
            // Without this the Choose buttons rendered and did nothing:
            // TierLedger calls onChoose?.() and no one passed one.
            onChoose={(tier, annual) =>
              router.push(`/subscription/upgrade?tier=${tier}&cycle=${annual ? 'annual' : 'monthly'}`)
            }
          />
        </div>

        {/* Why this exists. A ruled list: the coloured icon blocks were
            decoration whose colour variable had already been removed, leaving
            flat squares with an invisible glyph inside them. */}
        <section aria-labelledby="why-heading">
          <h2 id="why-heading" className="border-b border-rule pb-2 font-display text-title uppercase text-type-primary">
            Why <Hatch />
          </h2>
          <dl>
            {[
              {
                t: 'Curated by a person',
                d: 'Every opportunity is found and reviewed by hand before it reaches you. No scraping, no sponsored spam.',
              },
              {
                t: 'Less searching',
                d: 'Stop checking Unstop, Devfolio and LinkedIn separately. The index is one place.',
              },
              {
                t: 'A record you can share',
                d: 'Every event you attend lands on your profile, and exports as a PDF for recruiters.',
              },
            ].map(({ t, d }) => (
              <div key={t} className="grid grid-cols-1 gap-1 border-b border-rule py-4 lg:grid-cols-12 lg:gap-6">
                <dt className="font-sans text-ui text-type-primary lg:col-span-4">{t}</dt>
                <dd className="max-w-measure font-serif text-ui-s text-type-secondary lg:col-span-8">{d}</dd>
              </div>
            ))}
          </dl>
        </section>

      </main>
    </div>
  )
}

