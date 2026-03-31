'use client';

import { useEffect, useState } from 'react';
import { SubscriptionStatus } from '@/lib/types';

export function useSubscription() {
  const [status, setStatus] = useState<SubscriptionStatus>('loading');

  useEffect(() => {
    fetch('/api/subscription')
      .then(r => r.json())
      .then(data => setStatus(data.status ?? 'inactive'))
      .catch(() => setStatus('inactive'));
  }, []);

  const startCheckout = async () => {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const openPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  return { status, isPaid: status === 'active', startCheckout, openPortal };
}
