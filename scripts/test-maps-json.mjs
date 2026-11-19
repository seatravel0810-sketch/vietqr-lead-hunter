async function testGoogleMapsJson() {
  const query = 'Spa Yên Bái';
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=vi&q=${encodeURIComponent(query)}&pb=!1s${encodeURIComponent(query)}!7i20!10m2!1svi!2svn`;
  console.log('Fetching:', url);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9',
      'Referer': 'https://www.google.com/maps/'
    }
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Length:', text.length);
  console.log('Preview:', text.substring(0, 500));
}
testGoogleMapsJson();
