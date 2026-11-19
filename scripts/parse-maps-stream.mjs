import fs from 'fs';

async function parseMapsStream() {
  const query = 'Spa Yên Bái';
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=vi&q=${encodeURIComponent(query)}&pb=!1s${encodeURIComponent(query)}!7i20!10m2!1svi!2svn`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9',
      'Referer': 'https://www.google.com/maps/'
    }
  });

  let raw = await res.text();
  // Google prefixes with `)]}'\n`
  if (raw.startsWith(")]}'")) {
    raw = raw.replace(/^\)\]\}'/, '').trim();
  }

  fs.writeFileSync('scripts/maps_stream.json', raw);
  console.log('Saved maps_stream.json, length:', raw.length);

  try {
    const data = JSON.parse(raw);
    console.log('Parsed JSON root array length:', data.length);
    // Let's inspect data elements
    for (let i = 0; i < data.length; i++) {
      if (Array.isArray(data[i])) {
        console.log(`Element [${i}] is array of length ${data[i].length}`);
      }
    }
  } catch (e) {
    console.error('JSON parse error:', e.message);
  }
}
parseMapsStream();
