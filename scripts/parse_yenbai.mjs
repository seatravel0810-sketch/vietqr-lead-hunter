import fs from 'fs';

let raw = fs.readFileSync('scripts/yenbai_response.txt', 'utf-8');
if (raw.startsWith(")]}'")) {
  raw = raw.replace(/^\)\]\}'/, '').trim();
}

const data = JSON.parse(raw);
console.log('Root length:', data.length);

// In Google Maps Search response, data[0][1] contains the list of places!
const places = data[0][1];
console.log('Places count in data[0][1]:', places ? places.length : 0);

if (places) {
  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    if (!p || !p[14]) continue;
    // p[14] usually holds place metadata!
    const details = p[14];
    const name = details[11];
    const rating = details[4] ? details[4][7] : null;
    const reviews = details[4] ? details[4][8] : null;
    const address = details[2] || details[39];
    const phone = details[178] || details[3];
    console.log(`[#${i + 1}] Name: ${name} | Rating: ${rating} (${reviews}) | Addr: ${address}`);
  }
}
