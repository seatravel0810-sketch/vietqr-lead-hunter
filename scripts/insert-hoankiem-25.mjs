import fs from 'fs';
import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DATABASE_URL, { prepare: false });

async function insertHoanKiem() {
  const data = JSON.parse(fs.readFileSync('hoankiem_25.json', 'utf-8'));
  console.log(`Inserting ${data.length} Hoan Kiem spas into Supabase...`);

  for (const item of data) {
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
        'Hà Nội', ${String(item.rating || '4.8')}, 35, ${item.googleMapsUrl},
        ${item.website || null}, ${Boolean(item.website)}, ${sql.json(item)}, NOW()
      )
      ON CONFLICT (place_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        phone_type = EXCLUDED.phone_type,
        address = EXCLUDED.address,
        google_rating = EXCLUDED.google_rating,
        updated_at = NOW();
    `;
  }

  const count = await sql`
    SELECT COUNT(*) FROM leads 
    WHERE (address ILIKE '%Hoàn Kiếm%' OR name ILIKE '%Hoàn Kiếm%')
  `;
  console.log('Total Hoàn Kiếm spas now in Supabase:', count[0].count);
}

insertHoanKiem().catch(console.error).finally(async () => {
  await sql.end();
  process.exit(0);
});
