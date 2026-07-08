importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "VUL_IN",
  authDomain: "VUL_IN.firebaseapp.com",
  projectId: "VUL_IN",
  storageBucket: "VUL_IN.firebasestorage.app",
  messagingSenderId: "VUL_IN",
  appId: "VUL_IN"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Word of Jesus Daily';
  const options = {
    body: payload.notification?.body || 'Open voor het vers van vandaag',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'verse-notificatie'
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || 'Word of Jesus Daily';
    const body = data.notification?.body || 'Open voor het vers van vandaag';
    event.waitUntil(self.registration.showNotification(title, { body, icon: '/icon-192.png', badge: '/icon-192.png', tag: 'verse-notificatie' }));
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
