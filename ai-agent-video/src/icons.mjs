// Line icons on a 24px grid, drawn with currentColor strokes.
const P = {
  chat: '<path d="M4 5.5h16v10.5H10l-4.5 3.5V16H4z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.8"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2.5"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9h3.5M2.5 15h3.5M18 9h3.5M18 15h3.5"/>',
  database: '<ellipse cx="12" cy="5.5" rx="7.5" ry="3"/><path d="M4.5 5.5v6.5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V5.5"/><path d="M4.5 12v6.5c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V12"/>',
  wrench: '<path d="M14.6 6.4a4.2 4.2 0 0 0-5.5 5.5L3.5 17.5l3 3 5.6-5.6a4.2 4.2 0 0 0 5.5-5.5l-2.6 2.6-2.5-.5-.5-2.5z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.2"/><path d="M3.5 10h17M8 3v4M16 3v4"/><rect x="13.5" y="13" width="3.5" height="3.5" rx=".6" fill="currentColor" stroke="none"/>',
  sheet: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M4 9h16M4 14.5h16M10 9v11.5"/>',
  doc: '<path d="M6 2.8h8.5L19 7.3v13.9H6z"/><path d="M14.3 2.8v4.7H19M9 12h7M9 15.5h7M9 9h3"/>',
  chart: '<path d="M4 20.5h16"/><rect x="5.5" y="12" width="3" height="6" rx=".6"/><rect x="10.5" y="7.5" width="3" height="10.5" rx=".6"/><rect x="15.5" y="4" width="3" height="14" rx=".6"/>',
  check: '<path d="M5 12.5l4.6 4.6L19.5 7"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5.2l3.4 2"/>',
  send: '<path d="M21.5 2.5L10.8 13.2"/><path d="M21.5 2.5l-6.8 19-3.9-8.3-8.3-3.9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c0-4 3.4-6.2 7.5-6.2s7.5 2.2 7.5 6.2"/>',
  spark: '<path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4-6.4-2.1 6.4-2.1z"/>',
  refresh: '<path d="M20 11.5a8 8 0 0 0-14.3-4.6L4 9"/><path d="M4 4v5h5"/><path d="M4 12.5a8 8 0 0 0 14.3 4.6L20 15"/><path d="M20 20v-5h-5"/>',
  bolt: '<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>',
};

export function icon(name, cls = "ic") {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name]}</svg>`;
}
