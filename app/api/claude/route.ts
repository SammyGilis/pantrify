import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserSubscriptionStatus } from '@/lib/stripe';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Free tier limits
const FREE_DAILY_LIMIT = 3;
const usageMap = new Map<string, { count: number; date: string }>();

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check subscription
  const subStatus = await getUserSubscriptionStatus(userId);
  const isPaid = subStatus === 'active';

  // Enforce free tier limit
  if (!isPaid) {
    const today = getTodayStr();
    const usage = usageMap.get(userId);
    const todayCount = usage?.date === today ? usage.count : 0;

    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'free_limit_reached', message: `Free plan allows ${FREE_DAILY_LIMIT} searches per day. Upgrade for unlimited access.` },
        { status: 402 }
      );
    }

    usageMap.set(userId, { count: todayCount + 1, date: today });
  }

  try {
    const body = await req.json();
    const { messages, max_tokens = 8000, tools } = body;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens,
      messages,
      ...(tools ? { tools } : {}),
    });

    return NextResponse.json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Claude API error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
