const { getStore, connectLambda } = require('@netlify/blobs');
const verses = require('../../data/verses.json');

// TODO: vul in met eigen API-Bible key (https://scripture.api.bible) voor NASB2020-tekst
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_ID = process.env.BIBLE_API_BIBLE_ID;

exports.handler = async function (event) {
  try {
    connectLambda(event); // vereist in Lambda-compatibiliteitsmodus, voor Netlify Blobs

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const cacheStore = getStore('verse-cache');
    const historyStore = getStore('verse-history');

    // 1. Is het vandaag al gecached?
    const cached = await cacheStore.get(today, { type: 'json' });
    if (cached) {
      return { statusCode: 200, body: JSON.stringify(cached) };
    }

    // 2. Kies een nog niet (recent) gebruikt vers
    let history = (await historyStore.get('used-ids', { type: 'json' })) || [];

    let candidates = verses.filter(v => !history.includes(v.id));
    if (candidates.length === 0) {
      history = [];
      candidates = verses;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    // 3. Haal Engelse tekst op (NASB2020 via API.Bible)
    let englishText = null;
    if (BIBLE_API_KEY && BIBLE_API_ID) {
      const res = await fetch(
        `https://api.scripture.api.bible/v1/bibles/${BIBLE_API_ID}/search?query=${encodeURIComponent(chosen.reference)}`,
        { headers: { 'api-key': BIBLE_API_KEY } }
      );
      if (res.ok) {
        const data = await res.json();
        englishText = data?.data?.passages?.[0]?.content || null;
      }
    }

    // 4. Griekse tekst (SBLGNT) — TODO: koppel aan een SBLGNT-databron/eigen dataset
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
      greek_source: 'SBLGNT',
      jesus_seminar_color: chosen.jesus_seminar_color_five_gospels,
      manuscripts_note: chosen.early_manuscript_tradition_general,
      gospel_parallels: chosen.gospel_parallels,
      csntm_link: 'https://collections.csntm.org',
      mounce_link: 'https://www.billmounce.com/dictionary/',
      bible_gateway_link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(chosen.reference)}&version=NASB2020`,
      api_bible_attribution: 'Powered by API.Bible',
      api_bible_link: 'https://api.bible',
    };

    await cacheStore.setJSON(today, dayObject);
    history.push(chosen.id);
    await historyStore.setJSON('used-ids', history);

    return { statusCode: 200, body: JSON.stringify(dayObject) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
