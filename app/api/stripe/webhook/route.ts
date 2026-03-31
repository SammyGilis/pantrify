import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Log subscription events (extend this to write to your DB if needed)
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log(`Subscription event: ${event.type}`, event.data.object);
      break;
    case 'invoice.payment_succeeded':
      console.log('Payment succeeded', event.data.object);
      break;
    case 'invoice.payment_failed':
      console.log('Payment failed', event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
