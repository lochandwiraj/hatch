'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { EnvelopeIcon, ClockIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await fetch(`https://formsubmit.co/ajax/hatch@hatchevent.in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `HATCH Contact from ${form.name}`,
        }),
      })
      toast.success('Message sent! We\'ll get back to you within 24–48 hours.')
      setForm({ name: '', email: '', message: '' })
    } catch {
      toast.error('Failed to send. Email us directly at hatch@hatchevent.in')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/60 transition-all'
  const inputStyle = { background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Info */}
      <div className="space-y-3">
        {/* Email + Phone: side by side */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <EnvelopeIcon className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-xs text-zinc-500 font-medium mb-1">Email</p>
            <a href="mailto:hatch@hatchevent.in" className="text-xs text-zinc-300 hover:text-white transition-colors break-all leading-relaxed">
              hatch@hatchevent.in
            </a>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <PhoneIcon className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-xs text-zinc-500 font-medium mb-1">Phone</p>
            <a href="tel:+917892676997" className="text-xs text-zinc-300 hover:text-white transition-colors leading-relaxed">
              +91 78926 76997
            </a>
          </div>
        </div>

        {/* Response time */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ClockIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-500 font-medium mb-1">Response time</p>
          <p className="text-sm text-zinc-300">24–48 hrs on weekdays</p>
        </div>

        {/* Address */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <MapPinIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-500 font-medium mb-1">Address</p>
          <p className="text-xs text-zinc-400 leading-relaxed">#165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru, Karnataka – 560018</p>
        </div>

        {/* Payment note — plain, no card */}
        <p className="text-xs text-zinc-600 px-1 leading-relaxed">For payment issues, include your Razorpay payment ID — resolved within 48 hours.</p>

        {/* LinkedIn */}
        <a
          href="https://www.linkedin.com/company/hatch-events-india/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl p-4 hover:bg-white/[0.04] transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-violet-400 shrink-0">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          <div>
            <p className="text-xs text-zinc-500 font-medium">LinkedIn</p>
            <p className="text-sm text-zinc-300">HATCH Events India</p>
          </div>
        </a>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="md:col-span-2 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
            <input type="text" required autoComplete="name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Your name" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
            <input type="email" required autoComplete="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="yourmail@gmail.com" className={inputCls} style={inputStyle} />
          </div>
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
  )
}
