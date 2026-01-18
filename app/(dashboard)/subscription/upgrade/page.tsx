'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import QRPaymentModal from '@/components/payment/QRPaymentModal'
import { 
  StarIcon, 
  CheckCircleIcon,
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName } from '@/lib/utils'

export default function SubscriptionUpgradePage() {
  const { profile } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [isAnnual, setIsAnnual] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  if (!profile) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-96 bg-neutral-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    )
  }

  const availablePlans = getAvailablePlans(profile.subscription_tier)

  const handleUpgrade = (plan: any) => {
    setSelectedPlan({
      ...plan,
      isAnnual,
      price: isAnnual ? plan.annualPrice : plan.monthlyPrice
    })
    setShowPaymentModal(true)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Upgrade Your Plan
          </h1>
          <p className="text-neutral-600">
            Get more curated events and premium features
          </p>
          <div className="mt-4">
            <Badge variant="primary" size="lg">
              Current: {getSubscriptionTierName(profile.subscription_tier)}
            </Badge>
          </div>
        </div>

        {/* Annual/Monthly Toggle */}
        <div className="flex justify-center">
          <div className="bg-neutral-100 rounded-lg p-1 flex">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                !isAnnual 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isAnnual 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-neutral-600 hover:text-neutral-800'
              }`}
            >
              Annual
              <Badge variant="success" size="sm" className="ml-2">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {availablePlans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="primary">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${plan.iconBg}`}>
                  <plan.icon className={`h-8 w-8 ${plan.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                
                <div className="mb-4">
                  <div className="text-4xl font-bold text-primary-600">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </div>
                  <p className="text-neutral-500">
                    {isAnnual ? 'per year' : 'per month'}
                  </p>
                  {isAnnual && (
                    <p className="text-success-600 font-medium text-sm mt-1">
                      Save ₹{plan.annualSavings} (17% off)
                    </p>
                  )}
                </div>
                
                <p className="text-neutral-600">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={plan.popular ? 'primary' : 'secondary'} 
                className="w-full"
                onClick={() => handleUpgrade(plan)}
              >
                Upgrade to {plan.name}
              </Button>
            </Card>
          ))}
        </div>

        {/* Payment Process Info */}
        <Card className="max-w-2xl mx-auto">
          <div className="flex items-start">
            <ClockIcon className="h-6 w-6 text-primary-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-neutral-900 mb-2">
                How Payment Works
              </h3>
              <ol className="text-sm text-neutral-600 space-y-1">
                <li>1. Click "Upgrade" and scan the QR code with any UPI app</li>
                <li>2. Pay the exact amount shown</li>
                <li>3. Upload payment screenshot and transaction ID</li>
                <li>4. We'll verify and activate your plan within 24 hours</li>
                <li>5. You'll receive email confirmation once approved</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* FAQ */}
        <Card className="max-w-2xl mx-auto">
          <h3 className="font-semibold text-neutral-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-neutral-800">
                How long does verification take?
              </h4>
              <p className="text-sm text-neutral-600 mt-1">
                Usually within 24 hours. You'll get an email once your payment is verified and plan is activated.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-800">
                Can I cancel anytime?
              </h4>
              <p className="text-sm text-neutral-600 mt-1">
                Yes! You can cancel anytime. Your subscription will remain active until the end of your billing period.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-neutral-800">
                What if my payment fails verification?
              </h4>
              <p className="text-sm text-neutral-600 mt-1">
                We'll email you with the reason and help you resolve any issues. You can resubmit with correct details.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Modal */}
      <QRPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={selectedPlan}
      />
    </MainLayout>
  )
}

function getAvailablePlans(currentTier: string) {
  const allPlans = [
    {
      name: 'Explorer',
      tier: 'explorer_99',
      monthlyPrice: '₹99',
      annualPrice: '₹999',
      annualSavings: '189',
      description: 'Perfect for active students',
      popular: true,
      icon: StarIcon,
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600',
      features: [
        '10 curated events per week',
        'Auto-track bookmarked events',
        'Add unlimited past events',
        'Custom profile URL',
        'Profile analytics',
        'Calendar sync (Google/Apple)',
        'Community forum access',
        'Priority support (24h)'
      ]
    },
    {
      name: 'Professional',
      tier: 'professional_199',
      monthlyPrice: '₹199',
      annualPrice: '₹1,999',
      annualSavings: '389',
      description: 'For serious achievers',
      popular: false,
      icon: SparklesIcon,
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-600',
      features: [
        '15 curated events per week',
        'Everything in Explorer',
        '24-hour early access',
        'Auto-attendance verification',
        'Premium badge on profile',
        'Featured in discovery',
        'Export profile as PDF',
        'Success tracking dashboard',
        'Verified attendance badges',
        'Priority support (12h)'
      ]
    }
  ]

  // Filter plans based on current tier
  const tierHierarchy = { free: 0, explorer_99: 1, professional_199: 2 }
  const currentLevel = tierHierarchy[currentTier as keyof typeof tierHierarchy]
  
  return allPlans.filter(plan => {
    const planLevel = tierHierarchy[plan.tier as keyof typeof tierHierarchy]
    return planLevel > currentLevel
  })
}