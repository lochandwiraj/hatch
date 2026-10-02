'use client'

import { useState } from 'react'
import { Overlay } from '@/components/ui/Overlay'
import { Glyph } from '@/components/ui/Glyph'
import { useAuth } from '@/components/auth/AuthProvider'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

/**
 * Paying for a plan: pay, confirm, done.
 *
 * It used to be two steps that ended in a toast. The moment the insert
 * succeeded the panel closed, so the one screen a student most needs to keep —
 * what they sent, under which reference, and when someone will look at it —
 * existed for four seconds in the corner of the page. There is a third step now,
 * and it states the record.
 *
 * Fixed on the way through: the "Choose file" control was signal text on a
 * signal fill, so the only way to attach the screenshot was an invisible button;
 * three ternaries chose between identical values; and the primary action on both
 * steps was drawn in ink-raised, the same grey as a disabled control.
 *
 * The money path itself is untouched: the same format check, the same
 * validate_transaction_id call before anything is uploaded, the same insert.
 */

interface QRPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  selectedTier: 'basic_99' | 'premium_149'
  amount: number
  billingCycle?: 'monthly' | 'annual'
}

const validateTxn = (id: string) => {
  if (!id || id.length < 10) return 'At least 10 characters'
  if (id.length > 20) return 'Less than 20 characters'
  if (!/^[A-Za-z0-9\-]+$/.test(id)) return 'Letters, numbers, and hyphens only'
  if (id.length > 1 && !/^[A-Za-z0-9].*[A-Za-z0-9]$/.test(id))
    return 'Must start and end with a letter or number'
  return null
}

const STEPS = [
  { key: 'payment', n: '01', label: 'Pay' },
  { key: 'submission', n: '02', label: 'Confirm' },
  { key: 'done', n: '03', label: 'Done' },
] as const

type Step = (typeof STEPS)[number]['key']

const field =
  'mt-2 block min-h-touch w-full border border-rule bg-ink-sunken px-3 py-2 font-sans text-ui ' +
  'text-type-primary placeholder-type-muted focus:border-rule-strong focus:outline-none'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="block font-sans text-label uppercase text-type-muted">
      {children}
      {required ? (
        <span className="ml-1 text-signal" aria-hidden>
          required
        </span>
      ) : null}
    </span>
  )
}

