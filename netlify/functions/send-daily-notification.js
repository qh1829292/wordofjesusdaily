const { getStore } = require('@netlify/blobs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

exports.handler = async function (event) {
  try {
    // Haal vandaag's vers op (dezelfde functie als de site gebruikt, voor synchronisatie)
    const verseRes = await fetch(`${process.env.URL}/.netlify/functions/verse`);
    const dayObject = await verseRes.json();

    const tokenStore = getStore({ name: 'push-tokens', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
    const { blobs } = await tokenStore.list();

    let sent = 0;
    for (const blob of blobs) {
      const token = blob.key;
      try {
        await admin.messaging().send({
          token,
          notification: {
            title: 'Word of Jesus Daily',
            body: `${dayObject.reference} — ${dayObject.pericope_theme}`,
          },
          webpush: {
            notification: { icon: '/icon-192.png' },
          },
        });
        sent++;
      } catch (e) {
        console.error(`Failed for token ${token}:`, e.message);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ sent, total: blobs.length }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
