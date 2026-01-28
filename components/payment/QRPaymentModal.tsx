'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { 
  XMarkIcon, 
  PhotoIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
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

export default function QRPaymentModal({ isOpen, onClose, selectedTier, amount, billingCycle = 'monthly' }: QRPaymentModalProps) {
  const { user, profile } = useAuth()
  const [currentQR, setCurrentQR] = useState('/dwiraj.jpeg')
  const [timeLeft, setTimeLeft] = useState(30)
  const [step, setStep] = useState<'payment' | 'submission'>('payment')
  const [formData, setFormData] = useState({
    transactionId: '',
    paymentMethod: 'UPI',
    screenshot: null as File | null
  })
  const [submitting, setSubmitting] = useState(false)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Switch QR code
          setCurrentQR(current => 
            current === '/dwiraj.jpeg' ? '/lochan.jpeg' : '/dwiraj.jpeg'
          )
          return 30 // Reset timer
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen])

  const validateTransactionId = (txnId: string): { isValid: boolean; message?: string } => {
    if (!txnId || txnId.length < 10) {
      return { isValid: false, message: 'Transaction ID must be at least 10 characters' }
    }
    
    if (txnId.length > 20) {
      return { isValid: false, message: 'Transaction ID must be less than 20 characters' }
    }

    // Check for valid characters (alphanumeric and hyphens only)
    const validPattern = /^[A-Za-z0-9\-]+$/
    if (!validPattern.test(txnId)) {
      return { isValid: false, message: 'Transaction ID can only contain letters, numbers, and hyphens' }
    }

    // Must start and end with alphanumeric character
    const startsEndsAlphanumeric = /^[A-Za-z0-9].*[A-Za-z0-9]$/
    if (txnId.length > 1 && !startsEndsAlphanumeric.test(txnId)) {
      return { isValid: false, message: 'Transaction ID must start and end with a letter or number' }
    }

    return { isValid: true }
  }

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      setFormData(prev => ({ ...prev, screenshot: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setScreenshotPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadScreenshot = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `payment-screenshots/${user?.id}/${Date.now()}.${fileExt}`
    
    console.log('Uploading screenshot:', fileName)
    
    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, file)

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    console.log('Upload successful:', data)

    const { data: { publicUrl } } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName)

    console.log('Public URL generated:', publicUrl)
    return publicUrl
  }

  const handleSubmitPayment = async () => {
    if (!formData.transactionId.trim()) {
      toast.error('Please enter your transaction ID')
      return
    }

    const validation = validateTransactionId(formData.transactionId.trim())
    if (!validation.isValid) {
      toast.error(validation.message || 'Invalid transaction ID format')
      return
    }

    if (!formData.screenshot) {
      toast.error('Please upload a payment screenshot')
      return
    }

    if (!profile) {
      toast.error('Profile not found. Please refresh and try again.')
      return
    }

    setSubmitting(true)

    try {
      // Upload screenshot
      const screenshotUrl = await uploadScreenshot(formData.screenshot)

      // Prepare payment data
      const paymentData = {
        user_id: user?.id,
        username: profile.username,
        full_name: profile.full_name,
        email: user?.email,
        transaction_id: formData.transactionId.trim(),
        payment_screenshot_url: screenshotUrl,
        requested_tier: selectedTier,
        amount_paid: amount,
        payment_method: formData.paymentMethod,
        is_annual: billingCycle === 'annual',
        status: 'pending'
      }

      console.log('Submitting payment data:', paymentData)

      // Submit payment for verification with user details
      const { error } = await supabase
        .from('payment_submissions')
        .insert(paymentData)

      if (error) {
        console.error('Payment submission error:', error)
        console.error('Error code:', error.code)
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        
        if (error.message.includes('Transaction ID already exists')) {
          toast.error('This transaction ID has already been submitted. Please check your transaction ID.')
        } else if (error.message.includes('Invalid transaction ID format')) {
          toast.error('Invalid transaction ID format. Please check and try again.')
        } else if (error.message.includes('violates check constraint')) {
          toast.error('Invalid tier selection. Please refresh the page and try again.')
        } else {
          console.error('Full error object:', JSON.stringify(error, null, 2))
          toast.error(`Payment submission failed: ${error.message}`)
        }
        return
      }

      toast.success('Payment submitted successfully! We will verify it within 24-48 hours and send you an email confirmation.')
      onClose()
      
      // Reset form
      setFormData({
        transactionId: '',
        paymentMethod: 'UPI',
        screenshot: null
      })
      setScreenshotPreview(null)
      setStep('payment')

    } catch (error: any) {
      console.error('Error submitting payment:', error)
      toast.error('Failed to submit payment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePaymentComplete = () => {
    setStep('submission')
  }

  const handleBack = () => {
    setStep('payment')
  }

  const handleClose = () => {
    setStep('payment')
    setFormData({
      transactionId: '',
      paymentMethod: 'UPI',
      screenshot: null
    })
    setScreenshotPreview(null)
    onClose()
  }

  if (!isOpen) return null

  const validation = validateTransactionId(formData.transactionId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[10000] p-4">
      <div className="funky-payment-modal">
        <div className="funky-payment-header">
          <h2 className="text-xl font-semibold text-white">
            {step === 'payment' ? 'Complete Payment' : 'Submit Payment Details'}
          </h2>
          <button
            onClick={handleClose}
            className="funky-close-button"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="funky-payment-body">
          {step === 'payment' ? (
            <div className="space-y-4">
              {/* Payment Details */}
              <div className="funky-payment-section funky-section-cyan">
                <div className="funky-section-header">Payment Details</div>
                <div className="funky-section-body">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Plan:</span>
                      <span className="font-medium text-gray-800">
                        {selectedTier === 'basic_99' ? 'Explorer' : 'Professional'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Amount:</span>
                      <span className="font-medium text-gray-800">₹{amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">Duration:</span>
                      <span className="font-medium text-gray-800">
                        {billingCycle === 'annual' ? '365 days (1 year)' : '30 days'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">User:</span>
                      <span className="font-medium text-gray-800">@{profile?.username}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="funky-qr-container">
                  <img 
                    src={currentQR} 
                    alt="Payment QR Code" 
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <div className="mt-2 text-sm text-white">
                  QR Code switches in: <span className="font-medium text-cyan-300">{timeLeft}s</span>
                </div>
                <div className="mt-1 text-xs text-white/80">
                  Pay to: {currentQR.includes('dwiraj') ? 'Dwiraj' : 'Lochan'}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                <div className="funky-payment-section funky-section-orange">
                  <div className="funky-section-header">Payment Instructions</div>
                  <div className="funky-section-body">
                    <ol className="text-xs text-gray-800 space-y-1 list-decimal list-inside">
                      <li>Scan QR with UPI app (GPay, PhonePe, Paytm)</li>
                      <li>Pay exact amount: ₹{amount}</li>
                      <li>Take screenshot of confirmation</li>
                      <li>Note transaction ID (12-digit number)</li>
                      <li>Click "I've Completed Payment"</li>
                    </ol>
                  </div>
                </div>

                <div className="funky-payment-section funky-section-pink">
                  <div className="funky-section-header">Important</div>
                  <div className="funky-section-body">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <ul className="text-xs text-gray-800 space-y-1 list-disc list-inside">
                        <li>Verification takes 24-48 hours</li>
                        <li>Keep transaction ID safe</li>
                        <li>Screenshot must show success & ID</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleClose}
                  className="funky-payment-button funky-button-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentComplete}
                  className="funky-payment-button funky-button-primary flex-1"
                >
                  I've Completed Payment
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Info Display */}
              <div className="funky-payment-section funky-section-purple">
                <div className="funky-section-header">Submitting for:</div>
                <div className="funky-section-body">
                  <div className="text-xs text-gray-800 space-y-1">
                    <div><span className="font-medium">Name:</span> {profile?.full_name}</div>
                    <div><span className="font-medium">Username:</span> @{profile?.username}</div>
                    <div><span className="font-medium">Plan:</span> {selectedTier === 'basic_99' ? 'Explorer' : 'Professional'}</div>
                  </div>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-xs font-medium text-white mb-1">
                  Transaction ID / UPI Reference Number *
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                  placeholder="Enter 12-digit transaction ID"
                  className={`funky-payment-input ${
                    formData.transactionId && !validation.isValid 
                      ? 'funky-input-error' 
                      : ''
                  }`}
                />
                <div className="mt-1 text-xs space-y-1">
                  {formData.transactionId && !validation.isValid && (
                    <p className="text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      {validation.message}
                    </p>
                  )}
                  {formData.transactionId && validation.isValid && (
                    <p className="text-green-400 flex items-center">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Valid format
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-medium text-white mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="funky-payment-input"
                >
                  <option value="UPI">UPI (GPay, PhonePe, Paytm)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-xs font-medium text-white mb-1">
                  Payment Screenshot *
                </label>
                <div className="funky-upload-area">
                  {screenshotPreview ? (
                    <div className="text-center">
                      <img 
                        src={screenshotPreview} 
                        alt="Payment Screenshot" 
                        className="max-w-full h-20 object-contain mx-auto mb-1 rounded-lg"
                      />
                      <p className="text-xs text-green-400 flex items-center justify-center">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Screenshot uploaded
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, screenshot: null }))
                          setScreenshotPreview(null)
                        }}
                        className="text-xs text-white/60 hover:text-white mt-1 underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="h-8 w-8 text-white/60 mx-auto mb-1" />
                      <p className="text-xs text-white mb-1">
                        Upload payment screenshot
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotChange}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="funky-upload-button"
                      >
                        Choose File
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Note */}
              <div className="funky-payment-section funky-section-orange">
                <div className="funky-section-header">Verification Process</div>
                <div className="funky-section-body">
                  <div className="flex items-start">
                    <ClockIcon className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                    <ul className="text-xs text-gray-800 space-y-1 list-disc list-inside">
                      <li>Verification within 24-48 hours</li>
                      <li>Email confirmation once approved</li>
                      <li>Account upgraded automatically</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4">
                <button
                  onClick={handleBack}
                  className="funky-payment-button funky-button-secondary flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitPayment}
                  disabled={!formData.transactionId || !formData.screenshot || !validation.isValid || submitting}
                  className="funky-payment-button funky-button-primary flex-1"
                  style={{ 
                    opacity: (!formData.transactionId || !formData.screenshot || !validation.isValid || submitting) ? 0.6 : 1,
                    cursor: (!formData.transactionId || !formData.screenshot || !validation.isValid || submitting) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}