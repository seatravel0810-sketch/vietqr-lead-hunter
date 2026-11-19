async function verifyLive() {
  console.log('--- TESTING LIVE VERCEL FOR: "cắt tóc xuân mai" ---');
  const res = await fetch('https://vietqr-lead-hunter.vercel.app/api/crawler', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'cắt tóc xuân mai', limit: 20 })
  });

  const data = await res.json();
  console.log('HTTP Status:', res.status);
  console.log('Success:', data.success);
  console.log('Leads count:', data.leads?.length);
  if (data.leads && data.leads.length > 0) {
    console.log('\nDanh sách tiệm cắt tóc Xuân Mai thực tế:');
    data.leads.forEach((l, i) => {
      console.log(`${i + 1}. [${l.name}] | SĐT: ${l.phone} | ĐC: ${l.location} | Rating: ${l.rating} ⭐`);
    });
  } else {
    console.log('Response Error:', data.error);
  }
}

verifyLive();
