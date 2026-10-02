import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import FAQAccordion from './FAQAccordion'

export const metadata: Metadata = {
  title: 'FAQ, Hackathons, Student Events & Subscriptions in India',
  description: 'Answers to common questions about HATCH subscriptions, payments, event listings, refunds, and account management.',
  alternates: { canonical: '/faq' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "What's the difference between Explorer and Professional?", acceptedAnswer: { '@type': 'Answer', text: 'Explorer (₹99/month) raises your monthly limit to 10 events and unlocks Explorer-tier listings. Professional (₹149/month) gives the highest monthly limit and access to every event, whatever tier it requires.' } },
    { '@type': 'Question', name: 'Can I upgrade mid-month?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Your new subscription activates immediately after payment and runs for 30 days from that point.' } },
    { '@type': 'Question', name: 'What happens when my subscription expires?', acceptedAnswer: { '@type': 'Answer', text: 'Your account automatically downgrades to the Free tier. You keep your profile and event history, but access to paid-tier events is restricted until you renew.' } },
    { '@type': 'Question', name: 'What payment methods are accepted?', acceptedAnswer: { '@type': 'Answer', text: 'Payment is by UPI. Scan the QR, pay the exact amount, then upload the screenshot with your transaction reference.' } },
    { '@type': 'Question', name: 'Can I get a refund?', acceptedAnswer: { '@type': 'Answer', text: 'Refunds are available for duplicate payments or activation failures. There are no refunds for change of mind after a subscription activates.' } },
    { '@type': 'Question', name: 'How are events curated?', acceptedAnswer: { '@type': 'Answer', text: 'Every event on HATCH is manually reviewed by our team for legitimacy, relevance to students, and quality before going live.' } },
    { '@type': 'Question', name: "Why can't I see some events?", acceptedAnswer: { '@type': 'Answer', text: 'Some events are restricted to Explorer or Professional subscribers. Upgrading your subscription will give you access.' } },
    { '@type': 'Question', name: 'How do I delete my account?', acceptedAnswer: { '@type': 'Answer', text: 'Email hatch@hatchevent.in from your registered email. We will delete your account and all associated data within 30 days.' } },
  ],
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-16 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="max-w-tight lg:col-span-7">
        <div className="mb-12">
          <p className="text-ui-s text-signal uppercase tracking-widest font-medium mb-3">FAQ</p>
          <h1 className="text-display-m font-bold text-type-primary mb-3">Frequently asked questions</h1>
          <p className="text-type-secondary">Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-signal hover:text-signal">Contact us</Link>.</p>
        </div>
        <FAQAccordion />
          </div>

          {/* A running mono sidenote, as the spec asks for at lg. */}
          <aside className="mt-12 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
            <dl className="border-t border-rule">
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Support</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">hatch@hatchevent.in</dd>
              </div>
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Phone</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">+91 7892676997</dd>
              </div>
              <div className="border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">Response</dt>
                <dd className="mt-1 font-sans text-ui-s text-type-secondary">within 48 hours</dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>
    </div>
  )
}
