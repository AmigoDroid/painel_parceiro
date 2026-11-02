import React from 'react';

/** Lightweight outline icons, rendered locally without icon-font or runtime dependencies. */
const paths = {
  dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
  users: <><path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  monitor: <><rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 21h8M12 18v3"/></>,
  key: <><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l2 2M18.5 4.5l2 2"/></>,
  globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  server: <><rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/></>,
  activity: <path d="M2 12h4l3-8 5 16 3-8h5"/>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/></>,
  wallet: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M17 15h.01"/></>,
  coins: <><circle cx="10" cy="9" r="6"/><path d="M14 15a6 6 0 1 1-7 5M10 6v6m-2-4h3"/></>,
  receipt: <><path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3ZM8 8h8M8 12h8M8 16h4"/></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l4 2"/></>,
  account: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5 9a8 8 0 0 1 14-2l1 5M4 12l1 5a8 8 0 0 0 14-2"/></>,
  logout: <><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7"/></>,
  chevron: <path d="m6 9 6 6 6-6"/>,
  chevronRight: <path d="m9 5 7 7-7 7"/>,
  alert: <><path d="m10.2 3.4-8.1 14a2 2 0 0 0 1.7 3h16.4a2 2 0 0 0 1.7-3l-8.1-14a2 2 0 0 0-3.5 0Z"/><path d="M12 9v4M12 17h.01"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  link: <><path d="M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21l1.7-1.7"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  x: <path d="M6 6l12 12M18 6 6 18"/>,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
};

export default function Icon({name='dashboard',size=19,className='',...props}) {
  return <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...props}>{paths[name]||paths.dashboard}</svg>;
}
