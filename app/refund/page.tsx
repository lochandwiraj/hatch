import Header from '@/components/layout/Header'
import Link from 'next/link'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Refund & Cancellation Policy — HATCH' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Refund & Cancellation Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: April 2025</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Section title="1. General Policy">
            <p>All subscription payments on <span className="font-qepho">HATCH</span> are final once the subscription has been successfully activated. We do not offer refunds for change of mind, partial months used, or subscriptions that have already been utilised to access events.</p>
          </Section>

          <Section title="2. When Refunds Are Issued">
            <p>We will issue a full refund in the following cases:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-zinc-300">Duplicate payment</strong> — you were charged more than once for the same subscription period.</li>
              <li><strong className="text-zinc-300">Payment deducted but subscription not activated</strong> — your money was taken but your account was not upgraded.</li>
              <li><strong className="text-zinc-300">Technical error on our end</strong> — a verified error caused by <span className="font-qepho">HATCH</span>'s payment or subscription system.</li>
            </ul>
          </Section>

          <Section title="3. How to Request a Refund">
            <p>Email <a href="mailto:hatch0258@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">hatch0258@gmail.com</a> within <strong className="text-zinc-300">48 hours</strong> of the payment with the following:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Your registered email address</li>
              <li>Razorpay Payment ID (found in your payment confirmation)</li>
              <li>Description of the issue</li>
            </ul>
            <p>We will respond within 48 hours and process approved refunds within 5–7 business days to your original payment method.</p>
          </Section>

          <Section title="4. Non-Refundable Cases">
            <p>Refunds will not be issued for:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Change of mind after subscription activates</li>
              <li>Unused portion of an active subscription</li>
              <li>Account suspension due to Terms & Conditions violations</li>
              <li>Requests made more than 48 hours after payment</li>
              <li>Free tier — no charges apply</li>
            </ul>
          </Section>

          <Section title="5. Subscription Cancellation">
            <p><span className="font-qepho">HATCH</span> subscriptions are not auto-renewing. Each subscription runs for the duration shown at purchase (30 days or 365 days) and simply expires after that period — no action needed to cancel. Your account downgrades to Free automatically upon expiry.</p>
          </Section>

          <Section title="6. Razorpay Dispute Process">
            <p>If you are unsatisfied with our resolution, you may also raise a payment dispute directly through Razorpay via your bank or payment provider. We cooperate fully with Razorpay's dispute resolution process.</p>
          </Section>

          <Section title="7. Contact">
            <p>For any refund queries, email <a href="mailto:hatch0258@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">hatch0258@gmail.com</a> or use our <Link href="/contact" className="text-violet-400 hover:text-violet-300 transition-colors">Contact page</Link>.</p>
          </Section>
        </div>
      </main>

    </div>
  )
}
