import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function getUserSubscriptionStatus(userId: string): Promise<'active' | 'inactive'> {
  try {
    // Search for customer by clerk userId in metadata
    const customers = await stripe.customers.search({
      query: `metadata['clerkUserId']:'${userId}'`,
    });

    if (customers.data.length === 0) return 'inactive';

    const customer = customers.data[0];
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
    });

    return subscriptions.data.length > 0 ? 'active' : 'inactive';
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
