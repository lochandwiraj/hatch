'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { motion } from 'motion/react'
import { CheckIcon, ArrowRightIcon, SparklesIcon, BoltIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getEventLimitDescription } from '@/lib/utils'

const CARD = { background: 'rgba(10,10,18,0.8)', border: '1px solid rgba(255,255,255,0.07)' }

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    description: 'Get started for free',
    features: ['5 curated events', 'Basic profile', 'Event browsing', 'Community access'],
    tierColor: 'text-zinc-400',
    dotColor: 'bg-zinc-500',
    badgeStyle: { background: 'rgba(113,113,122,0.1)', border: '1px solid rgba(113,113,122,0.2)', color: '#a1a1aa' },
    checkColor: 'text-zinc-500',
    popular: false,
  },
  {
    id: 'basic_99',
    name: 'Explorer',
    price: '₹99',
    annualPrice: '₹999/yr',
    description: 'For active participants',
    features: ['7 curated events', 'Priority registration', 'Advanced filters', 'Event reminders', 'Profile showcase'],
    tierColor: 'text-sky-400',
    dotColor: 'bg-sky-400',
    badgeStyle: { background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8' },
    checkColor: 'text-sky-400',
    popular: true,
  },
  {
    id: 'premium_149',
    name: 'Professional',
    price: '₹149',
    annualPrice: '₹1499/yr',
    description: 'For serious builders',
    features: ['All events', 'Early access', 'VIP events', 'Networking', 'Career guidance', 'Priority support'],
    tierColor: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    badgeStyle: { background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' },
    checkColor: 'text-emerald-400',
    popular: false,
  },
]

const tierGlow: Record<string, string> = {
  free: 'rgba(113,113,122,0.12)',
  basic_99: 'rgba(56,189,248,0.12)',
  premium_149: 'rgba(52,211,153,0.12)',
}

export default function SubscriptionPage() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const currentTier = profile.subscription_tier
  const currentPlan = plans.find(p => p.id === currentTier)

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="mb-8"
        >
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Subscription</h1>
          <p className="text-sm text-zinc-500">Manage your plan and billing.</p>
        </motion.div>

        {/* Current plan banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
          className="rounded-2xl p-5 mb-8 flex items-center justify-between gap-4"
          style={{ ...CARD, boxShadow: `0 0 32px ${tierGlow[currentTier] ?? 'transparent'}` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${currentPlan?.dotColor ?? 'bg-zinc-500'}`} />
                <p className={`font-bold text-sm ${currentPlan?.tierColor ?? 'text-zinc-400'}`}>
                  {getSubscriptionTierName(currentTier)}
                </p>
              </div>
              {currentTier !== 'free' && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={currentPlan?.badgeStyle}>
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">{getEventLimitDescription(currentTier)}</p>
            {profile.subscription_expires_at && currentTier !== 'free' && (
              <p className="text-xs text-zinc-600 mt-1">
                Renews {new Date(profile.subscription_expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {currentTier === 'free' && (
            <Link href="/subscription/upgrade"
              className="flex-shrink-0 flex items-center gap-1.5 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }}>
              Upgrade
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          )}
        </motion.div>

        {/* Plans */}
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Available plans</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {plans.map((plan, i) => {
            const isCurrent = plan.id === currentTier
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.1 + i * 0.07 }}
                whileHover={!isCurrent ? { y: -3 } : {}}
                className="relative flex flex-col rounded-2xl p-5"
                style={plan.popular && !isCurrent
                  ? { background: 'linear-gradient(145deg, rgba(20,12,45,0.95), rgba(15,10,35,0.95))', border: '1px solid rgba(124,58,237,0.4)', boxShadow: '0 0 32px rgba(124,58,237,0.12)' }
                  : isCurrent
                  ? { ...CARD, boxShadow: `0 0 20px ${tierGlow[currentTier]}` }
                  : CARD}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold text-white px-3 py-1 rounded-full"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}>
                      Most popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={plan.badgeStyle}>
                      Current plan
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-3" style={plan.badgeStyle}>
                    <div className={`w-1.5 h-1.5 rounded-full ${plan.dotColor}`} />
                    {plan.name}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className={`text-3xl font-extrabold ${plan.tierColor}`}>{plan.price}</span>
                    {plan.id !== 'free' && <span className="text-xs text-zinc-500">/month</span>}
                  </div>
                  {plan.annualPrice && <p className="text-xs text-zinc-600">or {plan.annualPrice} (save 17%)</p>}
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                      <CheckIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.checkColor}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="w-full text-sm py-2.5 rounded-xl text-zinc-600 cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    Current plan
                  </button>
                ) : plan.id === 'free' ? (
                  <button disabled className="w-full text-sm py-2.5 rounded-xl text-zinc-600 cursor-not-allowed"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    Free forever
                  </button>
                ) : (
                  <Link href={`/subscription/upgrade?plan=${plan.id}`}
                    className="block text-center text-sm font-semibold py-2.5 rounded-xl transition-all duration-200"
                    style={plan.popular
                      ? { background: 'linear-gradient(135deg, #7c3aed, #6366f1)', color: '#fff', boxShadow: '0 4px 16px rgba(124,58,237,0.3)' }
                      : { background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)', color: '#6ee7b7' }}>
                    {currentTier === 'free' ? 'Upgrade' : 'Switch plan'}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Why HATCH */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.3 }}
          className="rounded-2xl p-6"
          style={CARD}
        >
          <h2 className="text-sm font-bold text-white mb-5">Why choose <span className="font-qepho">HATCH</span>?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: SparklesIcon, title: 'Curated quality', desc: 'We research 50+ sources weekly to bring you the best opportunities.', color: 'text-violet-400', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.2)' },
              { icon: BoltIcon, title: 'Save time', desc: 'Stop scrolling Unstop, Devfolio, LinkedIn. We do it for you.', color: 'text-sky-400', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.2)' },
              { icon: ChartBarIcon, title: 'Track progress', desc: 'Every event is on your profile. Share with recruiters as proof.', color: 'text-emerald-400', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.2)' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm text-white font-semibold mb-1">{item.title}</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  )
}
