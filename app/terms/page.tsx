import LegalPage from '@/components/layout/LegalPage'
import Header from '@/components/layout/Header'
import { Hatch } from '@/components/brand/Hatch'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms & Conditions, HATCH', alternates: { canonical: '/terms' } }

const SECTIONS = [
  {
    id: 'acceptance-of-terms',
    heading: 'Acceptance of Terms',
    body: (
      <>

            <p>By accessing or using <Hatch /> ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Platform. These terms apply to all users including free and paid subscribers.</p>
      </>
    ),
  },
  {
    id: 'eligibility',
    heading: 'Eligibility',
    body: (
      <>

            <p>You must be at least 18 years old to use <Hatch />. By registering, you confirm that the information you provide is accurate and that you are a student or individual interested in student events.</p>
      </>
    ),
  },
  {
    id: 'accounts',
    heading: 'Accounts',
    body: (
      <>

            <p>You may only create one account per person. You are responsible for maintaining the confidentiality of your login credentials. Sharing accounts is prohibited and may result in suspension. You must notify us immediately if you suspect unauthorised access.</p>
      </>
    ),
  },
  {
    id: 'subscription-plans',
    heading: 'Subscription Plans',
    body: (
      <>

            <p><Hatch /> offers three tiers: Free, Explorer (₹99/month or ₹999/year), and Professional (₹149/month or ₹1499/year). Subscriptions activate immediately upon successful payment and expire after the duration shown at the time of purchase.</p>
            <p>After expiry, your account automatically downgrades to the Free tier. Paid features are no longer accessible until you renew. Annual plans last 365 days from activation.</p>
      </>
    ),
  },
  {
    id: 'payments',
    heading: 'Payments',
    body: (
      <>

            <p>All payments are made in INR by UPI transfer directly to us. There is no payment gateway and no card processing. <Hatch /> does not store your payment credentials. All prices are inclusive of applicable taxes where required.</p>
      </>
    ),
  },
  {
    id: 'event-access',
    heading: 'Event Access',
    body: (
      <>

            <p>Access to specific events is determined by your active subscription tier at the time of registration. If your subscription expires before an event, you may lose access. <Hatch /> curates events but is not the organiser and is not responsible for event cancellations, changes, or outcomes.</p>
      </>
    ),
  },
  {
    id: 'prohibited-conduct',
    heading: 'Prohibited Conduct',
    body: (
      <>

            <p>You agree not to: create fake accounts, scrape or copy platform content, share login credentials, attempt to manipulate subscription status, or use the platform for any unlawful purpose. Violations may result in immediate account termination without refund.</p>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    heading: 'Intellectual Property',
    body: (
      <>

            <p>All platform content including design, copy, and curation is owned by <Hatch />. You retain ownership of your profile content. You grant <Hatch /> a non-exclusive licence to display your profile information on the platform.</p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    heading: 'Limitation of Liability',
    body: (
      <>

            <p><Hatch /> is a discovery and curation platform. We are not responsible for the quality, accuracy, cancellation, or outcome of third-party events listed on the platform. Our total liability to you shall not exceed the amount you paid in the last 30 days.</p>
      </>
    ),
  },
  {
    id: 'changes-to-terms',
    heading: 'Changes to Terms',
    body: (
      <>

            <p>We may update these terms at any time. We will notify registered users by email at least 7 days before material changes take effect. Continued use after that period constitutes acceptance.</p>
      </>
    ),
  },
  {
    id: 'governing-law',
    heading: 'Governing Law',
    body: (
      <>

            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.</p>
      </>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <>

            <p>Questions about these Terms? Email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> or call <a href="tel:+917892676997" className="text-signal hover:text-signal">+91 78926 76997</a>.</p>
            <p className="mt-1"><strong className="text-type-primary">Address:</strong> #165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru South, Bengaluru, Karnataka – 560018</p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <>
      <Header />
      <LegalPage title='Terms & Conditions' updated='April 2025' sections={SECTIONS} />
    </>
  )
}
