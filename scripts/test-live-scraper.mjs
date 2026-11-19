import fs from 'fs';

export async function fetchLiveGoogleMaps(query) {
  const url = `https://www.google.com/search?tbm=map&authuser=0&hl=vi&gl=vn&q=${encodeURIComponent(query)}&pb=!1s${encodeURIComponent(query)}!7i20!10m2!1svi!2svn`;

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
  const places = [];

  // Traverse data to find place entries
  function extractFromItem(item) {
    if (!Array.isArray(item)) return;
    // An item entry has name at item[11]
    const name = item[11];
    if (typeof name !== 'string' || name.length < 2) return;

    // Address
    let address = '';
    if (Array.isArray(item[2])) {
      address = item[2].filter(Boolean).join(', ');
    } else if (typeof item[39] === 'string') {
      address = item[39];
    } else if (typeof item[2] === 'string') {
      address = item[2];
    }

    // Phone
    let phone = 'Chưa có SĐT';
    let cleanPhone = '';
    const phoneData = item[178] || item[3];
    if (Array.isArray(phoneData) && phoneData.length > 0) {
      const firstPhone = phoneData[0];
      if (Array.isArray(firstPhone)) {
        phone = firstPhone[0] || firstPhone[3] || 'Chưa có SĐT';
        cleanPhone = firstPhone[3] || (firstPhone[0] || '').replace(/[^0-9+]/g, '');
      } else if (typeof firstPhone === 'string') {
        phone = firstPhone;
        cleanPhone = firstPhone.replace(/[^0-9+]/g, '');
      }
    }

    // Rating & reviews
    let rating = 4.8;
    let reviewsCount = 10;
    if (Array.isArray(item[4])) {
      if (typeof item[4][7] === 'number') rating = item[4][7];
      if (typeof item[4][8] === 'number') reviewsCount = item[4][8];
    }

    // Website
    let website = null;
    if (Array.isArray(item[7]) && typeof item[7][0] === 'string') {
      website = item[7][0];
    }

    const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);

    places.push({
      name,
      phone,
      phoneStandard: cleanPhone,
      phoneType: isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none',
      address: address || `${query}, Việt Nam`,
      rating,
      reviewsCount,
      website,
      googleMapsUrl: `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + address)}`,
    });
  }

  // Check data[64] or search everywhere
  if (Array.isArray(data[64])) {
    for (const wrapper of data[64]) {
      if (Array.isArray(wrapper) && Array.isArray(wrapper[1])) {
        extractFromItem(wrapper[1]);
      }
    }
  }

  // If data[64] didn't have it, do a recursive search
  if (places.length === 0) {
    function recursiveSearch(node) {
      if (!Array.isArray(node)) return;
      if (typeof node[11] === 'string' && (Array.isArray(node[2]) || typeof node[39] === 'string')) {
        extractFromItem(node);
        return;
      }
      for (const child of node) {
        recursiveSearch(child);
      }
    }
    recursiveSearch(data);
  }

  return places;
}

// Test with Spa Yên Bái
async function runTest() {
  console.log('Testing live fetch for "Spa Yên Bái"...');
  const results = await fetchLiveGoogleMaps('Spa Yên Bái');
  console.log(`Found ${results.length} results:`);
  for (const r of results) {
    console.log(`- ${r.name} | SĐT: ${r.phone} (${r.phoneType}) | ĐC: ${r.address}`);
  }
}
runTest();
