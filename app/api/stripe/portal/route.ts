import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createPortalSession } from '@/lib/stripe';

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const session = await createPortalSession(userId);
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
