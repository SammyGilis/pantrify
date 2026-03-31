import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 800, fontSize: 24, color: '#111827', marginBottom: 32 }}>
          <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 40, height: 40 }}>
            <circle cx="18" cy="18" r="18" fill="#16a34a" />
            <rect x="8" y="6" width="6" height="24" rx="2" fill="white" />
            <path d="M14 6 C14 6 26 6 26 13 C26 20 14 20 14 20 L14 6Z" fill="white" />
            <path d="M14.5 9 C14.5 9 22.5 9 22.5 13 C22.5 17 14.5 17 14.5 17 L14.5 9Z" fill="#16a34a" />
          </svg>
          Pantrify
        </div>
        <SignUp />
      </div>
    </div>
  );
}
