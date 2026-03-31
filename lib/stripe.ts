import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function getUserSubscriptionStatus(userId: string, userEmail?: string): Promise<'active' | 'inactive'> {
  try {
    // First try finding by clerkUserId metadata
    const byMeta = await stripe.customers.search({
      query: `metadata['clerkUserId']:'${userId}'`,
    });

    if (byMeta.data.length > 0) {
      const subs = await stripe.subscriptions.list({
        customer: byMeta.data[0].id,
        status: 'active',
      });
      if (subs.data.length > 0) return 'active';
    }

    // Fallback: find by email and check if they have an active subscription
    if (userEmail) {
      const byEmail = await stripe.customers.list({ email: userEmail, limit: 5 });
      for (const customer of byEmail.data) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
        });
        if (subs.data.length > 0) {
          // Auto-tag this customer with their clerkUserId for future lookups
          await stripe.customers.update(customer.id, {
            metadata: { clerkUserId: userId },
          });
          return 'active';
        }
      }
    }

    return 'inactive';
  } catch {
    return 'inactive';
  }
}

export async function createCheckoutSession(userId: string, userEmail: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: userEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
    metadata: { clerkUserId: userId },
    subscription_data: { metadata: { clerkUserId: userId } },
  });
  return session;
}

export async function createPortalSession(userId: string) {
  const customers = await stripe.customers.search({
    query: `metadata['clerkUserId']:'${userId}'`,
  });
  if (customers.data.length === 0) throw new Error('No customer found');

  const session = await stripe.billingPortal.sessions.create({
    customer: customers.data[0].id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/`,
  });
  return session;
}
