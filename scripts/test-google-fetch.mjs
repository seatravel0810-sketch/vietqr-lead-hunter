async function test() {
  const query = 'Spa Hoàn Kiếm';
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=lcl&hl=vi&gl=vn`;
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  console.log('Status:', res.status);
  const html = await res.text();
  console.log('HTML length:', html.length);
  // Check if blocked or contains places
  if (html.includes('detected unusual traffic') || html.includes('captcha')) {
    console.log('Google blocked with captcha/unusual traffic');
  } else {
    console.log('Google returned content successfully!');
  }
}
test();
