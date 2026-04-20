import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata = { title: 'Privacy Policy — HATCH' }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      <div className="text-sm text-zinc-400 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-zinc-500">Last updated: April 2025</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <Section title="1. What We Collect">
            <p>When you create an account, we collect: your name, email address, username, college name, and graduation year. When you pay for a subscription, we receive your Razorpay transaction ID and payment status. We do not collect or store card numbers, UPI IDs, or any other payment credentials.</p>
            <p>We also collect basic usage data such as pages visited and events viewed to improve the platform.</p>
          </Section>

          <Section title="2. What We Do Not Collect">
            <p>We do not store card numbers, CVVs, UPI IDs, bank account details, or any sensitive payment information. All payment processing is handled entirely by Razorpay. We never have access to your raw payment credentials.</p>
          </Section>

          <Section title="3. How We Use Your Data">
            <p>Your data is used to: create and manage your account, activate and track your subscription, personalise event recommendations, send event reminders and platform updates, and respond to support requests.</p>
            <p>We do not use your data for advertising or sell it to third parties.</p>
          </Section>

          <Section title="4. Who We Share Data With">
            <p><strong className="text-zinc-300">Razorpay</strong> — processes your payments. They receive your name and email as part of the payment flow.</p>
            <p><strong className="text-zinc-300">Supabase</strong> — stores your account and profile data securely in encrypted databases hosted in compliance with data protection standards.</p>
            <p>We do not share your data with any other third parties, advertisers, or analytics companies.</p>
          </Section>

          <Section title="5. Cookies">
            <p>We use session cookies only — these are required to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>Your data is retained for as long as your account is active. If you request account deletion, we will delete all your personal data within 30 days, except where retention is required by law (e.g., payment records).</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to: access the data we hold about you, correct inaccurate information, request deletion of your account and data, and opt out of non-essential communications.</p>
            <p>To exercise any of these rights, email <a href="mailto:hatch0258@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">hatch0258@gmail.com</a> from your registered email address.</p>
          </Section>

          <Section title="8. Security">
            <p>All data is stored using Supabase's encrypted infrastructure. All communication between your browser and our platform uses HTTPS. We apply access controls so that only authorised team members can access user data.</p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>HATCH is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us and we will delete it promptly.</p>
          </Section>

          <Section title="10. Compliance">
            <p>This policy is designed to comply with India's Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023 (DPDP Act).</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this policy. We will notify you by email before material changes take effect. Continued use of the platform after that date constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="12. Contact">
            <p>Privacy questions? Email <a href="mailto:hatch0258@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">hatch0258@gmail.com</a>.</p>
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
