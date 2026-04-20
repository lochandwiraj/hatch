'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  XMarkIcon,
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

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
  if (id.length > 1 && !/^[A-Za-z0-9].*[A-Za-z0-9]$/.test(id)) return 'Must start and end with a letter or number'
  return null
}

export default function QRPaymentModal({ isOpen, onClose, selectedTier, amount, billingCycle = 'monthly' }: QRPaymentModalProps) {
  const { user, profile } = useAuth()
  const [currentQR, setCurrentQR] = useState('/dwiraj.jpeg')
  const [timeLeft, setTimeLeft] = useState(30)
  const [step, setStep] = useState<'payment' | 'submission'>('payment')
  const [txnId, setTxnId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setCurrentQR(q => q === '/dwiraj.jpeg' ? '/lochan.jpeg' : '/dwiraj.jpeg')
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isOpen])

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return }
    setScreenshot(file)
    const reader = new FileReader()
    reader.onload = e => setScreenshotPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadScreenshot = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()
    const fileName = `payment-screenshots/${user?.id}/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('payment-screenshots').upload(fileName, file)
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('payment-screenshots').getPublicUrl(fileName)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!txnId.trim()) { toast.error('Please enter your transaction ID'); return }
    const err = validateTxn(txnId.trim())
    if (err) { toast.error(err); return }
    if (!screenshot) { toast.error('Please upload a payment screenshot'); return }
    if (!profile) { toast.error('Profile not found. Please refresh.'); return }

    setSubmitting(true)
    try {
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
        if (error.message.includes('Transaction ID already exists')) toast.error('This transaction ID was already submitted.')
        else toast.error(`Submission failed: ${error.message}`)
        return
      }
      toast.success('Payment submitted! We will verify within 24–48 hours.')
      handleClose()
    } catch {
      toast.error('Failed to submit payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep('payment'); setTxnId(''); setPaymentMethod('UPI')
    setScreenshot(null); setScreenshotPreview(null); onClose()
  }

  if (!isOpen) return null

  const txnError = txnId ? validateTxn(txnId) : null
  const canSubmit = txnId && !txnError && screenshot && !submitting

  const inputCls = "w-full bg-[#080808] border rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-all duration-200"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        style={{
          background: '#111111',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          boxShadow: '0 32px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'modalIn 0.2s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06] sticky top-0 bg-[#111111] z-10" style={{ borderRadius: '20px 20px 0 0' }}>
          <div className="flex items-center gap-2">
            {step === 'submission' && (
              <button onClick={() => setStep('payment')} className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
                <ArrowLeftIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-medium">
              {step === 'payment' ? 'Complete Payment' : 'Submit Details'}
            </p>
          </div>
          <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {step === 'payment' ? (
            <div className="space-y-4">
              {/* Summary row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{selectedTier === 'basic_99' ? 'Explorer' : 'Professional'}</p>
                  <p className="text-xs text-zinc-500">{billingCycle === 'annual' ? '365 days' : '30 days'} · @{profile?.username}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">₹{amount}</p>
                  <p className="text-xs text-zinc-600">via UPI</p>
                </div>
              </div>

              {/* QR code */}
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div
                  className="inline-block p-2 rounded-xl mb-3"
                  style={{ background: '#ffffff' }}
                >
                  <img src={currentQR} alt="Payment QR Code" className="w-40 h-40 object-contain" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-xs text-zinc-400">
                    Switching to {currentQR.includes('dwiraj') ? 'Lochan' : 'Dwiraj'} in <span className="text-white font-medium">{timeLeft}s</span>
                  </p>
                </div>
                <p className="text-xs text-zinc-600 mt-1">Pay to: {currentQR.includes('dwiraj') ? 'Dwiraj' : 'Lochan'}</p>
              </div>

              {/* Instructions */}
              <div
                className="rounded-xl p-4 space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <p className="text-xs font-medium text-zinc-400 mb-2">Steps</p>
                {[
                  'Open GPay, PhonePe, or Paytm',
                  `Scan QR and pay exactly ₹${amount}`,
                  'Screenshot the confirmation',
                  'Note your transaction ID',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] text-zinc-500 shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs text-zinc-500">{step}</span>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 px-1">
                <ClockIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600">Verification takes 24–48 hours. Keep your transaction ID and screenshot safe.</p>
              </div>

              <button
                onClick={() => setStep('submission')}
                className="w-full text-sm font-medium text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 4px 16px rgba(79,70,229,0.3)' }}
              >
                I've completed payment
              </button>
              <button onClick={handleClose} className="w-full text-sm text-zinc-600 hover:text-zinc-400 py-1.5 transition-colors duration-200">
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User info */}
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Submitting for</span>
                  <span className="text-zinc-300">@{profile?.username} · ₹{amount}</span>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Transaction ID *</label>
                <input
                  type="text"
                  value={txnId}
                  onChange={e => setTxnId(e.target.value)}
                  placeholder="Enter transaction / UPI reference"
                  className={inputCls}
                  style={{
                    borderColor: txnId && txnError ? 'rgba(239,68,68,0.4)' : txnId && !txnError ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.07)',
                  }}
                />
                {txnId && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {txnError ? (
                      <><ExclamationTriangleIcon className="w-3 h-3 text-red-400" /><p className="text-xs text-red-400">{txnError}</p></>
                    ) : (
                      <><CheckCircleIcon className="w-3 h-3 text-emerald-400" /><p className="text-xs text-emerald-400">Valid format</p></>
                    )}
                  </div>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Payment method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: 'rgba(255,255,255,0.07)' }}
                >
                  <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Payment screenshot *</label>
                <div
                  className="rounded-xl p-4 text-center transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${screenshot ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}` }}
                >
                  {screenshotPreview ? (
                    <div>
                      <img src={screenshotPreview} alt="Screenshot" className="max-w-full h-24 object-contain mx-auto rounded-lg mb-2" />
                      <div className="flex items-center justify-center gap-1.5 mb-2">
                        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs text-emerald-400">Screenshot uploaded</p>
                      </div>
                      <button
                        onClick={() => { setScreenshot(null); setScreenshotPreview(null) }}
                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-500 mb-3">Upload your payment confirmation</p>
                      <input type="file" accept="image/*" onChange={handleScreenshotChange} className="hidden" id="screenshot-upload" />
                      <label
                        htmlFor="screenshot-upload"
                        className="text-xs text-violet-400 hover:text-violet-300 cursor-pointer px-4 py-1.5 rounded-lg transition-colors"
                        style={{ border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.08)' }}
                      >
                        Choose file
                      </label>
                      <p className="text-xs text-zinc-700 mt-2">Max 5MB · JPG, PNG</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Note */}
              <div className="flex items-start gap-2">
                <ClockIcon className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-600">Verification within 24–48 hours. You'll receive email confirmation once approved.</p>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full text-sm font-medium text-white py-2.5 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: canSubmit ? '0 4px 16px rgba(79,70,229,0.3)' : 'none' }}
              >
                {submitting ? 'Submitting...' : 'Submit payment'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
