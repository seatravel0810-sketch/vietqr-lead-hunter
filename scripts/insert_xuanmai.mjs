import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = 'postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DATABASE_URL, { prepare: false });

async function insertXuanMai() {
  const jsonPath = path.resolve(__dirname, 'xuanmai_chuongmy.json');
  const rawData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Filter only genuine Xuan Mai salons
  const xuanmaiOnly = rawData.filter(item => {
    const loc = (item.location || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const isDongDa = loc.includes('hồ đắc di') || loc.includes('trần hữu tước') || loc.includes('đống đa');
    const isXuanMai = loc.includes('xuân mai') || loc.includes('chương mỹ') || name.includes('xuân mai');
    return isXuanMai && !isDongDa;
  });

  console.log(`Found ${xuanmaiOnly.length} authentic Xuân Mai salons:`);

  for (const item of xuanmaiOnly) {
    const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
    const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
    const placeId = item.googleMapsUrl || `xuanmai-${Date.now()}-${Math.random()}`;

    await sql`
      INSERT INTO leads (
        place_id, name, category, category_label, phone, phone_standard, phone_type,
        address, city, google_rating, reviews_count, google_maps_url, website, has_website, raw_data
      ) VALUES (
        ${placeId},
        ${item.name},
        'salon',
        'Hair Salon & Cắt tóc',
        ${item.phone || 'Chưa có SĐT'},
        ${cleanPhone},
        ${isMobile ? 'mobile' : cleanPhone ? 'landline' : 'none'},
        ${item.location},
        'Xuân Mai, Chương Mỹ',
        ${String(item.rating || '5.0')},
        15,
        ${item.googleMapsUrl},
        null,
        false,
        ${JSON.stringify(item)}
      )
      ON CONFLICT (place_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = 'Xuân Mai, Chương Mỹ',
        google_rating = EXCLUDED.google_rating
    `;
    console.log(`- Inserted: [${item.name}] | SĐT: ${item.phone} | ĐC: ${item.location}`);
  }

  console.log('\n--- VERIFYING SEARCH IN DB FOR: "cắt tóc xuân mai" ---');
  const testRes = await sql`
    SELECT name, phone, address, city, google_rating 
    FROM leads
    WHERE (address ILIKE '%xuân mai%' OR city ILIKE '%xuân mai%' OR name ILIKE '%xuân mai%')
      AND (category = 'salon' OR category_label ILIKE '%tóc%' OR name ILIKE '%tóc%' OR name ILIKE '%hair%' OR name ILIKE '%barber%')
    ORDER BY google_rating DESC
  `;
  console.log(`Matching records count: ${testRes.length}`);
  for (const r of testRes) {
    console.log(`* [${r.name}] - ${r.phone} - ${r.address}`);
  }

  await sql.end();
}

insertXuanMai();
