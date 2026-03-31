'use client';

import { useSubscription } from '@/hooks/useSubscription';

interface PaywallBannerProps {
  message?: string;
}

export function PaywallBanner({ message }: PaywallBannerProps) {
  const { startCheckout } = useSubscription();

  return (
    <div style={{
      background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      borderRadius: 16, padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, flexWrap: 'wrap',
      maxWidth: 640, margin: '0 auto 16px',
    }}>
      <div style={{ color: 'white' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
          🔒 {message ?? "You've used your 3 free searches today"}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Upgrade to Pro for unlimited recipes, drink recipes, smart grocery & imports.
        </div>
      </div>
      <button
        onClick={startCheckout}
        style={{
          background: 'white', color: '#6d28d9', border: 'none',
          borderRadius: 99, padding: '10px 20px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}
      >
        ✦ Upgrade to Pro
      </button>
    </div>
  );
}
