async function test() {
  const query = 'spa vinh yen';
  // Google Local Search (tbm=lcl or standard search with local pack)
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=vi&gl=vn`;
  console.log('Fetching Google Search:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'vi-VN,vi;q=0.9',
    },
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response length:', text.length);

  // Look for phone numbers
  const phones = text.match(/(?:0|\+84)(?:[0-9]{8,10})/g) || [];
  console.log('Phones in search:', [...new Set(phones)]);

  // Look for business titles
  const titles = text.match(/<div role="heading"[^>]*>(.*?)<\/div>/g) || [];
  console.log('Headings found:', titles.length);
  for (const t of titles.slice(0, 5)) {
    console.log('Heading:', t.replace(/<[^>]+>/g, ''));
  }
}

test();
