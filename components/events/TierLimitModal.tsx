'use client'

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { 
  XMarkIcon,
  StarIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface TierLimitModalProps {
  isOpen: boolean
  onClose: () => void
  currentTier: string
  eventsAttended: number
  tierLimit: number
  upgradeNeeded?: string
}

export default function TierLimitModal({ 
  isOpen, 
  onClose, 
  currentTier, 
  eventsAttended, 
  tierLimit,
  upgradeNeeded 
}: TierLimitModalProps) {
  
  const getTierName = (tier: string) => {
    switch (tier) {
      case 'free': return 'Free'
      case 'basic_99': return 'Explorer'
      case 'premium_149': return 'Professional'
      default: return tier
    }
  }

  const getUpgradeTierName = (tier?: string) => {
    switch (tier) {
      case 'basic_99': return 'Explorer'
      case 'premium_149': return 'Professional'
      default: return 'Premium'
    }
  }

  const getUpgradePrice = (tier?: string) => {
    switch (tier) {
      case 'basic_99': return '₹99'
      case 'premium_149': return '₹149'
      default: return '₹99'
    }
  }

  const getUpgradeLimit = (tier?: string) => {
    switch (tier) {
      case 'basic_99': return '10'
      case 'premium_149': return 'Unlimited'
      default: return '10'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-neutral-900">
              Monthly Event Limit Reached
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <StarIcon className="h-8 w-8 text-warning-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              You've reached your monthly limit!
            </h3>
            
            <p className="text-neutral-600 mb-4">
              You've attended <span className="font-semibold">{eventsAttended} out of {tierLimit}</span> events 
              allowed on your <span className="font-semibold">{getTierName(currentTier)}</span> plan this month.
            </p>
          </div>

          {upgradeNeeded && (
            <div className="bg-gradient-secondary rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-primary-800 mb-3">
                Upgrade to {getUpgradeTierName(upgradeNeeded)}
              </h4>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-primary-700">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  <span>Attend {getUpgradeLimit(upgradeNeeded)} events per month</span>
                </div>
                <div className="flex items-center text-sm text-primary-700">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  <span>Access to premium events</span>
                </div>
                {upgradeNeeded === 'premium_149' && (
                  <div className="flex items-center text-sm text-primary-700">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    <span>Early access to exclusive events</span>
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-sm text-primary-600 mb-3">
                  Only {getUpgradePrice(upgradeNeeded)}/month
                </p>
                <Link href="/subscription/upgrade">
                  <Button className="w-full">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-neutral-900 mb-2">
              Your limits reset on the 1st of every month
            </h4>
            <p className="text-sm text-neutral-600">
              Come back next month to attend more events, or upgrade now for higher limits!
            </p>
          </div>

          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            {upgradeNeeded && (
              <Link href="/subscription/upgrade" className="flex-1">
                <Button className="w-full">
                  Upgrade Plan
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}