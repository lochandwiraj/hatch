'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Button from '@/components/ui/Button'
import RollerLoader from '@/components/ui/RollerLoader'
import PixelBlast from '@/components/ui/PixelBlast'
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: '#212121' }}>
        <PixelBlast 
          variant="square"
          pixelSize={4}
          color="#B19EEF"
          patternScale={2}
          patternDensity={1}
          enableRipples={true}
          rippleIntensityScale={1}
          rippleThickness={0.1}
          rippleSpeed={0.3}
          transparent={true}
          edgeFade={0.5}
          className="absolute inset-0"
        />
        <RollerLoader />
      </div>
    )
  }

  if (user) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#000000' }}>
      {/* Hero Section */}
      <section className="hero-section relative" style={{ background: 'transparent', zIndex: 10 }}>
        <PixelBlast 
          variant="square"
          pixelSize={4}
          color="#B19EEF"
          patternScale={2}
          patternDensity={1}
          enableRipples={true}
          rippleIntensityScale={1}
          rippleThickness={0.1}
          rippleSpeed={0.3}
          transparent={true}
          edgeFade={0.5}
          className="absolute inset-0"
          style={{ zIndex: 1 }}
        />
        <div className="absolute inset-0 bg-black opacity-20" style={{ zIndex: 2 }}></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="floating-element">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Stop Searching. <span style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Start Discovering.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-3xl mx-auto">
              Hand-picked student events. Save 10+ hours. Build your portfolio.
              Quality over quantity - your curated event digest.
            </p>
          </div>
          
          <div className="flex justify-center mb-16">
            <button 
              onClick={() => router.push('/auth')}
              className="animated-button text-lg px-8 py-4 flex items-center justify-center"
            >
              <span className="flex items-center">
                Get Started Free
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </span>
            </button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <CalendarDaysIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#A855F7' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">Curated, Not Cluttered</h3>
              <p className="text-gray-300">We research 50+ sources to bring you only the best opportunities.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <UserGroupIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#A855F7' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">Save Time</h3>
              <p className="text-gray-300">Stop scrolling through Unstop, Devfolio, LinkedIn. We do the hunting for you.</p>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-4" style={{ color: '#A855F7' }} />
              <h3 className="text-xl font-semibold mb-2 text-white">Build Your Portfolio</h3>
              <p className="text-gray-300">Every event you attend goes on your profile. Share it with recruiters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-gray-700 opacity-30"></div>

      {/* Features Section */}
      <section className="py-20" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Everything you need to manage events
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              From small meetups to large conferences, Hatch provides all the tools you need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 p-6 hover:shadow-xl hover:border-purple-500/50 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <feature.icon className="h-8 w-8 mr-3" style={{ color: '#A855F7' }} />
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-gray-700 opacity-30"></div>

      {/* Pricing Section */}
      <section className="py-20" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Start free and upgrade as you grow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 flex flex-col h-full ${plan.popular ? 'border-purple-500 shadow-purple-500/20' : 'border-gray-700/50 hover:border-purple-500/50'}`}>
                {plan.popular && (
                  <div className="text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4 self-start" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #C084FC 100%)' }}>
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold mb-4" style={{ color: '#A855F7' }}>
                  {plan.price}
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-center mt-auto">
                  <button 
                    className="animated-button flex items-center justify-center"
                    onClick={() => router.push('/auth')}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-gray-700 opacity-30"></div>

      {/* CTA Section */}
      <section className="py-20" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-4 text-white">Ready to get started?</h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of event organizers who trust Hatch for their events
          </p>
          <div className="flex justify-center">
            <button 
              onClick={() => router.push('/auth')}
              className="text-lg px-8 py-4 bg-black text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105"
              style={{
                border: '3px solid',
                borderImage: 'linear-gradient(-45deg, #e81cff 0%, #40c9ff 100%) 1'
              }}
            >
              <span className="flex items-center justify-center">
                Start Your Free Trial
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <div className="w-full h-px bg-gray-700 opacity-30"></div>

      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">Hatch</h3>
            <p className="text-gray-300 mb-4">
              Modern event management for the digital age
            </p>
            <p className="text-gray-500 text-sm">
              © 2026 Hatch. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: CalendarDaysIcon,
    title: 'Event Creation',
    description: 'Create and customize events with detailed information, dates, and requirements'
  },
  {
    icon: UserGroupIcon,
    title: 'User Management',
    description: 'Manage attendees, track registrations, and handle user profiles'
  },
  {
    icon: ChartBarIcon,
    title: 'Analytics Dashboard',
    description: 'Get insights into attendance patterns and event performance'
  },
  {
    icon: CheckCircleIcon,
    title: 'Attendance Tracking',
    description: 'Track who attended events and manage attendance confirmations'
  },
  {
    icon: StarIcon,
    title: 'Subscription Tiers',
    description: 'Offer different access levels with subscription-based event access'
  },
  {
    icon: ArrowRightIcon,
    title: 'Easy Integration',
    description: 'Seamlessly integrate with your existing tools and workflows'
  }
]

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    popular: false,
    features: [
      '5 curated events',
      'Basic profile management',
      'Event browsing',
      'Community access'
    ]
  },
  {
    name: 'Explorer',
    price: '₹99',
    popular: true,
    features: [
      '7 curated events',
      'New events added regularly',
      'Priority event registration',
      'Enhanced profile features',
      'Email notifications'
    ]
  },
  {
    name: 'Professional',
    price: '₹149',
    popular: false,
    features: [
      'All hackathons & events',
      'Fresh hackathons regularly',
      'VIP event access',
      'Advanced analytics',
      'Custom event requests',
      'Priority support'
    ]
  }
]