export default function QRPaymentModal({
  isOpen,
  onClose,
  selectedTier,
  amount,
  billingCycle = 'monthly',
}: QRPaymentModalProps) {
  const { user, profile } = useAuth()
  // A single, fixed payee. No rotation: the QR must not change while
  // someone is part way through paying it.
  const QR_SRC = '/dwiraj.jpeg'
  const QR_NAME = 'Dwiraj'

  const [step, setStep] = useState<Step>('payment')
  const [txnId, setTxnId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<{ ref: string; method: string } | null>(null)

  const planName = selectedTier === 'basic_99' ? 'Explorer' : 'Professional'
  const term = billingCycle === 'annual' ? '365 days' : '30 days'

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setScreenshot(file)
    const reader = new FileReader()
    reader.onload = (ev) => setScreenshotPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadScreenshot = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const fileName = `payment-screenshots/${user?.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('payment-screenshots').upload(fileName, file)
    if (error) throw error
    const {
      data: { publicUrl },
    } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!txnId.trim()) {
      toast.error('Please enter your transaction ID')
      return
    }
    const err = validateTxn(txnId.trim())
    if (err) {
      toast.error(err)
      return
    }
    if (!screenshot) {
      toast.error('Please upload a payment screenshot')
      return
    }
    if (!profile) {
      toast.error('Profile not found. Please refresh.')
      return
    }

    setSubmitting(true)
    try {
      // The client-side format check is a convenience. The database owns the
      // real rule, including whether this reference has been used before, so
      // ask it before taking a screenshot upload and a row insert.
      const { data: txnOk, error: txnError } = await supabase.rpc('validate_transaction_id', {
        txn_id: txnId.trim(),
      })
      if (txnError) throw txnError
      if (txnOk === false) {
        toast.error('That transaction reference is not valid or has already been used')
        setSubmitting(false)
        return
      }

      const screenshotUrl = await uploadScreenshot(screenshot)
      const { error } = await supabase.from('payment_submissions').insert({
        user_id: user?.id,
        username: profile.username,
        full_name: profile.full_name,
        email: user?.email,
        transaction_id: txnId.trim(),
        payment_screenshot_url: screenshotUrl,
        requested_tier: selectedTier,
        amount_paid: amount,
        payment_method: paymentMethod,
        is_annual: billingCycle === 'annual',
        status: 'pending',
      })
      if (error) {
        if (error.message.includes('Transaction ID already exists'))
          toast.error('This transaction ID was already submitted.')
        else toast.error(`Submission failed: ${error.message}`)
        return
      }
      // The record, not a four-second toast.
      setReceipt({ ref: txnId.trim(), method: paymentMethod })
      setStep('done')
    } catch {
      toast.error('Failed to submit payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setStep('payment')
    setTxnId('')
    setPaymentMethod('UPI')
    setScreenshot(null)
    setScreenshotPreview(null)
    setReceipt(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  const txnError = txnId ? validateTxn(txnId) : null
  const canSubmit = Boolean(txnId) && !txnError && Boolean(screenshot) && !submitting
  const stepIndex = STEPS.findIndex((s) => s.key === step)

  return (
    <Overlay
      open={isOpen}
      // Closing mid-payment loses a typed reference, so the only ways out are
      // the explicit controls below.
      onClose={step === 'done' ? handleClose : () => {}}
      align="bottom"
      className="w-full lg:max-w-[520px]"
    >
      <div className="flex max-h-[92vh] w-full flex-col border border-rule-strong bg-ink">
        {/* Where you are. Three steps, stated rather than implied. */}
        <header className="shrink-0 border-b border-rule px-4 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <ol className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {STEPS.map((s, i) => {
                const active = s.key === step
                const done = i < stepIndex
                return (
                  <li key={s.key} className="flex items-baseline gap-2">
                    <span
                      data-mono
                      className={`text-mono ${active ? 'text-signal' : done ? 'text-verified' : 'text-type-muted'}`}
                    >
                      {s.n}
                    </span>
                    <span
                      className={`font-sans text-ui-s ${
                        active ? 'text-type-primary' : 'text-type-muted'
                      }`}
                    >
                      {s.label}
                    </span>
                  </li>
                )
              })}
            </ol>
            {step !== 'done' ? (
              <button
                type="button"
                onClick={handleClose}
                aria-label="Cancel payment"
                className="-m-1 shrink-0 p-1 text-type-muted hover:text-type-primary active:text-type-primary"
              >
                <Glyph name="cross" size={14} />
              </button>
            ) : null}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          {/* ---------------------------------------------------- 01 PAY --- */}
          {step === 'payment' ? (
            <div>
              <dl className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule-strong pb-4">
                <div>
                  <dt className="font-sans text-label uppercase text-type-muted">Plan</dt>
                  <dd className="mt-1 font-display text-title uppercase text-type-primary">{planName}</dd>
                  <dd className="font-sans text-ui-s text-type-muted">
                    {term} · @{profile?.username}
                  </dd>
                </div>
                <div className="text-right">
                  <dt className="font-sans text-label uppercase text-type-muted">Pay exactly</dt>
                  <dd data-mono className="mt-1 text-mono-l text-type-primary">
                    ₹{amount}
                  </dd>
                  <dd className="font-sans text-ui-s text-type-muted">via UPI</dd>
                </div>
              </dl>

              {/* The QR needs a light plate to scan reliably on a dark theme. */}
              <div className="mt-6 flex flex-col items-center">
                <div className="p-3" style={{ background: 'var(--type-primary)' }}>
                  <img
                    src={QR_SRC}
                    alt={`UPI QR code for ${QR_NAME}`}
                    className="h-48 w-48 object-contain"
                  />
                </div>
                <p className="mt-3 font-sans text-ui-s text-type-secondary">
                  Pay to <span className="text-type-primary">{QR_NAME}</span>
                </p>
              </div>

              <ol className="mt-6 border-t border-rule">
                {[
                  'Open GPay, PhonePe or Paytm',
                  `Scan this code and pay exactly ₹${amount}`,
                  'Screenshot the confirmation',
                  'Copy the transaction reference',
                ].map((text, i) => (
                  <li key={i} className="flex items-baseline gap-3 border-b border-rule py-2">
                    <span data-mono className="shrink-0 text-mono text-type-muted">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-sans text-ui-s text-type-secondary">{text}</span>
                  </li>
                ))}
              </ol>

              <p className="mt-4 font-sans text-ui-s text-type-muted">
                Verification takes 24–48 hours. Keep the reference and the screenshot until then.
              </p>
            </div>
          ) : null}

          {/* ------------------------------------------------ 02 CONFIRM --- */}
          {step === 'submission' ? (
            <div>
              <dl className="flex items-baseline justify-between gap-4 border-b border-rule-strong pb-3">
                <dt className="font-sans text-label uppercase text-type-muted">Submitting for</dt>
                <dd className="font-sans text-ui-s text-type-primary">
                  @{profile?.username} ·{' '}
                  <span data-mono className="text-mono">
                    ₹{amount}
                  </span>
                </dd>
              </dl>

              <label className="mt-6 block">
                <Label required>Transaction reference</Label>
                <input
                  type="text"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                  placeholder="The reference your UPI app shows"
                  aria-invalid={Boolean(txnError)}
                  className={`${field} ${txnError ? 'border-signal' : ''}`}
                />
                {txnId ? (
                  <span className="mt-2 flex items-center gap-2">
                    <Glyph
                      name={txnError ? 'warning' : 'check'}
                      size={14}
                      className={txnError ? 'text-signal' : 'text-verified'}
                    />
                    <span className={`font-sans text-ui-s ${txnError ? 'text-signal' : 'text-verified'}`}>
                      {txnError ?? 'Format looks right'}
                    </span>
                  </span>
                ) : null}
              </label>

              <label className="mt-6 block">
                <Label>Paid by</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={field}
                >
                  <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </label>

              <div className="mt-6">
                <Label required>Payment screenshot</Label>
                <div className="mt-2 border border-rule p-4">
                  {screenshotPreview ? (
                    <div className="flex items-start gap-4">
                      <img
                        src={screenshotPreview}
                        alt="Your payment confirmation"
                        className="h-24 w-24 border border-rule object-contain"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-sans text-ui-s text-verified">
                          <Glyph name="check" size={14} />
                          Attached
                        </p>
                        <p className="mt-1 truncate font-sans text-ui-s text-type-muted">
                          {screenshot?.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshot(null)
                            setScreenshotPreview(null)
                          }}
                          className="mt-2 inline-flex min-h-touch items-center border border-rule px-3 py-1 font-sans text-ui-s text-type-secondary hover:border-signal hover:text-signal"
                        >
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      <p className="font-sans text-ui-s text-type-secondary">
                        Attach the confirmation from your UPI app.
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="sr-only"
                        id="screenshot-upload"
                      />
                      {/* Was signal text on a signal fill: an invisible control
                          on the only step that needs a file. */}
                      <label
                        htmlFor="screenshot-upload"
                        className="inline-flex min-h-touch cursor-pointer items-center gap-2 border border-signal bg-signal px-4 py-2 font-sans text-ui-s font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
                      >
                        <Glyph name="upload" size={14} />
                        Choose file
                      </label>
                      <p data-mono className="text-mono text-type-muted">max 5MB · jpg, png</p>
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-4 font-sans text-ui-s text-type-muted">
                We check it by hand within 24–48 hours and email you when the plan is live.
              </p>
            </div>
          ) : null}

          {/* --------------------------------------------------- 03 DONE --- */}
          {step === 'done' ? (
            <div>
              <p className="flex items-center gap-2 font-sans text-ui-s text-verified">
                <Glyph name="check" size={14} />
                Submitted
              </p>
              <h2 className="mt-2 font-display text-display-m text-type-primary">We have it</h2>
              <p className="mt-2 max-w-measure font-serif text-body text-type-secondary">
                Your payment is queued for review. Nothing else is needed from you — we will email{' '}
                {user?.email} once the plan is live on your account.
              </p>

              <dl className="mt-6 border-t border-rule">
                {[
                  { k: 'Plan', v: `${planName} · ${term}` },
                  { k: 'Amount', v: `₹${amount}`, mono: true },
                  { k: 'Reference', v: receipt?.ref ?? '--', mono: true },
                  { k: 'Paid by', v: receipt?.method ?? '--' },
                  { k: 'Reviewed within', v: '24–48 hours' },
                ].map(({ k, v, mono }) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                    <dt className="font-sans text-label uppercase text-type-muted">{k}</dt>
                    <dd
                      className={`break-all text-right ${mono ? 'text-mono' : 'font-sans text-ui-s'} text-type-primary`}
                      {...(mono ? { 'data-mono': true } : {})}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 font-sans text-ui-s text-type-muted">
                Keep the reference until the plan appears. If it has not within 48 hours, send that
                reference to hatch@hatchevent.in.
              </p>
            </div>
          ) : null}
        </div>

        {/* Actions, pinned, so the next move is never scrolled away. */}
        <footer className="shrink-0 border-t border-rule px-4 py-3 lg:px-6">
          {step === 'payment' ? (
            <div className="flex flex-col gap-2 lg:flex-row-reverse">
              <button
                type="button"
                onClick={() => setStep('submission')}
                className="inline-flex min-h-touch flex-1 items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
              >
                I have paid
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-touch items-center justify-center border border-rule-strong px-4 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal lg:flex-none"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {step === 'submission' ? (
            <div className="flex flex-col gap-2 lg:flex-row-reverse">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex min-h-touch flex-1 items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal disabled:opacity-40 disabled:pointer-events-none"
              >
                {submitting ? 'Submitting' : 'Submit payment'}
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                disabled={submitting}
                className="inline-flex min-h-touch items-center justify-center gap-2 border border-rule-strong px-4 py-3 font-sans text-ui text-type-primary hover:border-signal hover:text-signal disabled:opacity-40 lg:flex-none"
              >
                <Glyph name="arrow-left" size={14} />
                Back
              </button>
            </div>
          ) : null}

          {step === 'done' ? (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex min-h-touch w-full items-center justify-center border border-signal bg-signal px-4 py-3 font-sans text-ui font-medium text-ink hover:bg-ink hover:text-signal active:bg-ink active:text-signal"
            >
              Done
            </button>
          ) : null}
        </footer>
      </div>
    </Overlay>
  )
}
