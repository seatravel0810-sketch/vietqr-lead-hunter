async function testGoogleMapsPreview() {
  const query = 'Spa Hoàn Kiếm';
  const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=vi`;
  console.log('Testing URL:', url);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'vi-VN,vi;q=0.9',
      }
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Length:', text.length);
    // Google Maps embeds the initial data inside `window.APP_INITIALIZATION_STATE`!
    const initMatch = text.match(/window\.APP_INITIALIZATION_STATE\s*=\s*(\[.*?\]);/s);
    if (initMatch) {
      console.log('Found APP_INITIALIZATION_STATE!');
    } else {
      console.log('No APP_INITIALIZATION_STATE, searching for other window data...');
      const matches = text.match(/window\._[A-Za-z0-9_]+/g);
      console.log('Matches:', matches);
    }
  } catch (e) {
    console.error('Error:', e);
  }
}
testGoogleMapsPreview();
