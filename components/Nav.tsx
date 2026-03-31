'use client';

import { UserButton } from '@clerk/nextjs';
import { Logo } from './Logo';
import { useSubscription } from '@/hooks/useSubscription';

interface NavProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

export function Nav({ activePage, onPageChange }: NavProps) {
  const { isPaid, status, startCheckout, openPortal } = useSubscription();

  return (
    <nav>
      <div className="nav-logo" onClick={() => onPageChange('discover')}>
        <div className="nav-logo-icon"><Logo /></div>
        Pantrify
      </div>

      <div className="nav-tabs">
        {[
          { id: 'discover', label: 'Discover Recipes', icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          )},
          { id: 'drinks', label: 'Drinks', icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 22h8M12 11v11M5 11h14l-1.5-7h-11L5 11z" /></svg>
          )},
          { id: 'import', label: 'Import Recipe', icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
          )},
          { id: 'history', label: 'History & Grocery', icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" /><polyline points="12 6 12 12 16 14" /></svg>
          )},
        ].map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${activePage === tab.id ? ' active' : ''}`}
            onClick={() => onPageChange(tab.id)}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="nav-right">
        <a
          href="https://instagram.com/PantrifyApp"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textDecoration: 'none', padding: '5px 10px', borderRadius: 8, transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#e1306c'; (e.currentTarget as HTMLAnchorElement).style.background = '#fdf2f8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          @PantrifyApp
        </a>
        {status !== 'loading' && (
          isPaid ? (
            <button
              onClick={openPortal}
              style={{ fontSize: 12, background: 'var(--green-light)', color: 'var(--green-dark)', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              ✦ Pro
            </button>
          ) : (
            <button
              onClick={startCheckout}
              style={{ fontSize: 12, background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Upgrade
            </button>
          )
        )}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </nav>
  );
}
