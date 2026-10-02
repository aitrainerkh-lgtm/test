import React from 'react';

const paths: Record<string, React.ReactNode> = {
  attendance: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  stock: (
    <>
      <path d="M12 2.8l8.5 4.6v9.2L12 21.2l-8.5-4.6V7.4z" />
      <path d="M3.5 7.4L12 12l8.5-4.6M12 12v9.2" />
    </>
  ),
  purchasing: (
    <>
      <path d="M2.5 3.5h3l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6.4" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17.5" cy="20" r="1.4" />
    </>
  ),
  agent: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
      <path d="M8.5 9.5h.01M12 9.5h.01M15.5 9.5h.01" strokeWidth="3" />
    </>
  ),
  billing: (
    <>
      <path d="M5.5 2.5h13v19l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5z" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </>
  ),
  suppliers: (
    <>
      <path d="M2.5 6h11v10h-11zM13.5 9.5h4l3 3.2V16h-7" />
      <circle cx="6.5" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  leave: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
      <path d="M8 14h3" />
    </>
  ),
  reports: (
    <>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="11" width="3.2" height="7" rx="0.8" />
      <rect x="10.4" y="6" width="3.2" height="12" rx="0.8" />
      <rect x="15.8" y="13" width="3.2" height="5" rx="0.8" />
    </>
  ),
  expenses: (
    <>
      <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h12.5v3.5" />
      <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
      <path d="M16 13.5h.01" strokeWidth="3.2" />
    </>
  ),
  booking: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
      <path d="M9 15l2 2 4-4" />
    </>
  ),
  crm: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
};

export const LineIcon: React.FC<{name: string; size?: number; color?: string}> = ({name, size = 64, color = '#14246B'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {paths[name] ?? paths.more}
  </svg>
);
