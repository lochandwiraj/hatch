'use client'

import { useState } from 'react'
import { Hatch } from '@/components/brand/Hatch'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { toast } from 'react-hot-toast'

/**
 * Contact. Operate mode: the visitor is here to send one message.
 *
 * The form used to carry `md:col-span-2` inside a twelve-column grid, so at lg
 * it fell back to a single column and the inputs rendered about 110px wide
 * while five filled cards took the rest of the page. The form is the point of
 * this screen, so it now takes the wide column and the details sit in the same
 * ruled, sticky aside that /about and /faq use.
 *
 * The cards are gone. Five boxes to carry an email address, a phone number and
 * four words about response time is most of a screen spent on nothing; a ruled
 * list says the same thing in a quarter of the space.
 */
export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('https://formsubmit.co/ajax/hatch@hatchevent.in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          _subject: `HATCH Contact from ${form.name}`,
        }),
      })
      // A non-2xx used to fall through to the success toast, so a rejected
      // message looked sent. Only a thrown network error was ever caught.
      if (!res.ok) throw new Error(String(res.status))
      toast.success("Message sent. We'll reply within 24–48 hours.")
      setForm({ name: '', email: '', message: '' })
    } catch {
      toast.error('Could not send. Email us directly at hatch@hatchevent.in')
    } finally {
      setSending(false)
    }
  }

  /** Matches Field's input exactly; Field itself has no multiline variant. */
  const textarea =
    'mt-2 block w-full resize-y border border-rule bg-ink-sunken px-3 py-2 font-sans text-ui ' +
    'text-type-primary placeholder-type-muted focus:border-rule-strong focus:outline-none'

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="border-b border-rule py-3">
      <dt className="font-sans text-label uppercase text-type-muted">{label}</dt>
      <dd className="mt-1 font-sans text-ui-s text-type-primary">{children}</dd>
    </div>
  )

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <form onSubmit={handleSubmit} className="lg:col-span-7">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field
            label="Name"
            name="contact-name"
            required
            autoComplete="name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Field
            label="Email"
            name="contact-email"
            type="email"
            required
            autoComplete="email"
            placeholder="yourmail@gmail.com"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>

        <div className="mt-4">
          <label htmlFor="contact-message" className="block font-sans text-label uppercase text-type-muted">
            Message
            <span className="ml-1 text-signal" aria-hidden>
              required
            </span>
          </label>
          <textarea
            id="contact-message"
            name="contact-message"
            required
            rows={8}
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            placeholder="Describe your issue or question in detail"
            className={textarea}
          />
        </div>

        <p className="mt-3 max-w-measure font-sans text-ui-s text-type-muted">
          For a payment issue, include your UPI transaction reference. Those are resolved within 48
          hours.
        </p>

        <Button type="submit" variant="primary" size="lg" loading={sending} className="mt-6 w-full md:w-auto">
          {sending ? 'Sending' : 'Send message'}
        </Button>
      </form>

      {/* The details. Ruled and sticky, matching /about and /faq. */}
      <aside className="mt-12 lg:col-span-4 lg:col-start-9 lg:mt-0 lg:sticky lg:top-24 lg:self-start">
        <dl className="border-t border-rule">
          <Row label="Email">
            <a href="mailto:hatch@hatchevent.in" className="break-all text-signal rule-underline">
              hatch@hatchevent.in
            </a>
          </Row>
          <Row label="Phone">
            <a href="tel:+917892676997" className="text-signal rule-underline">
              +91 78926 76997
            </a>
          </Row>
          <Row label="Response time">24–48 hrs on weekdays</Row>
          <Row label="Address">
            <span className="text-type-secondary">
              #165 Beladingalu, 5th Main 5th Cross, Madhwa Sangha Cross, Chamrajapete, Bengaluru,
              Karnataka – 560018
            </span>
          </Row>
          <Row label="LinkedIn">
            <a
              href="https://www.linkedin.com/company/hatch-events-india/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-signal rule-underline"
            >
              <Hatch /> Events India
            </a>
          </Row>
        </dl>
      </aside>
    </div>
  )
}
