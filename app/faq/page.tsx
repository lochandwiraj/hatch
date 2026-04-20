'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const faqs = [
  {
    group: 'Subscriptions',
    items: [
      {
        q: "What's the difference between Explorer and Professional?",
        a: "Explorer (₹99/month) gives you access to 7 curated events per week, priority registration, and advanced filtering. Professional (₹149/month) gives you access to all events including VIP and early access events, networking opportunities, career guidance, and priority support.",
      },
      {
        q: 'Can I upgrade mid-month?',
        a: 'Yes. You can upgrade at any time. Your new subscription activates immediately after payment and runs for 30 days (or 365 days for annual) from that point.',
      },
      {
        q: 'What happens when my subscription expires?',
        a: 'Your account automatically downgrades to the Free tier. You keep your profile and event history, but access to paid-tier events is restricted until you renew.',
      },
      {
        q: 'Is annual billing worth it?',
        a: 'Yes — you save ₹189 on Explorer and ₹289 on Professional compared to paying monthly for 12 months. Annual plans also mean you never worry about renewal for a full year.',
      },
    ],
  },
  {
    group: 'Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major payment methods via Razorpay — UPI (GPay, PhonePe, Paytm), debit cards, credit cards, and net banking.',
      },
      {
        q: 'My payment went through but subscription did not activate. What do I do?',
        a: 'This is rare but can happen. Email us at hatch0258@gmail.com with your Razorpay payment ID and we will manually activate your subscription within 48 hours or issue a full refund.',
      },
      {
        q: 'Is my payment information safe?',
        a: 'Yes. All payments are processed by Razorpay — we never see or store your card or UPI details. Razorpay is PCI-DSS compliant and RBI regulated.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Refunds are available for duplicate payments or activation failures. There are no refunds for change of mind after a subscription activates. See our full Refund Policy for details.',
      },
    ],
  },
  {
    group: 'Events',
    items: [
      {
        q: 'How are events curated?',
        a: 'Every event on HATCH is manually reviewed by our team before it goes live. We check for legitimacy, relevance to students, and quality before adding anything to the platform.',
      },
      {
        q: 'Can I suggest an event?',
        a: 'Absolutely. Use the Contact page and select "Event suggestion" — we review every submission and add events that meet our quality bar.',
      },
      {
        q: "Why can't I see some events?",
        a: 'Some events are restricted to Explorer or Professional subscribers. If an event shows a lock icon, upgrading your subscription will give you access.',
      },
      {
        q: 'What if I miss an event I registered for?',
        a: "We send reminders before events. If you miss it, that's between you and the event organiser — HATCH is a discovery platform and doesn't manage event attendance directly.",
      },
    ],
  },
  {
    group: 'Account',
    items: [
      {
        q: 'Can I have multiple accounts?',
        a: 'No. One account per person. Multiple accounts violate our Terms & Conditions and may result in all accounts being suspended.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Email hatch0258@gmail.com from your registered email requesting deletion. We will delete your account and all associated data within 30 days.',
      },
      {
        q: 'I signed up with Google but need to add my college details.',
        a: "A prompt will appear automatically the first time you log in asking for your college and graduation year. You can't proceed until these are filled in.",
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: open ? 'rgba(124,58,237,0.04)' : 'rgba(255,255,255,0.02)' }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-medium text-zinc-200">{q}</span>
        <ChevronDownIcon className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-zinc-400 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">FAQ</p>
          <h1 className="text-3xl font-bold text-white mb-3">Frequently asked questions</h1>
          <p className="text-zinc-400">Can't find what you're looking for? <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">Contact us</Link>.</p>
        </div>

        <div className="space-y-10">
          {faqs.map(group => (
            <div key={group.group}>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">{group.group}</h2>
              <div className="space-y-2">
                {group.items.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
