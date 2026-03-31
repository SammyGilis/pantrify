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

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        const customerId = session.customer as string;

        // Tag the Stripe customer with the Clerk user ID so we can look them up later
        if (clerkUserId && customerId) {
          await stripe.customers.update(customerId, {
            metadata: { clerkUserId },
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const clerkUserId = sub.metadata?.clerkUserId;
        const customerId = sub.customer as string;

        // Also tag customer from subscription metadata as a backup
        if (clerkUserId && customerId) {
          await stripe.customers.update(customerId, {
            metadata: { clerkUserId },
          });
        }
        break;
      }

      case 'customer.subscription.deleted':
        console.log('Subscription cancelled:', event.data.object);
        break;

      case 'invoice.payment_succeeded':
        console.log('Payment succeeded:', event.data.object);
        break;

      case 'invoice.payment_failed':
        console.log('Payment failed:', event.data.object);
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return NextResponse.json({ received: true });
}
