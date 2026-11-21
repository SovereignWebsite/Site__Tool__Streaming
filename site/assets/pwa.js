/* Registers the offline service worker, when the browser has one. Nothing is sent anywhere. */
if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }
