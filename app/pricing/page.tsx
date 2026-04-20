'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { CheckIcon } from '@heroicons/react/24/outline'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    description: 'Get started for free',
    features: ['5 curated events', 'Basic profile', 'Event browsing', 'Community access'],
  },
  {
    id: 'basic_99',
    name: 'Explorer',
    price: '₹99',
    description: 'For active participants',
    features: ['7 curated events', 'Priority registration', 'Advanced filters', 'Event reminders', 'Profile showcase'],
    popular: true,
  },
  {
    id: 'premium_149',
    name: 'Professional',
    price: '₹149',
    description: 'For serious builders',
    features: ['All events', 'Early access', 'VIP events', 'Networking', 'Career guidance', 'Priority support'],
  },
]

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleGetStarted = (id: string) => {
    if (user) router.push(id === 'free' ? '/dashboard' : '/subscription/upgrade')
    else router.push('/auth')
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-white mb-3">Simple pricing</h1>
          <p className="text-zinc-400">Start free. Upgrade when you need more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`relative bg-[#111111] border rounded-xl p-6 flex flex-col ${
                plan.popular ? 'border-violet-500/40 ring-1 ring-violet-500/10' : 'border-white/[0.07]'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-medium bg-violet-600 text-white px-3 py-0.5 rounded-full">
                  Most popular
                </span>
              )}
              <div className="mb-5">
                <h2 className="text-white font-medium mb-1">{plan.name}</h2>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  {plan.id !== 'free' && <span className="text-xs text-zinc-500">/month</span>}
                </div>
                <p className="text-xs text-zinc-500">{plan.description}</p>
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                    <CheckIcon className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleGetStarted(plan.id)}
                className={`w-full text-sm py-2 rounded-lg transition-colors ${
                  plan.popular
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300'
                }`}
              >
                {user ? (plan.id === 'free' ? 'Go to dashboard' : 'Upgrade now') : 'Get started'}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-[#111111] border border-white/[0.07] rounded-xl p-6">
          <h2 className="text-sm font-medium text-white mb-4">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { q: 'How does payment work?', a: 'We use UPI payments. Your subscription is activated within 24 hours of payment confirmation.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Contact us and we will cancel your subscription. No hidden fees.' },
              { q: 'What are curated events?', a: 'We research 50+ sources to hand-pick only the best hackathons, competitions, and workshops.' },
              { q: 'How is the tier limit counted?', a: 'You can register for up to the limit number of events per subscription period.' },
            ].map(item => (
              <div key={item.q}>
                <p className="text-sm text-white font-medium mb-1">{item.q}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
