import fs from 'fs';
import postgres from 'postgres';

const envContent = fs.readFileSync('.env.local', 'utf-8');
let dbUrl = '';
for (const line of envContent.split(/\r?\n/)) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.split('=')[1].trim();
  }
}

const sql = postgres(dbUrl, { prepare: false });

async function seedAndTest() {
  const data = JSON.parse(fs.readFileSync('test.json', 'utf-8'));
  console.log(`Seeding ${data.length} leads into Supabase...`);

  for (const item of data) {
    const cleanPhone = (item.phone || '').replace(/[^0-9+]/g, '');
    const isMobile = /^(0|\+84)(9|8|7|3|5)[0-9]{8}$/.test(cleanPhone);
    const placeId = item.demoSlug || item.name;

    await sql`
      INSERT INTO leads (
        place_id, name, category, category_label, phone, phone_standard,
        phone_type, address, city, google_rating, reviews_count,
        google_maps_url, has_website, raw_data, updated_at
      ) VALUES (
        ${placeId}, ${item.name}, 'spa', 'Spa / Thẩm Mỹ', ${item.phone},
        ${cleanPhone}, ${isMobile ? 'mobile' : 'landline'}, ${item.location},
        'Hà Nội', ${String(item.rating)}, 25, ${item.googleMapsUrl},
        false, ${sql.json(item)}, NOW()
      )
      ON CONFLICT (place_id) DO UPDATE SET
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        google_rating = EXCLUDED.google_rating,
        updated_at = NOW();
    `;
  }
  console.log('Seeded successfully!');

  // Now test querying for "Spa hoàn kiếm" with smart token matching!
  const query = "Spa hoàn kiếm";
  console.log('\nTesting smart search for:', query);

  const words = query.trim().split(/\s+/).filter(w => w.length > 1);
  console.log('Search keywords:', words);

  // Build query where every word must match somewhere in name, address, category, city
  const conditions = words.map(w => {
    const pattern = `%${w}%`;
    return sql`(name ILIKE ${pattern} OR address ILIKE ${pattern} OR category ILIKE ${pattern} OR category_label ILIKE ${pattern} OR city ILIKE ${pattern})`;
  });

  const fullCondition = conditions.reduce((acc, curr) => sql`${acc} AND ${curr}`);
  const results = await sql`SELECT * FROM leads WHERE ${fullCondition} LIMIT 10`;

  console.log(`\nFound ${results.length} matches with smart search:`);
  for (const r of results) {
    console.log(`- ${r.name} | ${r.phone} | ${r.address}`);
  }
}

seedAndTest().catch(console.error).finally(async () => {
  await sql.end();
  process.exit(0);
});
