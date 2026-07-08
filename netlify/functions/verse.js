const { getStore } = require('@netlify/blobs');

// TODO: vul in met eigen API-Bible key (https://scripture.api.bible) voor NRSVue-tekst
const BIBLE_API_KEY = process.env.BIBLE_API_KEY;
const BIBLE_API_ID = process.env.BIBLE_API_BIBLE_ID; // NRSVue bible-id van API.Bible

exports.handler = async function (event) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD, NL-tijd afronden indien nodig
    const cacheStore = getStore({ name: 'verse-cache', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
    const historyStore = getStore({ name: 'verse-history', siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });

    // 1. Is het vandaag al gecached?
    const cached = await cacheStore.get(today, { type: 'json' });
    if (cached) {
      return { statusCode: 200, body: JSON.stringify(cached) };
    }

    // 2. Kies een nog niet (recent) gebruikt vers
    const verses = require('../../data/verses.json'); // array van rijen uit de CSV
    let history = (await historyStore.get('used-ids', { type: 'json' })) || [];

    let candidates = verses.filter(v => !history.includes(v.id));
    if (candidates.length === 0) {
      // volledige cyclus gehad, opnieuw beginnen
      history = [];
      candidates = verses;
    }
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    // 3. Haal Engelse tekst op (NRSVue via API.Bible)
    let englishText = null;
    if (BIBLE_API_KEY && BIBLE_API_ID) {
      const passageId = chosen.reference.replace(/\s+/g, '.').replace(':', '.');
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
    const greekText = chosen.greek_text || null; // vul dit veld in data/verses.json of via een aparte lookup

    const dayObject = {
      date: today,
      id: chosen.id,
      gospel: chosen.gospel,
      reference: chosen.reference,
      pericope_theme: chosen.pericope_theme,
      english_text: englishText,
      english_source: 'NRSVue via API.Bible',
      greek_text: greekText,
      greek_source: 'SBLGNT',
      jesus_seminar_color: chosen.jesus_seminar_color_five_gospels,
      manuscripts_note: chosen.early_manuscript_tradition_general,
      gospel_parallels: chosen.gospel_parallels,
      csntm_link: 'https://collections.csntm.org',
      mounce_link: 'https://www.billmounce.com/dictionary/',
      bible_gateway_link: `https://www.biblegateway.com/passage/?search=${encodeURIComponent(chosen.reference)}&version=NRSVUE`,
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
