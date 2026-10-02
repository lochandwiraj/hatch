import type { Metadata } from 'next'
import PricingLedger from './PricingLedger'
import { Glyph } from '@/components/ui/Glyph'
import Header from '@/components/layout/Header'
import PricingCTA from './PricingCTA'

export const metadata: Metadata = {
  title: 'Pricing, Free, Explorer & Professional Plans',
  description: 'Start free with 5 events a month. Explorer raises it to 10 for ₹99, Professional unlocks every event for ₹149.',
  alternates: { canonical: '/pricing' },
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    description: 'Get started for free',
    features: ['5 events per month', 'Free-tier events', '2 manually added events'],
  },
  {
    id: 'basic_99',
    name: 'Explorer',
    price: '₹99',
    description: 'For active participants',
    features: ['10 events per month', 'Free and Explorer events', 'Unlimited manual events'],
    popular: true,
  },
  {
    id: 'premium_149',
    name: 'Professional',
    price: '₹149',
    description: 'For serious builders',
    features: ['Highest monthly limit', 'Every event, all tiers', 'Unlimited manual events'],
  },
]

const pricingJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'HATCH',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'INR', description: '5 events per month' },
    { '@type': 'Offer', name: 'Explorer', price: '99', priceCurrency: 'INR', description: '10 events per month, Explorer-tier listings' },
    { '@type': 'Offer', name: 'Professional', price: '149', priceCurrency: 'INR', description: 'Highest monthly limit, every event at any tier' },
  ],
}

const pricingFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'How does payment work?', acceptedAnswer: { '@type': 'Answer', text: 'Pay by UPI using the QR on the upgrade page, then upload the screenshot. A person checks it and activates your tier, usually within 48 hours.' } },
    { '@type': 'Question', name: 'Can I cancel anytime?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Contact us and we will cancel your subscription. No hidden fees.' } },
    { '@type': 'Question', name: 'What are curated events?', acceptedAnswer: { '@type': 'Answer', text: 'Every event is found and reviewed by a person before it is published, so you only see hackathons, competitions and workshops worth your time.' } },
    { '@type': 'Question', name: 'How is the tier limit counted?', acceptedAnswer: { '@type': 'Answer', text: 'You can register for up to the limit number of events per subscription period (30 or 365 days).' } },
  ],
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      <Header />
      <main className="mx-auto w-full max-w-[1200px] px-4 py-12 lg:px-12">

        <div className="text-center mb-12">
          <h1 className="text-display-m font-semibold text-type-primary mb-3">Pricing for Indian college students</h1>
          <p className="text-type-secondary">Start free. Upgrade when you need more.</p>
        </div>

        {/* Three pricing cards side by side is the banned shape, and the
            wrong one: these tiers differ by a few values, so they belong in
            one comparison table. Phone gets a snapped rail of the same rows. */}
        <div className="mb-12">
          <PricingLedger />
        </div>

        {/* FAQ */}
        <div className="bg-ink-raised border border-rule-strong p-6">
          <h2 className="text-ui font-medium text-type-primary mb-4">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { q: 'How does payment work?', a: 'Pay by UPI using the QR on the upgrade page, then upload the screenshot. A person checks it and activates your tier, usually within 48 hours.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Contact us and we will cancel your subscription. No hidden fees.' },
              { q: 'What are curated events?', a: 'Every event is found and reviewed by a person before it is published. No scraping, no sponsored spam.' },
              { q: 'How is the tier limit counted?', a: 'You can register for up to the limit number of events per subscription period.' },
            ].map(item => (
              <div key={item.q}>
                <p className="text-ui text-type-primary font-medium mb-1">{item.q}</p>
                <p className="text-ui-s text-type-muted leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  )
}
