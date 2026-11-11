/* Release notes (v1.11.0): what each version added, newest first, from v1.10.0 on (Terry, 2026-11-11).
   The words live in js/i18n.js: 'rel.<version>.<id>T' is an item's title and 'rel.<version>.<id>' says how to use it.
   show: an optional CSS selector on Home that "Show me" highlights for that item (v1.12.0: the options are in a sheet,
   so an item about them points at the card that opens it).
   Add the new version at the top of this list in every release that changes something a student or parent can see. */
self.RELEASES = [
  { v: '1.12.0', items: [
    { id: 'modes', show: '#modeCards' },
    { id: 'week', show: '#weekCard' },
    { id: 'icons', show: '#cardPractice' },
    { id: 'settings', show: '#navParent' },
    { id: 'relax', show: '#navGames' }
  ] },
  { v: '1.11.0', items: [
    { id: 'news', show: '#navParent' },
    { id: 'levels', show: '#cardPractice' },
    { id: 'start', show: '#cardPractice' }
  ] },
  { v: '1.10.1', items: [
    { id: 'checks' }
  ] },
  { v: '1.10.0', items: [
    { id: 'study', show: '#cardStudy' },
    { id: 'kinder', show: '#cardStudy' },
    { id: 'games', show: '#navGames' },
    { id: 'submit' }
  ] }
];

/* -1, 0 or 1 for two "X.Y.Z" versions */
self.compareVersions = function (a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};
