import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getUserSubscriptionStatus } from '@/lib/stripe';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ status: 'inactive' });

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress;

  const status = await getUserSubscriptionStatus(userId, email);
  return NextResponse.json({ status });
}
