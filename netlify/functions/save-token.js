const { getStore, connectLambda } = require('@netlify/blobs');

exports.handler = async function (event) {
  connectLambda(event); // vereist in Lambda-compatibiliteitsmodus, voor Netlify Blobs

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { token } = JSON.parse(event.body);
    if (!token) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No token provided' }) };
    }

    const store = getStore('push-tokens');
    await store.setJSON(token, { registered_at: new Date().toISOString() });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
