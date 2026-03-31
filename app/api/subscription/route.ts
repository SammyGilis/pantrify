import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserSubscriptionStatus } from '@/lib/stripe';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ status: 'inactive' });

  const status = await getUserSubscriptionStatus(userId);
  return NextResponse.json({ status });
}
