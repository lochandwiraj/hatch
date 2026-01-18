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
      return 'Basic'
    case 'premium_149':
      return 'Premium'
    default:
      return 'Unknown'
  }
}

export function getSubscriptionTierPrice(tier: string) {
  switch (tier) {
    case 'free':
      return '$0'
    case 'basic_99':
      return '$99'
    case 'premium_149':
      return '$149'
    default:
      return 'N/A'
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