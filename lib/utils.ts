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
    case 'explorer_99':
      return 'Explorer'
    case 'professional_199':
      return 'Professional'
    default:
      return 'Unknown'
  }
}

export function getSubscriptionTierPrice(tier: string, isAnnual = false) {
  switch (tier) {
    case 'free':
      return '₹0'
    case 'explorer_99':
      return isAnnual ? '₹999/year' : '₹99/month'
    case 'professional_199':
      return isAnnual ? '₹1,999/year' : '₹199/month'
    default:
      return 'N/A'
  }
}

export function getWeeklyEventLimit(tier: string) {
  switch (tier) {
    case 'free':
      return 5
    case 'explorer_99':
      return 10
    case 'professional_199':
      return 15
    default:
      return 5
  }
}

export function getManualEventLimit(tier: string) {
  switch (tier) {
    case 'free':
      return 2
    case 'explorer_99':
    case 'professional_199':
      return -1 // unlimited
    default:
      return 2
  }
}

export function getAnnualDiscount(tier: string) {
  switch (tier) {
    case 'explorer_99':
      return { monthly: 99 * 12, annual: 999, savings: 189 }
    case 'professional_199':
      return { monthly: 199 * 12, annual: 1999, savings: 389 }
    default:
      return null
  }
}

export function isEventAccessible(eventTier: string, userTier: string) {
  const tierHierarchy = {
    free: 0,
    explorer_99: 1,
    professional_199: 2
  }
  
  return tierHierarchy[userTier as keyof typeof tierHierarchy] >= tierHierarchy[eventTier as keyof typeof tierHierarchy]
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}