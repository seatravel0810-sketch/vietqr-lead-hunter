async function testDDG() {
  const query = 'spa vinh yen sdt';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  console.log('Fetching DDG:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  console.log('DDG Status:', res.status);
  const text = await res.text();
  console.log('DDG Length:', text.length);

  // Extract result snippets
  const results = [];
  const regex = /<a class="result__snippet[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({ url: match[1], snippet: match[2].replace(/<[^>]+>/g, '') });
  }
  console.log('DDG Snippets count:', results.length);
  for (const r of results.slice(0, 5)) {
    console.log('Snippet:', r.snippet);
  }
}

testDDG();
