// Client-side payment cleanup utilities
import { supabase } from './supabase'

export interface CleanupResult {
  success: boolean
  cleanup_date?: string
  records_deleted?: number
  status?: string
  error?: string
}

/**
 * Manually run payment cleanup to delete submissions older than 3 days
 */
export async function runPaymentCleanup(): Promise<CleanupResult> {
  try {
    const { data, error } = await supabase.rpc('run_payment_cleanup')

    if (error) {
      console.error('Cleanup error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    const result = data?.[0]
    return {
      success: true,
      cleanup_date: result?.cleanup_date,
      records_deleted: result?.records_deleted || 0,
      status: result?.status || 'Cleanup completed'
    }
  } catch (error: any) {
    console.error('Cleanup function error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Get cleanup history/logs
 */
export async function getCleanupLogs(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('payment_cleanup_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching cleanup logs:', error)
      return { success: false, error: error.message }
    }

    return { success: true, logs: data }
  } catch (error: any) {
    console.error('Cleanup logs error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check how many payment submissions are older than 3 days
 */
export async function checkOldPayments() {
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { count, error } = await supabase
      .from('payment_submissions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', threeDaysAgo.toISOString())

    if (error) {
      console.error('Error checking old payments:', error)
      return { success: false, error: error.message }
    }

    return { success: true, oldPaymentsCount: count || 0 }
  } catch (error: any) {
    console.error('Check old payments error:', error)
    return { success: false, error: error.message }
  }
}