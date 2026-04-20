import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import FAQAccordion from './FAQAccordion'

export const metadata: Metadata = {
  title: 'FAQ — Frequently Asked Questions',
  description: 'Answers to common questions about HATCH subscriptions, payments, event listings, refunds, and account management.',
  alternates: { canonical: '/faq' },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: "What's the difference between Explorer and Professional?", acceptedAnswer: { '@type': 'Answer', text: 'Explorer (₹99/month) gives you 7 curated events per week, priority registration, and advanced filtering. Professional (₹149/month) gives access to all events including VIP and early access events, networking, career guidance, and priority support.' } },
    { '@type': 'Question', name: 'Can I upgrade mid-month?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Your new subscription activates immediately after payment and runs for 30 days from that point.' } },
    { '@type': 'Question', name: 'What happens when my subscription expires?', acceptedAnswer: { '@type': 'Answer', text: 'Your account automatically downgrades to the Free tier. You keep your profile and event history, but access to paid-tier events is restricted until you renew.' } },
    { '@type': 'Question', name: 'What payment methods are accepted?', acceptedAnswer: { '@type': 'Answer', text: 'We accept UPI (GPay, PhonePe, Paytm), debit cards, credit cards, and net banking via Razorpay.' } },
    { '@type': 'Question', name: 'Can I get a refund?', acceptedAnswer: { '@type': 'Answer', text: 'Refunds are available for duplicate payments or activation failures. There are no refunds for change of mind after a subscription activates.' } },
    { '@type': 'Question', name: 'How are events curated?', acceptedAnswer: { '@type': 'Answer', text: 'Every event on HATCH is manually reviewed by our team for legitimacy, relevance to students, and quality before going live.' } },
    { '@type': 'Question', name: "Why can't I see some events?", acceptedAnswer: { '@type': 'Answer', text: 'Some events are restricted to Explorer or Professional subscribers. Upgrading your subscription will give you access.' } },
    { '@type': 'Question', name: 'How do I delete my account?', acceptedAnswer: { '@type': 'Answer', text: 'Email hatch0258@gmail.com from your registered email. We will delete your account and all associated data within 30 days.' } },
  ],
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">FAQ</p>
          <h1 className="text-3xl font-bold text-white mb-3">Frequently asked questions</h1>
          <p className="text-zinc-400">Can&apos;t find what you&apos;re looking for? <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">Contact us</Link>.</p>
        </div>
        <FAQAccordion />
      </main>
    </div>
  )
}
