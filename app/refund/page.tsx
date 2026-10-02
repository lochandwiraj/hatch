import LegalPage from '@/components/layout/LegalPage'
import Header from '@/components/layout/Header'
import { Hatch } from '@/components/brand/Hatch'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Refund & Cancellation Policy, HATCH', alternates: { canonical: '/refund' } }

const SECTIONS = [
  {
    id: 'general-policy',
    heading: 'General Policy',
    body: (
      <>

            <p>All subscription payments on <Hatch /> are final once the subscription has been successfully activated. We do not offer refunds for change of mind, partial months used, or subscriptions that have already been utilised to access events.</p>
      </>
    ),
  },
  {
    id: 'when-refunds-are-issued',
    heading: 'When Refunds Are Issued',
    body: (
      <>

            <p>We will issue a full refund in the following cases:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-type-primary">Duplicate payment</strong>, you were charged more than once for the same subscription period.</li>
              <li><strong className="text-type-primary">Payment deducted but subscription not activated</strong>, your money was taken but your account was not upgraded.</li>
              <li><strong className="text-type-primary">Technical error on our end</strong>, a verified error caused by <Hatch />'s payment or subscription system.</li>
            </ul>
      </>
    ),
  },
  {
    id: 'how-to-request-a-refund',
    heading: 'How to Request a Refund',
    body: (
      <>

            <p>Email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> within <strong className="text-type-primary">48 hours</strong> of the payment with the following:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your registered email address</li>
              <li>Your UPI transaction reference</li>
              <li>Description of the issue</li>
            </ul>
            <p>We will respond within 48 hours and process approved refunds within 5–7 business days to your original payment method.</p>
      </>
    ),
  },
  {
    id: 'non-refundable-cases',
    heading: 'Non-Refundable Cases',
    body: (
      <>

            <p>Refunds will not be issued for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Change of mind after subscription activates</li>
              <li>Unused portion of an active subscription</li>
              <li>Account suspension due to Terms & Conditions violations</li>
              <li>Requests made more than 48 hours after payment</li>
              <li>Free tier, no charges apply</li>
            </ul>
      </>
    ),
  },
  {
    id: 'subscription-cancellation',
    heading: 'Subscription Cancellation',
    body: (
      <>

            <p><Hatch /> subscriptions are not auto-renewing. Each subscription runs for the duration shown at purchase (30 days or 365 days) and simply expires after that period, no action needed to cancel. Your account downgrades to Free automatically upon expiry.</p>
      </>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <>

            <p>For any refund queries, email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a>, call <a href="tel:+917892676997" className="text-signal hover:text-signal">+91 78926 76997</a>, or use our <Link href="/contact" className="text-signal hover:text-signal">Contact page</Link>.</p>
      </>
    ),
  },
]

export default function RefundPage() {
  return (
    <>
      <Header />
      <LegalPage title='Refund & Cancellation Policy' updated='April 2025' sections={SECTIONS} />
    </>
  )
}
