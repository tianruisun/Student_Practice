/* The one place the app version lives. Loaded by the page and by sw.js (importScripts), so the offline
   cache name follows the version. Phones only update when sw.js changes too: bump BUILD in sw.js as well. */
self.APP_VERSION = '1.11.0';
/* Hosts that serve Production. Anywhere else (Test, per-deploy previews, localhost) shows the TEST badge.
   tianruisun.github.io stays until the old GitHub Pages address redirects to Cloudflare. */
self.PRODUCTION_HOSTS = ['student-practice.pages.dev', 'tianruisun.github.io'];
