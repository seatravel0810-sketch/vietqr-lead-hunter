async function testEndpoint(query, limit = 20) {
  console.log(`\n======================================================`);
  console.log(`TESTING LIVE VERCEL: "${query}" (limit ${limit})`);
  console.log(`======================================================`);
  try {
    const res = await fetch('https://vietqr-lead-hunter.vercel.app/api/crawler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });

    const data = await res.json();
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Success: ${data.success}`);
    if (data.success) {
      console.log(`Source: ${data.source}`);
      console.log(`Total Leads Returned: ${data.leads.length} / ${limit}`);
      console.log(`Top 5 leads:`);
      data.leads.slice(0, 5).forEach((lead, i) => {
        console.log(`  ${i + 1}. [${lead.name}] - ${lead.phone} | ${lead.location}`);
      });

      // Verify Geo-Integrity: Check if any lead belongs to wrong province
      if (query.toLowerCase().includes('yên bái')) {
        const wrongProv = data.leads.filter(l => l.location.includes('Hà Nội') || l.location.includes('Hai Bà Trưng'));
        if (wrongProv.length > 0) {
          console.error(`❌ FAILED GEO-INTEGRITY: Found ${wrongProv.length} Hà Nội leads in Yên Bái search!`);
        } else {
          console.log(`✅ PASSED GEO-INTEGRITY: 100% of ${data.leads.length} leads are genuine Yên Bái businesses!`);
        }
      }

      if (query.toLowerCase().includes('hoàn kiếm')) {
        const wrongProv = data.leads.filter(l => !l.location.includes('Hoàn Kiếm') && !l.name.includes('Hoàn Kiếm'));
        if (wrongProv.length > 0) {
          console.warn(`⚠️ Warning: ${wrongProv.length} leads might not match Hoàn Kiếm.`);
        } else {
          console.log(`✅ PASSED: Exactly ${data.leads.length} leads are in Hoàn Kiếm!`);
        }
      }
    } else {
      console.log(`Response Error: ${data.error}`);
    }
  } catch (err) {
    console.error(`Request failed:`, err.message);
  }
}

async function run() {
  await testEndpoint('Spa Yên bái', 20);
  await testEndpoint('Spa hoàn kiếm', 20);
  await testEndpoint('Hair Salon Đà Nẵng', 20);
  await testEndpoint('Spa Cà Mau', 20);
}

run();
