'use client'

import Link from 'next/link'
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
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="funky-modal-card">
        <div className="funky-modal-header">
          <h2 className="funky-modal-title">
            Event Access Limit Reached
          </h2>
          <button
            onClick={onClose}
            className="funky-modal-close-button"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="funky-modal-body">
          <div className="funky-confirmation-section">
            <div className="funky-warning-icon">
              <StarIcon className="h-12 w-12" />
            </div>
            
            <h3 className="funky-confirmation-title">
              You've reached your event access limit!
            </h3>
            
            <p className="funky-confirmation-text">
              You've attended <span className="font-bold">{eventsAttended} out of {tierLimit}</span> events 
              allowed on your <span className="font-bold">{getTierName(currentTier)}</span> plan.
            </p>
          </div>

          {upgradeNeeded && (
            <div className="funky-upgrade-card">
              <h4 className="funky-upgrade-title">
                Upgrade to {getUpgradeTierName(upgradeNeeded)}
              </h4>
              
              <div className="funky-feature-list">
                <div className="funky-feature-item">
                  <CheckIcon className="h-4 w-4" />
                  <span>Attend {getUpgradeLimit(upgradeNeeded)} events per month</span>
                </div>
                <div className="funky-feature-item">
                  <CheckIcon className="h-4 w-4" />
                  <span>Access to premium events</span>
                </div>
                {upgradeNeeded === 'premium_149' && (
                  <div className="funky-feature-item">
                    <CheckIcon className="h-4 w-4" />
                    <span>Early access to exclusive events</span>
                  </div>
                )}
              </div>
              
              <div className="funky-pricing-section">
                <p className="funky-price-text">
                  Only {getUpgradePrice(upgradeNeeded)}/month
                </p>
                <Link href="/subscription/upgrade">
                  <button className="funky-modal-button primary full-width">
                    Upgrade Now
                  </button>
                </Link>
              </div>
            </div>
          )}

          <div className="funky-info-card">
            <h4 className="funky-info-title">
              Your limits reset on the 1st of every month
            </h4>
            <p className="funky-info-text">
              Come back next month to attend more events, or upgrade now for higher limits!
            </p>
          </div>

          <div className="funky-modal-actions">
            <button 
              onClick={onClose} 
              className="funky-modal-button secondary"
            >
              Maybe Later
            </button>
            {upgradeNeeded && (
              <Link href="/subscription/upgrade">
                <button className="funky-modal-button primary">
                  Upgrade Plan
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}