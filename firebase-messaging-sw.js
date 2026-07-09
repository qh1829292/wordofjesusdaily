importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCn-Dxz9d8BJ9jtnda-UJ5B3ZrcZ6YNMkk",
  authDomain: "word-of-jesus-daily.firebaseapp.com",
  projectId: "word-of-jesus-daily",
  storageBucket: "word-of-jesus-daily.firebasestorage.app",
  messagingSenderId: "158863158468",
  appId: "1:158863158468:web:8deeb2b7f02d94ef0bad91"
});

// Alleen de losse 'push'-listener gebruiken (niet ook messaging.onBackgroundMessage) —
// beide tegelijk actief hebben zorgt ervoor dat elk bericht dubbel als notificatie
// verschijnt, omdat ze onafhankelijk van elkaar reageren op hetzelfde push-event.

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || 'Word of Jesus Daily';
    const body = data.notification?.body || 'Open voor het vers van vandaag';
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'verse-notificatie'
      })
    );
  } catch (e) {
    console.error('Push event error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('quintsquestforjesus.blogspot.com') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('https://quintsquestforjesus.blogspot.com/p/word-of-jesus-daily.html');
    })
  );
});
