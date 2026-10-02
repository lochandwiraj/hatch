import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact, Get in Touch',
  description: 'Get in touch with the HATCH team. Payment issues, event suggestions, or general questions, we read every message and respond within 24–48 hours.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-[1200px] px-4 py-16 lg:px-12">
        <div className="mb-12">
          <p className="text-ui-s text-signal uppercase tracking-widest font-medium mb-3">Contact</p>
          <h1 className="text-display-m font-bold text-type-primary mb-3">We're here to help</h1>
          <p className="text-type-secondary">Got a question, payment issue, or event suggestion? We read every message.</p>
        </div>
        <ContactForm />

        {/* Grievance Redressal Officer. A statutory disclosure, so it reads as a
            record: ruled rows, no card, no decoration. */}
        <section className="mt-16 border-t border-rule-strong pt-6" aria-labelledby="grievance-heading">
          <h2 id="grievance-heading" className="font-display text-title uppercase text-type-primary">
            Grievance officer
          </h2>
          <p className="mt-1 max-w-measure font-sans text-ui-s text-type-muted">
            As required under the IT (Intermediary Guidelines) Rules, 2021. Complaints are
            acknowledged within 48 hours and resolved within one month.
          </p>
          <dl className="mt-6 grid grid-cols-1 gap-x-8 md:grid-cols-2">
            {[
              { k: 'Name', v: 'Dwiraj S' },
              { k: 'Designation', v: 'Founder' },
              {
                k: 'Email',
                v: (
                  <a href="mailto:dwiraj06@gmail.com" className="text-signal rule-underline">
                    dwiraj06@gmail.com
                  </a>
                ),
              },
              {
                k: 'Phone',
                v: (
                  <a href="tel:+917892676997" className="text-signal rule-underline">
                    +91 78926 76997
                  </a>
                ),
              },
            ].map(({ k, v }) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                <dt className="font-sans text-label uppercase text-type-muted">{k}</dt>
                <dd className="text-right font-sans text-ui-s text-type-primary">{v}</dd>
              </div>
            ))}
            <div className="border-b border-rule py-3 md:col-span-2">
              <dt className="font-sans text-label uppercase text-type-muted">Address</dt>
              <dd className="mt-1 max-w-measure font-sans text-ui-s text-type-secondary">
                #165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru
                South, Bengaluru, Karnataka – 560018
              </dd>
            </div>
          </dl>
        </section>
      </main>
    </div>
  )
}
