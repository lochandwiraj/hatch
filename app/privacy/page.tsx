import LegalPage from '@/components/layout/LegalPage'
import Header from '@/components/layout/Header'
import { Hatch } from '@/components/brand/Hatch'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy, HATCH', alternates: { canonical: '/privacy' } }

const SECTIONS = [
  {
    id: 'what-we-collect',
    heading: 'What We Collect',
    body: (
      <>

            <p>When you create an account, we collect: your name, email address, username, college name, and graduation year. When you pay for a subscription, we receive the UPI transaction reference you enter and the screenshot you upload. We do not collect or store card numbers, UPI IDs, or any other payment credentials.</p>
            <p>We also collect basic usage data such as pages visited and events viewed to improve the platform.</p>
      </>
    ),
  },
  {
    id: 'what-we-do-not-collect',
    heading: 'What We Do Not Collect',
    body: (
      <>

            <p>We do not store card numbers, CVVs, UPI IDs, bank account details, or any sensitive payment information. Payment is a direct UPI transfer, so there is no payment processor involved and we never see your banking credentials.</p>
      </>
    ),
  },
  {
    id: 'how-we-use-your-data',
    heading: 'How We Use Your Data',
    body: (
      <>

            <p>Your data is used to: create and manage your account, activate and track your subscription, personalise event recommendations, send event reminders and platform updates, and respond to support requests.</p>
            <p>We do not use your data for advertising or sell it to third parties.</p>
      </>
    ),
  },
  {
    id: 'who-we-share-data-with',
    heading: 'Who We Share Data With',
    body: (
      <>

            <p>Payments are made by UPI transfer directly to us, so no payment processor receives your details. We store the transaction reference and the screenshot you upload, and nothing else about the payment.</p>
            <p><strong className="text-type-primary">Supabase</strong>, stores your account and profile data securely in encrypted databases hosted in compliance with data protection standards.</p>
            <p>We do not share your data with any other third parties, advertisers, or analytics companies.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    heading: 'Cookies',
    body: (
      <>

            <p>We use session cookies only, these are required to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
      </>
    ),
  },
  {
    id: 'data-retention',
    heading: 'Data Retention',
    body: (
      <>

            <p>Your data is retained for as long as your account is active. If you request account deletion, we will delete all your personal data within 30 days, except where retention is required by law (e.g., payment records).</p>
      </>
    ),
  },
  {
    id: 'your-rights',
    heading: 'Your Rights',
    body: (
      <>

            <p>You have the right to: access the data we hold about you, correct inaccurate information, request deletion of your account and data, and opt out of non-essential communications.</p>
            <p>To exercise any of these rights, email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> from your registered email address.</p>
      </>
    ),
  },
  {
    id: 'security',
    heading: 'Security',
    body: (
      <>

            <p>All data is stored using Supabase's encrypted infrastructure. All communication between your browser and our platform uses HTTPS. We apply access controls so that only authorised team members can access user data.</p>
      </>
    ),
  },
  {
    id: 'children-s-privacy',
    heading: "9. Children's Privacy",
    body: (
      <>

            <p><Hatch /> is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us and we will delete it promptly.</p>
      </>
    ),
  },
  {
    id: 'compliance',
    heading: 'Compliance',
    body: (
      <>

            <p>This policy is designed to comply with India's Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
      </>
    ),
  },
  {
    id: 'changes-to-this-policy',
    heading: 'Changes to This Policy',
    body: (
      <>

            <p>We may update this policy. We will notify you by email before material changes take effect. Continued use of the platform after that date constitutes acceptance of the updated policy.</p>
      </>
    ),
  },
  {
    id: 'grievance-redressal',
    heading: 'Grievance Redressal',
    body: (
      <>

            <p>In accordance with the Information Technology Act, 2000 and the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the details of the Grievance Officer are as follows:</p>
            <div className="mt-3 p-4 space-y-1" style={{ background: 'var(--ink-raised)', border: '1px solid var(--rule)' }}>
              <p><strong className="text-type-primary">Name:</strong> Dwiraj S</p>
              <p><strong className="text-type-primary">Designation:</strong> Founder</p>
              <p><strong className="text-type-primary">Email:</strong> <a href="mailto:dwiraj06@gmail.com" className="text-signal hover:text-signal">dwiraj06@gmail.com</a></p>
              <p><strong className="text-type-primary">Phone:</strong> <a href="tel:+917892676997" className="text-signal hover:text-signal">+91 78926 76997</a></p>
              <p><strong className="text-type-primary">Address:</strong> #165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru South, Bengaluru, Karnataka – 560018</p>
            </div>
            <p className="mt-2">Complaints will be acknowledged within <strong className="text-type-primary">48 hours</strong> and resolved within <strong className="text-type-primary">one month</strong> of receipt.</p>
      </>
    ),
  },
  {
    id: 'contact',
    heading: 'Contact',
    body: (
      <>

            <p>Privacy questions? Email <a href="mailto:hatch@hatchevent.in" className="text-signal hover:text-signal">hatch@hatchevent.in</a> or call <a href="tel:+917892676997" className="text-signal hover:text-signal">+91 78926 76997</a>.</p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <LegalPage title='Privacy Policy' updated='April 2025' sections={SECTIONS} />
    </>
  )
}
