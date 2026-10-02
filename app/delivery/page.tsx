import LegalPage from '@/components/layout/LegalPage'
import Header from '@/components/layout/Header'
import { Hatch } from '@/components/brand/Hatch'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery Policy, HATCH',
  description:
    'HATCH is a digital subscription platform. Access is granted instantly upon successful payment, with no physical goods shipped.',
  alternates: { canonical: '/delivery' },
}

const SECTIONS = [
  {
    id: 'nature-of-service',
    heading: 'Nature of Service',
    body: (
      <>

            <p><Hatch /> is a fully digital platform. We do not sell or ship any physical goods. All products and services offered are digital in nature, specifically, subscription-based access to our curated student event discovery platform.</p>
      </>
    ),
  },
  {
    id: 'instant-digital-delivery',
    heading: 'Instant Digital Delivery',
    body: (
      <>

            <p>Upon successful payment, your subscription is activated <strong className="text-type-primary">immediately and automatically</strong>. There is no shipping, no wait time, and no physical delivery involved. You will be able to access all features of your chosen plan within seconds of payment confirmation.</p>
      </>
    ),
  },
  {
    id: 'confirmation',
    heading: 'Confirmation',
    body: (
      <>

            <p>After a successful payment you will receive:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>An on-screen confirmation on the platform</li>
              <li>The UPI reference from your own payment app</li>
              <li>Your account dashboard reflecting the upgraded subscription tier immediately</li>
            </ul>
      </>
    ),
  },
  {
    id: 'failed-or-delayed-activation',
    heading: 'Failed or Delayed Activation',
    body: (
      <>

            <p>In the rare case where your payment succeeds but your subscription is not activated within <strong className="text-type-primary">15 minutes</strong>, please contact us immediately. We will investigate and either activate your subscription or process a full refund as per our <Link href="/refund" className="text-signal hover:text-signal">Refund Policy</Link>.</p>
      </>
    ),
  },
  {
    id: 'subscription-access',
    heading: 'Subscription Access',
    body: (
      <>

            <p>Your subscription remains active for the period purchased (30 days or 365 days from the date of payment). Access is tied to your registered account and cannot be transferred. Upon expiry, your account automatically downgrades to the Free tier, no action required.</p>
      </>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <>

            <p>For any delivery or access issues, email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> or call <a href="tel:+917892676997" className="text-signal hover:text-signal">+91 78926 76997</a>. We respond within 48 hours on weekdays.</p>
      </>
    ),
  },
]

export default function DeliveryPage() {
  return (
    <>
      <Header />
      <LegalPage title='Delivery Policy' updated='April 2025' sections={SECTIONS} />
    </>
  )
}
