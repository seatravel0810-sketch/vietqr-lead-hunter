async function test() {
  const query = 'spa vinh yen';
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'vi,en;q=0.9',
    },
  });
  const text = await res.text();
  const initMatch = text.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\]);/s);
  if (!initMatch) return;
  const data = JSON.parse(initMatch[1]);
  console.log('data keys length:', data.length);
  for (let i = 0; i < data.length; i++) {
    const s = typeof data[i] === 'string' ? data[i] : JSON.stringify(data[i]);
    if (s && (s.toLowerCase().includes('vĩnh yên') || s.toLowerCase().includes('vinh yen'))) {
      console.log(`Index ${i} contains Vinh Yen, length: ${s.length}`);
      // Find places inside index i
      const nameMatches = s.match(/([^\"]*?spa[^\"]*?)/gi);
      if (nameMatches) {
        console.log('Sample Spa matches:', nameMatches.slice(0, 8));
      }
    }
  }
}

test();
