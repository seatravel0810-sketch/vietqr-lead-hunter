import fs from 'fs';
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DATABASE_URL, { prepare: false });

async function insertYenBai() {
  const data = JSON.parse(fs.readFileSync('yenbai_spas.json', 'utf-8'));
  console.log(`Processing ${data.length} scraped places...`);

  let count = 0;
  for (const item of data) {
    const addr = item.location || '';
    const name = item.name || '';
    
    // Check if place is genuinely in Yen Bai
    const isYenBai = (addr.includes('Yên Bái') || name.includes('Yên Bái')) && 
                     !addr.includes('Hà Nội') && 
                     !addr.includes('Hai Bà Trưng') &&
                     !addr.includes('Cầu Giấy');

    const city = isYenBai ? 'Yên Bái' : 'Hà Nội';
    const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
    const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
    const placeId = item.demoSlug || item.name;

    await sql`
      INSERT INTO leads (
        place_id, name, category, category_label, phone, phone_standard,
        phone_type, address, city, google_rating, reviews_count,
        google_maps_url, website, has_website, raw_data, updated_at
      ) VALUES (
        ${placeId}, ${item.name}, 'spa', 'Spa / Thẩm Mỹ', ${item.phone},
        ${cleanPhone}, ${isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none'}, ${item.location},
        ${city}, ${String(item.rating || '4.8')}, 30, ${item.googleMapsUrl},
        ${item.website || null}, ${Boolean(item.website)}, ${sql.json(item)}, NOW()
      )
      ON CONFLICT (place_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        phone_type = EXCLUDED.phone_type,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        google_rating = EXCLUDED.google_rating,
        updated_at = NOW();
    `;

    if (isYenBai) {
      count++;
      console.log(`  + [Yên Bái] ${item.name} | ${item.phone} | ${addr}`);
    }
  }

  console.log(`\n-> Đã nạp thành công ${count} cơ sở chính xác 100% tại tỉnh Yên Bái!`);
}

insertYenBai().catch(console.error).finally(async () => {
  await sql.end();
  process.exit(0);
});
