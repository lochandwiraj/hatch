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
}

export default function QRPaymentModal({ isOpen, onClose, selectedTier, amount }: QRPaymentModalProps) {
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

      // Submit payment for verification with user details
      const { error } = await supabase
        .from('payment_submissions')
        .insert({
          user_id: user?.id,
          username: profile.username,
          full_name: profile.full_name,
          email: user?.email,
          transaction_id: formData.transactionId.trim(),
          payment_screenshot_url: screenshotUrl,
          requested_tier: selectedTier,
          amount_paid: amount,
          payment_method: formData.paymentMethod,
          status: 'pending'
        })

      if (error) {
        if (error.message.includes('Transaction ID already exists')) {
          toast.error('This transaction ID has already been submitted. Please check your transaction ID.')
        } else if (error.message.includes('Invalid transaction ID format')) {
          toast.error('Invalid transaction ID format. Please check and try again.')
        } else {
          throw error
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              {step === 'payment' ? 'Complete Payment' : 'Submit Payment Details'}
            </h2>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {step === 'payment' ? (
            <div className="space-y-6">
              {/* Payment Details */}
              <div className="bg-neutral-50 rounded-lg p-4">
                <h3 className="font-medium text-neutral-900 mb-2">Payment Details</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-medium">
                      {selectedTier === 'basic_99' ? 'Explorer' : 'Professional'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-medium">₹{amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">30 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User:</span>
                    <span className="font-medium">@{profile?.username}</span>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="bg-white border-2 border-neutral-200 rounded-lg p-4 inline-block">
                  <img 
                    src={currentQR} 
                    alt="Payment QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <div className="mt-2 text-sm text-neutral-600">
                  QR Code switches in: <span className="font-medium">{timeLeft}s</span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">
                  Pay to: {currentQR.includes('dwiraj') ? 'Dwiraj' : 'Lochan'}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-4">
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <h4 className="font-medium text-primary-900 mb-2">Payment Instructions</h4>
                  <ol className="text-sm text-primary-800 space-y-1 list-decimal list-inside">
                    <li>Scan the QR code with any UPI app (GPay, PhonePe, Paytm, etc.)</li>
                    <li>Pay the exact amount: ₹{amount}</li>
                    <li>Take a screenshot of the payment confirmation screen</li>
                    <li>Note down your transaction ID (12-digit UPI reference number)</li>
                    <li>Click "I've Completed Payment" below</li>
                  </ol>
                </div>

                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-5 w-5 text-warning-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning-900 mb-1">Important</h4>
                      <ul className="text-sm text-warning-800 space-y-1 list-disc list-inside">
                        <li>Payment verification takes 24-48 hours</li>
                        <li>Keep your transaction ID safe</li>
                        <li>Screenshot should show payment success and transaction ID</li>
                        <li>Contact support if not verified within 48 hours</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentComplete}
                  className="flex-1"
                >
                  I've Completed Payment
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info Display */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Submitting for:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div><span className="font-medium">Name:</span> {profile?.full_name}</div>
                  <div><span className="font-medium">Username:</span> @{profile?.username}</div>
                  <div><span className="font-medium">Email:</span> {user?.email}</div>
                  <div><span className="font-medium">Plan:</span> {selectedTier === 'basic_99' ? 'Explorer' : 'Professional'}</div>
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Transaction ID / UPI Reference Number *
                </label>
                <input
                  type="text"
                  value={formData.transactionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                  placeholder="Enter your 12-digit transaction ID"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    formData.transactionId && !validation.isValid 
                      ? 'border-error-300 bg-error-50' 
                      : 'border-neutral-300'
                  }`}
                />
                <div className="mt-1 text-xs space-y-1">
                  <p className="text-neutral-500">
                    Examples: 123456789012, UPI123456789012, TXN1234567890
                  </p>
                  {formData.transactionId && !validation.isValid && (
                    <p className="text-error-600 flex items-center">
                      <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                      {validation.message}
                    </p>
                  )}
                  {formData.transactionId && validation.isValid && (
                    <p className="text-success-600 flex items-center">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Valid transaction ID format
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Credit Card">Credit Card</option>
                </select>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Payment Screenshot *
                </label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4">
                  {screenshotPreview ? (
                    <div className="text-center">
                      <img 
                        src={screenshotPreview} 
                        alt="Payment Screenshot" 
                        className="max-w-full h-32 object-contain mx-auto mb-2"
                      />
                      <p className="text-sm text-success-600 flex items-center justify-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Screenshot uploaded successfully
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, screenshot: null }))
                          setScreenshotPreview(null)
                        }}
                        className="text-xs text-neutral-500 hover:text-neutral-700 mt-1"
                      >
                        Remove and upload different image
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <PhotoIcon className="h-12 w-12 text-neutral-400 mx-auto mb-2" />
                      <p className="text-sm text-neutral-600 mb-2">
                        Upload payment confirmation screenshot
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
                        className="cursor-pointer bg-primary-50 text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors"
                      >
                        Choose Image File
                      </label>
                      <p className="text-xs text-neutral-500 mt-2">
                        Max size: 5MB. Formats: JPG, PNG, GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-warning-600 mr-2 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-warning-900 mb-1">Verification Process</h4>
                    <ul className="text-sm text-warning-800 space-y-1 list-disc list-inside">
                      <li>Admin will verify your payment within 24-48 hours</li>
                      <li>You'll receive email confirmation once approved</li>
                      <li>Your account will be upgraded automatically</li>
                      <li>Contact support if verification takes longer than 48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitPayment}
                  loading={submitting}
                  disabled={!formData.transactionId || !formData.screenshot || !validation.isValid}
                  className="flex-1"
                >
                  Submit for Verification
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}