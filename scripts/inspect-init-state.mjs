import fs from 'fs';

async function inspectInitState() {
  const query = 'Spa Hoàn Kiếm';
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=vi`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9',
    }
  });
  const text = await res.text();
  fs.writeFileSync('scripts/maps_page.html', text);
  console.log('Saved maps_page.html, size:', text.length);

  // Search for the data array
  // In Google Maps, search results are in `window.APP_INITIALIZATION_STATE` or `window.WIZ_global_data` or `_pageData`
  // Also look for regex matches for place names like "Hàng Bông", "Orient Spa", "Spas Hanoi"
  const hasOrient = text.includes('Orient Spa') || text.includes('Spas Hanoi');
  console.log('Contains known spa names?', hasOrient);

  // Let's search for all occurrences of phone numbers in the HTML
  const phones = [...new Set(text.match(/((\+84|0)(9|8|7|3|5|2\d)\d{7,8})/g) || [])];
  console.log('Phones found in maps HTML:', phones);

  // Look for JSON structures inside script tags
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  while ((match = scriptRegex.exec(text)) !== null) {
    scriptCount++;
    const content = match[1];
    if (content.includes('APP_INITIALIZATION_STATE') || content.includes('cacheResponse') || content.includes('/maps/place/')) {
      console.log(`Script #${scriptCount} matches key markers, length: ${content.length}`);
    }
  }
}
inspectInitState();
