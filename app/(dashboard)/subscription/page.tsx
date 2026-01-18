'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import MainLayout from '@/components/layout/MainLayout'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { 
  StarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline'
import { getSubscriptionTierName, getSubscriptionTierPrice } from '@/lib/utils'
import Link from 'next/link'

export default function SubscriptionPage() {
  const { profile } = useAuth()

  if (!profile) {
    return (
      <MainLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-200 rounded w-1/4"></div>
          <div className="h-64 bg-neutral-200 rounded-xl"></div>
        </div>
      </MainLayout>
    )
  }

  const isExpired = profile.subscription_expires_at && 
    new Date(profile.subscription_expires_at) < new Date()

  const daysUntilExpiry = profile.subscription_expires_at ? 
    Math.ceil((new Date(profile.subscription_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Subscription</h1>
          <p className="text-neutral-600 mt-1">
            Manage your subscription and billing
          </p>
        </div>

        {/* Current Subscription */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mr-4">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Current Plan</h2>
                <p className="text-neutral-600">Your active subscription</p>
              </div>
            </div>
            <Badge 
              variant={profile.subscription_tier === 'free' ? 'default' : 'primary'}
              size="lg"
            >
              {getSubscriptionTierName(profile.subscription_tier)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {getSubscriptionTierPrice(profile.subscription_tier)}
              </div>
              <p className="text-neutral-600">per month</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900 mb-2">
                {profile.events_attended}
              </div>
              <p className="text-neutral-600">events attended</p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-neutral-900 mb-2">
                {profile.subscription_expires_at ? (
                  isExpired ? 'Expired' : `${daysUntilExpiry} days`
                ) : '∞'}
              </div>
              <p className="text-neutral-600">
                {profile.subscription_expires_at ? 'until renewal' : 'no expiry'}
              </p>
            </div>
          </div>

          {/* Expiry Warning */}
          {profile.subscription_expires_at && daysUntilExpiry !== null && (
            <div className={`mt-6 p-4 rounded-lg ${
              daysUntilExpiry <= 7 
                ? 'bg-error-50 border border-error-200' 
                : daysUntilExpiry <= 30 
                  ? 'bg-warning-50 border border-warning-200'
                  : 'bg-success-50 border border-success-200'
            }`}>
              <div className="flex items-center">
                <ClockIcon className={`h-5 w-5 mr-2 ${
                  daysUntilExpiry <= 7 
                    ? 'text-error-600' 
                    : daysUntilExpiry <= 30 
                      ? 'text-warning-600'
                      : 'text-success-600'
                }`} />
                <p className={`font-medium ${
                  daysUntilExpiry <= 7 
                    ? 'text-error-800' 
                    : daysUntilExpiry <= 30 
                      ? 'text-warning-800'
                      : 'text-success-800'
                }`}>
                  {isExpired 
                    ? 'Your subscription has expired'
                    : daysUntilExpiry <= 7
                      ? `Your subscription expires in ${daysUntilExpiry} days`
                      : `Your subscription renews in ${daysUntilExpiry} days`
                  }
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Subscription Benefits */}
        <Card>
          <h3 className="text-xl font-semibold mb-4">Your Benefits</h3>
          <div className="space-y-3">
            {getCurrentBenefits(profile.subscription_tier).map((benefit, index) => (
              <div key={index} className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-success-500 mr-3" />
                <span className="text-neutral-700">{benefit}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Upgrade Options */}
        {profile.subscription_tier !== 'premium_149' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {getUpgradeOptions(profile.subscription_tier).map((plan, index) => (
              <Card key={index} className="relative">
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-primary-600 mb-4">
                    {plan.price}<span className="text-lg text-neutral-500">/month</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-success-500 mr-2" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/subscription/upgrade">
                  <Button className="w-full">
                    Upgrade to {plan.name}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Billing History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Billing History</h3>
            <CreditCardIcon className="h-6 w-6 text-neutral-400" />
          </div>
          
          <div className="text-center py-8">
            <p className="text-neutral-500">No billing history available</p>
            <p className="text-sm text-neutral-400 mt-1">
              Billing information will appear here after your first payment
            </p>
          </div>
        </Card>

        {/* Manage Subscription */}
        {profile.subscription_tier !== 'free' && (
          <Card>
            <h3 className="text-xl font-semibold mb-4">Manage Subscription</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline">
                Update Payment Method
              </Button>
              <Button variant="outline">
                Download Invoice
              </Button>
              <Button variant="danger">
                Cancel Subscription
              </Button>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}

function getCurrentBenefits(tier: string) {
  const benefits = {
    free: [
      'Access to free events',
      'Basic profile management',
      'Event browsing',
      'Attendance tracking',
      'Community access'
    ],
    basic_99: [
      'Everything in Free',
      'Access to basic tier events',
      'Priority event registration',
      'Enhanced profile features',
      'Email notifications',
      'Basic analytics'
    ],
    premium_149: [
      'Everything in Basic',
      'Access to all premium events',
      'VIP event access',
      'Advanced analytics',
      'Custom event creation',
      'Priority support',
      'Exclusive networking'
    ]
  }

  return benefits[tier as keyof typeof benefits] || benefits.free
}

function getUpgradeOptions(currentTier: string) {
  const allPlans = [
    {
      name: 'Basic',
      price: '$99',
      tier: 'basic_99',
      popular: true,
      features: [
        'Everything in Free',
        'Access to basic tier events',
        'Priority event registration',
        'Enhanced profile features',
        'Email notifications',
        'Basic analytics'
      ]
    },
    {
      name: 'Premium',
      price: '$149',
      tier: 'premium_149',
      popular: false,
      features: [
        'Everything in Basic',
        'Access to all premium events',
        'VIP event access',
        'Advanced analytics',
        'Custom event creation',
        'Priority support',
        'Exclusive networking'
      ]
    }
  ]

  // Filter out current and lower tiers
  const tierHierarchy = { free: 0, basic_99: 1, premium_149: 2 }
  const currentLevel = tierHierarchy[currentTier as keyof typeof tierHierarchy]
  
  return allPlans.filter(plan => {
    const planLevel = tierHierarchy[plan.tier as keyof typeof tierHierarchy]
    return planLevel > currentLevel
  })
}