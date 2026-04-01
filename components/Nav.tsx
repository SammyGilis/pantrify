'use client';

import { useState, useRef, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { Logo } from './Logo';
import { useSubscription } from '@/hooks/useSubscription';

interface NavProps {
  activePage: string;
  onPageChange: (page: string) => void;
}

const FEEDBACK_URL = 'https://l.instagram.com/?u=https%3A%2F%2Fdocs.google.com%2Fforms%2Fd%2Fe%2F1FAIpQLSfMvihO7uZba0D4my3NJ9NVx9_gyr-lT0dsNn2-PyJKUdn-aA%2Fviewform%3Fusp%3Dpublish-editor%26utm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio%26fbclid%3DPAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnx71CngkwpM3uz_v2WYTjbmFQ6cOad3g87TDb2Wb3AtM18y7GCc6A7e8pycY_aem_TlY9834SNNlVQRYZZSHcow&e=AT4KSMcrDtGnIbHvgBg0O7PCHb5_yZqx59q4NXrn_fu7eTq9KW22XzN6iYBMBuAkmcANcXLrdy8pBYLX_ynWJBCVyrckeuSbIulSbhOtAw';

export function Nav({ activePage, onPageChange }: NavProps) {
  const { isPaid, status, startCheckout, openPortal } = useSubscription();
  const [contactOpen, setContactOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setContactOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
        {/* Contact Us dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setContactOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: 8, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pill-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            Contact Us
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: contactOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {contactOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 200, zIndex: 200, overflow: 'hidden',
            }}>
              <a
                href="https://instagram.com/PantrifyApp"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setContactOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = '#fdf2f8'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#e1306c" stroke="none"/></svg>
                @PantrifyApp
              </a>
              <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              <a
                href={FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setContactOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--green-bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green-dark)" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Give Feedback
              </a>
              <div style={{ height: 1, background: 'var(--border)', margin: '0 12px' }} />
              <a
                href="mailto:pantrify27@gmail.com"
                onClick={() => setContactOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text)', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'var(--pill-bg)'}
                onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                pantrify27@gmail.com
              </a>
            </div>
          )}
        </div>

        {status !== 'loading' && (
          isPaid ? (
            <button onClick={openPortal} style={{ fontSize: 12, background: 'var(--green-light)', color: 'var(--green-dark)', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              ✦ Pro
            </button>
          ) : (
            <button onClick={startCheckout} style={{ fontSize: 12, background: 'var(--green-dark)', color: 'white', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Upgrade
            </button>
          )
        )}
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
    </nav>
  );
}
