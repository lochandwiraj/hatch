'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()

  const handleGetStarted = (tier: string) => {
    if (user) {
      if (tier === 'free') {
        router.push('/dashboard')
      } else {
        router.push('/subscription/upgrade')
      }
    } else {
      router.push('/auth/signup')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold gradient-text">Hatch</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <Link href="/dashboard">
                  <Button size="sm">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-primary-800 mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-primary-600 max-w-2xl mx-auto mb-8">
            Start free and upgrade as you grow. Get access to premium events and exclusive features.
          </p>
          <div className="flex justify-center">
            <Badge variant="primary" size="lg">
              <StarIcon className="h-4 w-4 mr-1" />
              No setup fees • Cancel anytime
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge variant="primary">Most Popular</Badge>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${plan.iconBg}`}>
                    <plan.icon className={`h-8 w-8 ${plan.iconColor}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-primary-800 mb-2">{plan.name}</h3>
                  <div className="text-5xl font-bold text-primary-600 mb-2">
                    {plan.price}
                  </div>
                  <p className="text-neutral-500">{plan.billing}</p>
                  {plan.annualPrice && (
                    <div className="mt-2">
                      <p className="text-lg font-semibold text-primary-700">{plan.annualPrice}</p>
                      <p className="text-sm text-success-600 font-medium">{plan.annualSavings}</p>
                    </div>
                  )}
                  <p className="text-neutral-600 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
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
                  onClick={() => handleGetStarted(plan.tier)}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary-800 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-primary-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-neutral-200 pb-8">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 text-neutral-200">
            Join thousands of event organizers who trust Hatch for their events
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={() => handleGetStarted('free')}
            className="bg-white text-primary-600 hover:bg-neutral-100"
          >
            Start Your Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Hatch</h3>
            <p className="text-neutral-300 mb-4">
              Modern event management for the digital age
            </p>
            <p className="text-neutral-400 text-sm">
              © 2024 Hatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    billing: 'Forever free',
    description: 'Perfect for getting started',
    tier: 'free',
    popular: false,
    icon: CheckCircleIcon,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    cta: 'Get Started Free',
    features: [
      '5 curated events per week',
      'Create public profile',
      'Add 2 past events manually',
      'Basic profile sharing',
      'Save 10+ hours/week of searching',
      'Community access (read-only)'
    ]
  },
  {
    name: 'Explorer',
    price: '₹99',
    billing: 'per month',
    description: 'Great for active participants',
    tier: 'explorer_99',
    popular: true,
    icon: StarIcon,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    cta: 'Start Explorer Plan',
    annualPrice: '₹999/year',
    annualSavings: 'Save ₹189 (17% off)',
    features: [
      '10 curated events per week',
      'Everything in Free',
      'Auto-track bookmarked events',
      'Add unlimited past events',
      'Custom profile URL',
      'Profile analytics (who viewed)',
      'Calendar sync (Google/Apple)',
      'Community forum access (full)',
      'Priority support (24h response)'
    ]
  },
  {
    name: 'Professional',
    price: '₹149',
    billing: 'per month',
    description: 'For serious event enthusiasts',
    tier: 'professional_149',
    popular: false,
    icon: StarIcon,
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
    cta: 'Go Professional',
    annualPrice: '₹1,499/year',
    annualSavings: 'Save ₹389 (17% off)',
    features: [
      '15 curated events per week',
      'Everything in Explorer',
      '24-hour early access to events',
      'Auto-attendance verification',
      'Premium badge on profile',
      'Featured profiles (discovery)',
      'Export profile as PDF resume',
      'Success tracking dashboard',
      'Verified attendance badges',
      'Priority support (12h response)'
    ]
  }
]

const faqs = [
  {
    question: 'Can I change my plan at any time?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing differences.'
  },
  {
    question: 'What happens if I cancel my subscription?',
    answer: 'You can cancel anytime. Your subscription will remain active until the end of your current billing period, after which you\'ll be moved to the free plan.'
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 30-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us within 30 days for a full refund.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through Stripe.'
  },
  {
    question: 'Is there a setup fee?',
    answer: 'No setup fees! You only pay the monthly subscription fee. There are no hidden costs or additional charges.'
  },
  {
    question: 'Can I get a discount for annual billing?',
    answer: 'Yes! We offer a 20% discount when you choose annual billing. Contact our sales team to set up annual billing for your account.'
  }
]