'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { 
  ShareIcon, 
  GiftIcon, 
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

export default function ReferralCard() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!profile) return null

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth?ref=${profile.id}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success('Referral link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const shareViaWhatsApp = () => {
    const message = `Hey! I'm using HATCH to discover curated student events every week. Join using my link and get 20% off your first month: ${referralLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="funky-referral-card">
      <div className="funky-referral-card-header">
        <div>
          <div className="text-lg font-bold">Share & Earn</div>
          <div className="text-sm opacity-90">Invite friends and get rewards</div>
        </div>
        <div className="funky-referral-icon">
          <GiftIcon className="h-6 w-6 text-white" />
        </div>
      </div>

      <div className="funky-referral-card-body">
        <div className="funky-info-box">
          <h4 className="font-bold text-gray-800 mb-2">How it works:</h4>
          <ul className="space-y-1 text-sm text-gray-700 font-medium">
            <li>• Your friend gets 20% off their first month</li>
            <li>• You get 1 month free when they upgrade to paid</li>
            <li>• No limit on referrals!</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              Your Referral Link
            </label>
            <div className="flex">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="funky-input flex-1"
              />
              <button
                onClick={copyToClipboard}
                className="funky-copy-button"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button onClick={shareViaWhatsApp} className="funky-share-button">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}