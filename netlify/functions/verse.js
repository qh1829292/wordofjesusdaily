const { getStore, connectLambda } = require('@netlify/blobs');
const verses = require('../../data/verses.json');

const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_ID = process.env.BIBLE_API_BIBLE_ID;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    connectLambda(event);

    const today = new Date().toISOString().split('T')[0];

    const cacheStore = getStore('verse-cache');
    const historyStore = getStore('verse-history');

    const cached = await cacheStore.get(today, { type: 'json' });
    if (cached) {
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(cached) };
    }

    let history = (await historyStore.get('used-ids', { type: 'json' })) || [];

    let candidates = verses.filter(v => !history.includes(v.id));
    if (candidates.length === 0) {
      history = [];
      candidates = verses;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    let englishText = null;
    let fumsToken = null;

    if (BIBLE_API_KEY && BIBLE_API_ID) {
      const res = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${BIBLE_API_ID}/search?query=${encodeURIComponent(chosen.reference)}&fums-version=3`,
        { headers: { 'api-key': BIBLE_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        englishText = data?.data?.passages?.[0]?.content || null;
        fumsToken = data?.meta?.fumsToken || null;
      }
    }

    const greekText = chosen.greek_text || null;

    const dayObject = {
      date: today,
      id: chosen.id,
      gospel: chosen.gospel,
      reference: chosen.reference,
      pericope_theme: chosen.pericope_theme,
      english_text: englishText,
      english_source: 'NASB2020 © Lockman Foundation. Used by permission. All rights reserved. Website: https://www.lockman.org',
      greek_text: greekText,
      greek_source: 'SBLGNT © 2010 Society of Biblical Literature and Logos Bible Software. Used under CC BY 4.0.',
      jesus_seminar_color: chosen.jesus_seminar_color_five_gospels,
      manuscripts_note: chosen.early_manuscript_tradition_general,
      gospel_parallels: chosen.gospel_parallels,
      csntm_link: 'https://collections.csntm.org',
      mounce_link: 'https://www.billmounce.com/dictionary/',
      bible_gateway_link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(chosen.reference)}&version=NASB2020`,
      sblgnt_link: 'https://sblgnt.com',
      api_bible_attribution: 'Powered by API.Bible',
      api_bible_link: 'https://api.bible',
      fums_token: fumsToken,
    };

    await cacheStore.setJSON(today, dayObject);
    history.push(chosen.id);
    await historyStore.setJSON('used-ids', history);

    return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(dayObject) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
