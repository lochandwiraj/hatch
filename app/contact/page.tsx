import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact HATCH',
  description: 'Get in touch with the HATCH team. Payment issues, event suggestions, or general questions — we read every message and respond within 24–48 hours.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Contact</p>
          <h1 className="text-3xl font-bold text-white mb-3">We're here to help</h1>
          <p className="text-zinc-400">Got a question, payment issue, or event suggestion? We read every message.</p>
        </div>
        <ContactForm />
      </main>
    </div>
  )
}
