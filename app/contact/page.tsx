'use client'

import { useState } from 'react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { toast } from 'react-hot-toast'
import { EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline'

const subjects = [
  'Payment issue',
  'Subscription not activated',
  'Account issue',
  'Event suggestion',
  'Bug report',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch(`https://formsubmit.co/ajax/hatch0258@gmail.com`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          _subject: `<span className="font-qepho">HATCH</span> Contact: ${form.subject}`,
        }),
      })
      toast.success('Message sent! We\'ll get back to you within 24–48 hours.')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch {
      toast.error('Failed to send. Email us directly at hatch0258@gmail.com')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/30 transition-all'
  const inputStyle = { background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        <div className="mb-10">
          <p className="text-xs text-violet-400 uppercase tracking-widest font-medium mb-3">Contact</p>
          <h1 className="text-3xl font-bold text-white mb-3">We're here to help</h1>
          <p className="text-zinc-400">Got a question, payment issue, or event suggestion? We read every message.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <EnvelopeIcon className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs text-zinc-400 font-medium mb-1">Email</p>
              <a href="mailto:hatch0258@gmail.com" className="text-sm text-zinc-300 hover:text-white transition-colors break-all">
                hatch0258@gmail.com
              </a>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <ClockIcon className="w-4 h-4 text-violet-400 mb-2" />
              <p className="text-xs text-zinc-400 font-medium mb-1">Response time</p>
              <p className="text-sm text-zinc-300">24–48 hours on weekdays</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-zinc-400 font-medium mb-2">For payment issues</p>
              <p className="text-xs text-zinc-500 leading-relaxed">Include your Razorpay payment ID and we'll resolve it within 48 hours.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
                <input type="text" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your name" className={inputCls} style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="yourmail@gmail.com" className={inputCls} style={inputStyle} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Subject</label>
              <select required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                className={inputCls} style={inputStyle}>
                <option value="" style={{ background: '#0a0a12' }}>Select a subject</option>
                {subjects.map(s => <option key={s} value={s} style={{ background: '#0a0a12' }}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Message</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Describe your issue or question in detail..."
                className={`${inputCls} resize-none`} style={inputStyle} />
            </div>
            <button type="submit" disabled={sending}
              className="w-full text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: sending ? 'none' : '0 4px 16px rgba(124,58,237,0.3)' }}>
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
