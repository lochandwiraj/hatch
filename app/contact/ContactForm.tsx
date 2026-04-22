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
      await fetch(`https://formsubmit.co/ajax/hatch0258@gmail.com`, {
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
      toast.error('Failed to send. Email us directly at hatch0258@gmail.com')
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/60 transition-all'
  const inputStyle = { background: 'rgba(3,3,8,0.9)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {/* Info */}
      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <EnvelopeIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-400 font-medium mb-1">Email</p>
          <a href="mailto:hatch0258@gmail.com" className="text-sm text-zinc-300 hover:text-white transition-colors break-all">
            hatch0258@gmail.com
          </a>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <PhoneIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-400 font-medium mb-1">Phone / WhatsApp</p>
          <a href="tel:+917892676997" className="text-sm text-zinc-300 hover:text-white transition-colors">
            +91 78926 76997
          </a>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ClockIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-400 font-medium mb-1">Response time</p>
          <p className="text-sm text-zinc-300">24–48 hours on weekdays</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <MapPinIcon className="w-4 h-4 text-violet-400 mb-2" />
          <p className="text-xs text-zinc-400 font-medium mb-1">Address</p>
          <p className="text-xs text-zinc-400 leading-relaxed">#165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru South, Bengaluru, Karnataka – 560018</p>
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
