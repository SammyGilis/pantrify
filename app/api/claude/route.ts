import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getUserSubscriptionStatus } from '@/lib/stripe';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const FREE_DAILY_LIMIT = 3;
const PAID_ONLY_FEATURES = ['drinks', 'grocery'];
const usageMap = new Map<string, { count: number; date: string }>();

function getTodayStr() {
  const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay()); return mon.toISOString().split('T')[0];
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const subStatus = await getUserSubscriptionStatus(userId);
  const isPaid = subStatus === 'active';

  const body = await req.json();
  const { messages, max_tokens = 8000, tools, feature } = body;

  // Drinks and grocery are paid-only
  if (PAID_ONLY_FEATURES.includes(feature) && !isPaid) {
    return NextResponse.json(
      {
        error: 'paid_feature',
        message: feature === 'drinks'
          ? 'Drink recipes are a Pro feature. Upgrade to unlock drinks, smart grocery, and unlimited searches.'
          : 'Smart Grocery is a Pro feature. Upgrade to unlock it along with drinks and unlimited searches.',
      },
      { status: 402 }
    );
  }

  // Free tier daily limit for recipes + imports
  if (!isPaid) {
    const today = getTodayStr();
    const usage = usageMap.get(userId);
    const todayCount = usage?.date === today ? usage.count : 0;

    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: 'free_limit_reached',
          message: `You've used your ${FREE_DAILY_LIMIT} free searches this week. Upgrade to Pro for unlimited recipes, drinks, and more.`,
        },
        { status: 402 }
      );
    }

    usageMap.set(userId, { count: todayCount + 1, date: today });
  }

  try {
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
