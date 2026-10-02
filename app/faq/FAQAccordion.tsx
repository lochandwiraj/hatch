'use client'

import { useState, useRef } from 'react'
import { Hatch } from '@/components/brand/Hatch'
import { Glyph } from '@/components/ui/Glyph'
import Link from 'next/link'

const H = () => <Hatch />

const faqs: { group: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    group: 'Subscriptions',
    items: [
      {
        q: "What's the difference between Explorer and Professional?",
        a: 'Explorer (₹99/month) raises your monthly limit to 10 events and unlocks Explorer-tier listings. Professional (₹149/month) gives the highest monthly limit and access to every event, whatever tier it requires.',
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
        a: 'Yes, you save ₹189 on Explorer and ₹289 on Professional compared to paying monthly for 12 months. Annual plans also mean you never worry about renewal for a full year.',
      },
    ],
  },
  {
    group: 'Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'Payment is by UPI. Scan the QR, pay the exact amount, then upload the screenshot with your transaction reference.',
      },
      {
        q: 'My payment went through but subscription did not activate. What do I do?',
        a: <>Email us at <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> with your UPI transaction reference and we will manually activate your subscription within 48 hours or issue a full refund.</>,
      },
      {
        q: 'Is my payment information safe?',
        a: <>Payment goes by UPI straight to us, so there is no gateway in between and no card details anywhere. <Hatch /> keeps only your transaction reference and the screenshot you upload.</>,
      },
      {
        q: 'Can I get a refund?',
        a: <>Refunds are available for duplicate payments or activation failures. There are no refunds for change of mind after a subscription activates. See our full <Link href="/refund" className="text-signal hover:text-signal">Refund Policy</Link> for details.</>,
      },
    ],
  },
  {
    group: 'Events',
    items: [
      {
        q: 'How are events curated?',
        a: <>Every event on <H /> is manually reviewed by our team before it goes live. We check for legitimacy, relevance to students, and quality before adding anything to the platform.</>,
      },
      {
        q: 'Can I suggest an event?',
        a: <>Absolutely. Use the <Link href="/contact" className="text-signal hover:text-signal">Contact page</Link> and select &quot;Event suggestion&quot;, we review every submission and add events that meet our quality bar.</>,
      },
      {
        q: "Why can't I see some events?",
        a: 'Some events are restricted to Explorer or Professional subscribers. If an event shows a lock icon, upgrading your subscription will give you access.',
      },
      {
        q: 'What if I miss an event I registered for?',
        a: <><H /> sends reminders before events. If you miss it, that is between you and the event organiser, <H /> is a discovery platform and does not manage event attendance directly.</>,
      },
    ],
  },
  {
    group: 'Account',
    items: [
      {
        q: 'Can I have multiple accounts?',
        a: <>No. One account per person. Multiple accounts violate our <Link href="/terms" className="text-signal hover:text-signal">Terms & Conditions</Link> and may result in all accounts being suspended.</>,
      },
      {
        q: 'How do I delete my account?',
        a: 'Email hatch@hatchevent.in from your registered email requesting deletion. We will delete your account and all associated data within 30 days.',
      },
      {
        q: 'I signed up with Google but need to add my college details.',
        a: 'A prompt will appear automatically the first time you log in asking for your college and graduation year. You cannot proceed until these are filled in.',
      },
    ],
  },
]

function FAQItem({
  q,
  a,
  open,
  onToggle,
}: {
  q: string
  a: React.ReactNode
  open: boolean
  onToggle: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)

  // Height plus clip-path over 280ms. Height has to be measured because auto
  // does not animate; the reveal itself is clip-path, which is a permitted
  // property. Reduced motion is handled by the global transition override.
  const h = open ? panel.current?.scrollHeight ?? 0 : 0

  return (
    <div className="border-b border-rule">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-touch w-full items-center justify-between gap-4 py-4 text-left"
        >
          <span className="font-sans text-ui text-type-primary">{q}</span>
          <Glyph
            name="chevron"
            size={16}
            className={`shrink-0 text-type-muted ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h3>

      <div
        ref={panel}
        className="overflow-hidden"
        style={{
          height: open ? h : 0,
          clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)',
          transition: 'height 280ms var(--ease-enter), clip-path 280ms var(--ease-enter)',
        }}
        aria-hidden={!open}
      >
        <p className="max-w-tight pb-4 font-serif text-body text-type-secondary">{a}</p>
      </div>
    </div>
  )
}


export default function FAQAccordion() {
  // One open at a time. The key is group plus index, because the index alone
  // repeats across groups and would open two answers at once.
  const [openKey, setOpenKey] = useState<string | null>(null)

  return (
    <div className="space-y-12">
      {faqs.map((group) => (
        <div key={group.group}>
          <h2 className="mb-3 font-sans text-label uppercase text-type-muted">{group.group}</h2>
          <div className="border-t border-rule">
            {group.items.map((item, i) => {
              const key = `${group.group}:${i}`
              return (
                <FAQItem
                  key={key}
                  q={item.q}
                  a={item.a}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
