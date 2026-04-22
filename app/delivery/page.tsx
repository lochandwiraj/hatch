import Header from '@/components/layout/Header'
import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Delivery Policy — HATCH',
  description: 'HATCH is a digital subscription platform. Access is granted instantly upon successful payment — no shipping or wait time involved.',
  alternates: { canonical: '/delivery' },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function DeliveryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Delivery Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: April 2025</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Section title="1. Nature of Service">
            <p><span className="font-qepho">HATCH</span> is a fully digital platform. We do not sell or ship any physical goods. All products and services offered are digital in nature — specifically, subscription-based access to our curated student event discovery platform.</p>
          </Section>

          <Section title="2. Instant Digital Delivery">
            <p>Upon successful payment, your subscription is activated <strong className="text-zinc-300">immediately and automatically</strong>. There is no shipping, no wait time, and no physical delivery involved. You will be able to access all features of your chosen plan within seconds of payment confirmation.</p>
          </Section>

          <Section title="3. Confirmation">
            <p>After a successful payment you will receive:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>An on-screen confirmation on the platform</li>
              <li>A payment confirmation from Razorpay to your registered email</li>
              <li>Your account dashboard reflecting the upgraded subscription tier immediately</li>
            </ul>
          </Section>

          <Section title="4. Failed or Delayed Activation">
            <p>In the rare case where your payment succeeds but your subscription is not activated within <strong className="text-zinc-300">15 minutes</strong>, please contact us immediately. We will investigate and either activate your subscription or process a full refund as per our <Link href="/refund" className="text-violet-400 hover:text-violet-300 transition-colors">Refund Policy</Link>.</p>
          </Section>

          <Section title="5. Subscription Access">
            <p>Your subscription remains active for the period purchased (30 days or 365 days from the date of payment). Access is tied to your registered account and cannot be transferred. Upon expiry, your account automatically downgrades to the Free tier — no action required.</p>
          </Section>

          <Section title="6. Contact">
            <p>For any delivery or access issues, email <a href="mailto:hatch@hatchevent.in" className="text-violet-400 hover:text-violet-300 transition-colors">hatch@hatchevent.in</a> or call <a href="tel:+917892676997" className="text-violet-400 hover:text-violet-300 transition-colors">+91 78926 76997</a>. We respond within 48 hours on weekdays.</p>
          </Section>
        </div>
      </main>
    </div>
  )
}
