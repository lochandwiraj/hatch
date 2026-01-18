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

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?ref=${profile.referral_code || profile.id}`

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
    const message = `Hey! I'm using EventScout to discover curated student events every week. Join using my link and get 20% off your first month: ${referralLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <Card>
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mr-4">
          <GiftIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">Share & Earn</h3>
          <p className="text-neutral-600">Invite friends and get rewards</p>
        </div>
      </div>

      <div className="bg-gradient-secondary rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-primary-800 mb-2">How it works:</h4>
        <ul className="space-y-1 text-sm text-primary-700">
          <li>• Your friend gets 20% off their first month</li>
          <li>• You get 1 month free when they upgrade to paid</li>
          <li>• No limit on referrals!</li>
        </ul>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Your Referral Link
          </label>
          <div className="flex">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-lg bg-neutral-50 text-sm"
            />
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="rounded-l-none border-l-0"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <ClipboardDocumentIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex space-x-2">
          <Button onClick={shareViaWhatsApp} className="flex-1">
            <ShareIcon className="h-4 w-4 mr-2" />
            Share on WhatsApp
          </Button>
        </div>
      </div>
    </Card>
  )
}