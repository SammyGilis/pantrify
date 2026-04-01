export function Logo() {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 36, height: 36 }}>
      {/* Green P letter */}
      <rect x="5" y="4" width="7" height="28" rx="3.5" fill="#2d8c1e"/>
      {/* P bump (top half circle) */}
      <path d="M12 4 C12 4 26 4 26 11.5 C26 19 12 19 12 19 L12 4Z" fill="#2d8c1e"/>
      {/* Inner cutout of P */}
      <path d="M12.5 7.5 C12.5 7.5 21.5 7.5 21.5 11.5 C21.5 15.5 12.5 15.5 12.5 15.5 L12.5 7.5Z" fill="white"/>
      {/* Left leaf */}
      <path d="M11 4.5 C10 2.5 7.5 2 7 1 C7 1 7.5 0.5 9 1.5 C10.5 2.5 11 4 11 4.5Z" fill="#2d8c1e"/>
      {/* Right leaf */}
      <path d="M13 4.5 C14 2.5 16.5 2 17 1 C17 1 16.5 0.5 15 1.5 C13.5 2.5 13 4 13 4.5Z" fill="#3aaa22"/>
      {/* Leaf stem dot */}
      <circle cx="12" cy="4.2" r="0.8" fill="#1a6b10"/>
    </svg>
  );
}
