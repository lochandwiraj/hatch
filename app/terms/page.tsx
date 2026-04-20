import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Terms & Conditions — <span className="font-qepho">HATCH</span>' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Terms & Conditions</h1>
          <p className="text-sm text-zinc-500">Last updated: April 2025</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Section title="1. Acceptance of Terms">
            <p>By accessing or using <span className="font-qepho">HATCH</span> ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, do not use the Platform. These terms apply to all users including free and paid subscribers.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 18 years old to use <span className="font-qepho">HATCH</span>. By registering, you confirm that the information you provide is accurate and that you are a student or individual interested in student events.</p>
          </Section>

          <Section title="3. Accounts">
            <p>You may only create one account per person. You are responsible for maintaining the confidentiality of your login credentials. Sharing accounts is prohibited and may result in suspension. You must notify us immediately if you suspect unauthorised access.</p>
          </Section>

          <Section title="4. Subscription Plans">
            <p><span className="font-qepho">HATCH</span> offers three tiers: Free, Explorer (₹99/month or ₹999/year), and Professional (₹149/month or ₹1499/year). Subscriptions activate immediately upon successful payment and expire after the duration shown at the time of purchase.</p>
            <p>After expiry, your account automatically downgrades to the Free tier. Paid features are no longer accessible until you renew. Annual plans last 365 days from activation.</p>
          </Section>

          <Section title="5. Payments">
            <p>All payments are processed in INR via Razorpay. By making a payment, you agree to Razorpay's terms of service. <span className="font-qepho">HATCH</span> does not store your payment credentials. All prices are inclusive of applicable taxes where required.</p>
          </Section>

          <Section title="6. Event Access">
            <p>Access to specific events is determined by your active subscription tier at the time of registration. If your subscription expires before an event, you may lose access. <span className="font-qepho">HATCH</span> curates events but is not the organiser and is not responsible for event cancellations, changes, or outcomes.</p>
          </Section>

          <Section title="7. Prohibited Conduct">
            <p>You agree not to: create fake accounts, scrape or copy platform content, share login credentials, attempt to manipulate subscription status, or use the platform for any unlawful purpose. Violations may result in immediate account termination without refund.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>All platform content including design, copy, and curation is owned by <span className="font-qepho">HATCH</span>. You retain ownership of your profile content. You grant <span className="font-qepho">HATCH</span> a non-exclusive licence to display your profile information on the platform.</p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p><span className="font-qepho">HATCH</span> is a discovery and curation platform. We are not responsible for the quality, accuracy, cancellation, or outcome of third-party events listed on the platform. Our total liability to you shall not exceed the amount you paid in the last 30 days.</p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>We may update these terms at any time. We will notify registered users by email at least 7 days before material changes take effect. Continued use after that period constitutes acceptance.</p>
          </Section>

          <Section title="11. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.</p>
          </Section>

          <Section title="12. Contact">
            <p>Questions about these Terms? Email us at <a href="mailto:hatch0258@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">hatch0258@gmail.com</a>.</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
