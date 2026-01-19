import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getSubscriptionTierName(tier: string) {
  switch (tier) {
    case 'free':
      return 'Free'
    case 'basic_99':
      return 'Explorer'
    case 'premium_149':
      return 'Professional'
    default:
      return 'Unknown'
  }
}

export function getSubscriptionTierPrice(tier: string, isAnnual = false) {
  switch (tier) {
    case 'free':
      return '₹0'
    case 'basic_99':
      return isAnnual ? '₹999/year' : '₹99'
    case 'premium_149':
      return isAnnual ? '₹1,499/year' : '₹149'
    default:
      return 'N/A'
  }
}

export function getEventLimit(tier: string) {
  switch (tier) {
    case 'free':
      return 5
    case 'basic_99':
      return 7
    case 'premium_149':
      return -1 // unlimited access to all hackathons
    default:
      return 5
  }
}

export function getEventLimitDescription(tier: string) {
  switch (tier) {
    case 'free':
      return '5 curated events'
    case 'basic_99':
      return '7 curated events'
    case 'premium_149':
      return 'All hackathons & events'
    default:
      return '5 curated events'
  }
}

export function getManualEventLimit(tier: string) {
  switch (tier) {
    case 'free':
      return 2
    case 'basic_99':
    case 'premium_149':
      return -1 // unlimited
    default:
      return 2
  }
}

export function getAnnualDiscount(tier: string) {
  switch (tier) {
    case 'basic_99':
      return { monthly: 99 * 12, annual: 999, savings: 189 }
    case 'premium_149':
      return { monthly: 149 * 12, annual: 1499, savings: 289 }
    default:
      return null
  }
}

export function isEventAccessible(eventTier: string, userTier: string) {
  const tierHierarchy = {
    free: 0,
    basic_99: 1,
    premium_149: 2
  }
  
  return tierHierarchy[userTier as keyof typeof tierHierarchy] >= tierHierarchy[eventTier as keyof typeof tierHierarchy]
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}