import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact — Get in Touch',
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

        {/* Grievance Redressal Officer */}
        <div className="mt-12 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Grievance Redressal</p>
          <h2 className="text-base font-semibold text-white mb-1">Grievance Officer</h2>
          <p className="text-xs text-zinc-500 mb-4">As required under the IT (Intermediary Guidelines) Rules, 2021</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-zinc-400">
            <div><span className="text-zinc-500 text-xs">Name</span><p className="text-zinc-300 mt-0.5">Dwiraj S</p></div>
            <div><span className="text-zinc-500 text-xs">Designation</span><p className="text-zinc-300 mt-0.5">Founder</p></div>
            <div><span className="text-zinc-500 text-xs">Email</span><p className="mt-0.5"><a href="mailto:dwiraj06@gmail.com" className="text-violet-400 hover:text-violet-300 transition-colors">dwiraj06@gmail.com</a></p></div>
            <div><span className="text-zinc-500 text-xs">Phone</span><p className="mt-0.5"><a href="tel:+917892676997" className="text-violet-400 hover:text-violet-300 transition-colors">+91 78926 76997</a></p></div>
            <div className="sm:col-span-2"><span className="text-zinc-500 text-xs">Address</span><p className="text-zinc-300 mt-0.5">#165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru South, Bengaluru, Karnataka – 560018</p></div>
          </div>
          <p className="text-xs text-zinc-600 mt-4">Complaints acknowledged within 48 hours · Resolved within one month</p>
        </div>
      </main>
    </div>
  )
}
