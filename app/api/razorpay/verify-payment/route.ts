import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      userId,
      tier,
      billingCycle,
      amount,
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !tier) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify Razorpay signature — only the server knows the secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Use service role to bypass RLS and activate subscription
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const durationDays = billingCycle === 'annual' ? 365 : 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)

    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        subscription_expires_at: expiresAt.toISOString(),
        tier_upgraded_at: new Date().toISOString(),
        tier_upgraded_by: null,
        auto_downgrade_enabled: true,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Supabase update error:', updateError)
      return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 })
    }

    // Log to payment_submissions — non-critical, don't let failures affect response
    supabaseAdmin.from('payment_submissions').insert({
      user_id: userId,
      username: '',
      full_name: '',
      email: '',
      transaction_id: razorpay_payment_id,
      payment_screenshot_url: '',
      requested_tier: tier,
      amount_paid: amount,
      payment_method: 'Razorpay',
      is_annual: billingCycle === 'annual',
      status: 'approved',
      admin_notes: `Auto-verified via Razorpay. Order: ${razorpay_order_id}`,
      reviewed_at: new Date().toISOString(),
    }).then(({ error }) => {
      if (error) console.error('payment_submissions log failed (non-critical):', error.message)
    })

    return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString(), durationDays })
  } catch (err: any) {
    console.error('Razorpay verify-payment error:', err)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
