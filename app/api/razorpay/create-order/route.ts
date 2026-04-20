import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { amount, tier, billingCycle, userId, userEmail, userName } = await request.json()

    if (!amount || !tier || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      console.error('Missing Razorpay env vars:', { keyId: !!keyId, keySecret: !!keySecret })
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 })
    }

    const credentials = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: 'INR',
        notes: { userId, tier, billingCycle, userEmail: userEmail || '', userName: userName || '' },
      }),
    })

    const order = await response.json()

    if (!response.ok) {
      console.error('Razorpay API error:', order)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (err: any) {
    console.error('Razorpay create-order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
