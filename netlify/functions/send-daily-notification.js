const { getStore, connectLambda } = require('@netlify/blobs');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  });
}

exports.handler = async function (event) {
  connectLambda(event); // vereist in Lambda-compatibiliteitsmodus, voor Netlify Blobs

  try {
    // Haal vandaag's vers op via dezelfde functie als de site gebruikt,
    // zodat notificatie en pagina altijd exact hetzelfde vers tonen.
    const verseRes = await fetch(`${process.env.URL}/.netlify/functions/verse`);
    if (!verseRes.ok) {
      throw new Error(`verse function returned ${verseRes.status}`);
    }
    const dayObject = await verseRes.json();

    const tokenStore = getStore('push-tokens');
    const { blobs } = await tokenStore.list();

    let sent = 0;
    let failed = 0;

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
        failed++;
        // Token is waarschijnlijk verlopen of ingetrokken; opruimen.
        if (e.code === 'messaging/registration-token-not-registered') {
          await tokenStore.delete(token);
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sent, failed, total: blobs.length, verse: dayObject.reference }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
