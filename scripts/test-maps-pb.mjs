async function testWithPb(query) {
  // pb parameter from Google Maps search for 20 items
  const pb = `!1s${encodeURIComponent(query)}!7i20!10b1!12m60!1m5!18b1!30b1!31m1!1b1!34e1!2m4!5m1!6e2!20e3!39b1!6m31!32i1!49b1!63m0!66b1!85b1!114b1!149b1!206b1!209b1!212b1!215b1!216b1!222b1!223b1!234b1!235b1!239b1!246b1!253b1!260b1!262b1!266b1!270b1!271b1!273b1!281b1!294b1!300b1!301b1!302i300!303i100!10b1!12b1!13b1!14b1!16b1!17m1!3e1!20m3!5e2!6b1!14b1!46m1!1b0!96b1!97m1!2b1!99b1!19m4!2m3!1i360!2i120!4i8!20m57!2m2!1i203!2i100!3m2!2i4!5b1!6m6!1m2!1i86!2i86!1m2!1i408!2i240!7m33!1m3!1e1!2b0!3e3!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e10!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e4!1m3!1e9!2b1!3e2!2b1!9b0!15m8!1m7!1m2!1m1!1e2!2m2!1i195!2i195!3i20`;
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=vi&gl=vn&q=${encodeURIComponent(query)}&pb=${pb}`;

  console.log('Fetching Google Maps Search URL...');
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'vi-VN,vi;q=0.9',
      'Referer': 'https://www.google.com/maps/'
    }
  });

  let raw = await res.text();
  if (raw.startsWith(")]}'")) {
    raw = raw.replace(/^\)\]\}'/, '').trim();
  }

  const data = JSON.parse(raw);
  console.log('Got response! data[64] length:', data[64] ? data[64].length : 'not found');

  if (data[64] && Array.isArray(data[64])) {
    const places = [];
    for (const wrapper of data[64]) {
      const p = wrapper[1];
      if (!p || typeof p[11] !== 'string') continue;
      const name = p[11];
      const address = p[39] || (Array.isArray(p[2]) ? p[2].join(', ') : '');
      let phone = 'Chưa có SĐT';
      if (Array.isArray(p[178]) && p[178][0]) {
        phone = p[178][0][3] || p[178][0][0] || 'Chưa có SĐT';
      }
      places.push({ name, phone, address });
    }
    console.log(`Successfully extracted ${places.length} places!`);
    places.slice(0, 10).forEach((pl, i) => {
      console.log(`  [${i+1}] ${pl.name} | SĐT: ${pl.phone} | ĐC: ${pl.address}`);
    });
  }
}

testWithPb('Spa Yên Bái');
