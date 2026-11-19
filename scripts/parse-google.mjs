import fs from 'fs';

async function parseGoogleLocal() {
  const query = 'Spa Hoàn Kiếm';
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=lcl&hl=vi&gl=vn`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
    }
  });
  const html = await res.text();
  fs.writeFileSync('scripts/debug_google.html', html);

  // Let's search for place names, ratings, phones, addresses in the HTML
  console.log('Saved debug_google.html');

  // Search for business titles or aria-labels
  const titleMatches = [...html.matchAll(/role="heading"[^>]*>([^<]+)<\/div>/g)];
  console.log('Title matches with role=heading:', titleMatches.map(m => m[1]).slice(0, 10));

  // Search for phone numbers (09..., 024..., 08...)
  const phones = [...new Set(html.match(/(0\d{2,3}[\s.-]?\d{3}[\s.-]?\d{3,4})/g) || [])];
  console.log('Found phones:', phones.slice(0, 10));
}
parseGoogleLocal();
