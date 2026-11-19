async function testExport() {
  console.log('Testing /api/leads/export on Live Vercel...');
  try {
    const res = await fetch('https://vietqr-lead-hunter.vercel.app/api/leads/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        leadItems: [
          {
            name: "LEMONT YÊN BÁI Hotel & Spa",
            category: "spa",
            phone: "+84919955749",
            location: "130 Hoàng Văn Thụ, Yên Bái",
            rating: 5,
            website: ""
          }
        ],
        format: "xlsx"
      })
    });
    console.log('Export Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const blob = await res.arrayBuffer();
    console.log('Exported file size (bytes):', blob.byteLength);
    if (res.status === 200 && blob.byteLength > 1000) {
      console.log('✅ Export Excel works perfectly!');
    } else {
      console.error('❌ Export Excel returned unexpected status/size');
    }
  } catch (e) {
    console.error('Export test failed:', e);
  }
}
testExport();
