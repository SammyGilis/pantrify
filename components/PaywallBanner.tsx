'use client';

import { useSubscription } from '@/hooks/useSubscription';

interface PaywallBannerProps {
  message?: string;
}

export function PaywallBanner({ message }: PaywallBannerProps) {
  const { startCheckout } = useSubscription();

  return (
    <div className="paywall-banner">
      <div>
        <p>🔒 {message ?? 'You\'ve reached your free daily limit'}</p>
        <span>Upgrade to Pantrify Pro for unlimited recipes, drinks & imports</span>
      </div>
      <button className="paywall-upgrade-btn" onClick={startCheckout}>
        Upgrade — $X/mo
      </button>
    </div>
  );
}
