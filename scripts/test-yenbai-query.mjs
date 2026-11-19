import postgres from 'postgres';

const DATABASE_URL = 'postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
const sql = postgres(DATABASE_URL, { prepare: false });

async function testQuery() {
  const query = "Spa Yên bái";
  console.log('Query:', query);

  // Exact phrase or token match
  const words = query.trim().split(/\s+/).filter(w => w.length > 1);
  console.log('Words:', words);

  // We want Spas that are strictly located in Yen Bai
  const results = await sql`
    SELECT name, category, phone, city, address, google_rating
    FROM leads
    WHERE 
      (category = 'spa' OR category_label ILIKE '%spa%' OR name ILIKE '%spa%')
      AND (city ILIKE '%Yên Bái%' OR address ILIKE '%Yên Bái%')
      AND address NOT ILIKE '%Hà Nội%'
    ORDER BY google_rating DESC
  `;

  console.log(`Found ${results.length} genuine Yên Bái spas:`);
  for (const r of results) {
    console.log(`- ${r.name} | ${r.phone} | ${r.address}`);
  }
}

testQuery().catch(console.error).finally(() => sql.end());
