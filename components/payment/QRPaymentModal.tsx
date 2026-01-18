'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Button from '@/components/ui/Button'
import { 
  XMarkIcon, 
  CameraIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'
import { supabase } from '@/lib/supabase'

interface QRPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  plan: {
    name: string
    price: string
    tier: string
    isAnnual?: boolean
  }
}

export default function QRPaymentModal({ isOpen, onClose, plan }: QRPaymentModalProps) {
  const { profile } = useAuth()
  const [currentQR, setCurrentQR] = useState(0)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  // QR codes array - alternates between dwiraj and lochan
  const qrCodes = [
    {
      name: 'Dwiraj',
      image: '/dwiraj.jpeg',
      upiId: 'dwiraj@paytm' // You can update this with actual UPI ID
    },
    {
      name: 'Lochan', 
      image: '/lochan.jpeg',
      upiId: 'lochan@paytm' // You can update this with actual UPI ID
    }
  ]

  // Rotate QR codes every 30 seconds
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      setCurrentQR(prev => (prev + 1) % qrCodes.length)
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setScreenshot(null)
      setTransactionId('')
      setCurrentQR(0)
    }
  }, [isOpen])

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setScreenshot(file)
    }
  }

  const handleSubmitPayment = async () => {
    if (!screenshot || !transactionId.trim()) {
      toast.error('Please upload payment screenshot and enter transaction ID')
      return
    }

    if (!profile) {
      toast.error('Please login first')
      return
    }

    setUploading(true)

    try {
      // Upload screenshot to Supabase Storage
      const fileExt = screenshot.name.split('.').pop()
      const fileName = `payment_${profile.id}_${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot)

      if (uploadError) throw uploadError

      // Create payment record in database
      const { error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: profile.id,
          plan_name: plan.name,
          plan_tier: plan.tier,
          amount: parseFloat(plan.price.replace('₹', '').replace(',', '')),
          is_annual: plan.isAnnual || false,
          transaction_id: transactionId.trim(),
          screenshot_url: uploadData.path,
          payment_method: 'qr_code',
          qr_used: qrCodes[currentQR].name.toLowerCase(),
          status: 'pending'
        })

      if (dbError) throw dbError

      toast.success('Payment submitted! We will verify and activate your plan within 24 hours.')
      onClose()
      
      // Optionally redirect to a success page or show confirmation
    } catch (error: any) {
      console.error('Payment submission error:', error)
      toast.error('Failed to submit payment. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold">Complete Payment</h2>
            <p className="text-neutral-600">{plan.name} - {plan.price}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* QR Code Section */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-gradient-secondary rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-primary-800 mb-2">
                Scan QR Code to Pay
              </h3>
              <p className="text-sm text-primary-600">
                Pay to: {qrCodes[currentQR].name}
              </p>
              <p className="text-xs text-primary-500 mt-1">
                QR code changes every 30 seconds
              </p>
            </div>

            {/* QR Code Image */}
            <div className="relative bg-white p-4 rounded-lg border-2 border-primary-200 mb-4">
              <img
                src={qrCodes[currentQR].image}
                alt={`${qrCodes[currentQR].name} QR Code`}
                className="w-48 h-48 mx-auto object-contain"
              />
              
              {/* QR Indicator */}
              <div className="absolute top-2 right-2 bg-primary-600 text-white px-2 py-1 rounded text-xs">
                {currentQR + 1}/2
              </div>
            </div>

            {/* Amount Display */}
            <div className="bg-success-50 border border-success-200 rounded-lg p-3 mb-4">
              <p className="text-success-800 font-semibold">
                Amount to Pay: {plan.price}
                {plan.isAnnual && (
                  <span className="text-sm text-success-600 block">
                    (Annual Plan - Save 17%)
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-neutral-800 mb-2">Payment Steps:</h4>
            <ol className="text-sm text-neutral-600 space-y-1">
              <li>1. Scan the QR code with any UPI app</li>
              <li>2. Pay the exact amount: {plan.price}</li>
              <li>3. Take a screenshot of payment confirmation</li>
              <li>4. Upload screenshot and enter transaction ID below</li>
            </ol>
          </div>

          {/* Upload Section */}
          <div className="space-y-4">
            {/* Screenshot Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Upload Payment Screenshot *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <label
                  htmlFor="screenshot-upload"
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-400 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <CameraIcon className="h-8 w-8 text-neutral-400 mx-auto mb-2" />
                    <p className="text-sm text-neutral-600">
                      {screenshot ? screenshot.name : 'Click to upload screenshot'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Transaction ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Transaction ID / UPI Reference Number *
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction ID from payment app"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitPayment}
              loading={uploading}
              disabled={!screenshot || !transactionId.trim()}
              className="w-full"
            >
              {uploading ? 'Submitting...' : 'Submit Payment for Verification'}
            </Button>

            {/* Note */}
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex items-start">
                <ClockIcon className="h-5 w-5 text-warning-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-warning-800 font-medium">
                    Manual Verification
                  </p>
                  <p className="text-xs text-warning-700 mt-1">
                    Your payment will be verified within 24 hours. You'll receive an email confirmation once approved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}