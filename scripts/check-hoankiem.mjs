import postgres from 'postgres';
const sql = postgres('postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', { prepare: false });

async function checkHoanKiem() {
  const res = await sql`
    SELECT name, address, phone, google_rating
    FROM leads
    WHERE (address ILIKE '%Hoàn Kiếm%' OR name ILIKE '%Hoàn Kiếm%')
      AND (category = 'spa' OR category_label ILIKE '%spa%' OR name ILIKE '%spa%')
    ORDER BY google_rating DESC
  `;
  console.log(`Hoàn Kiếm Spas count: ${res.length}`);
  for (const r of res.slice(0, 10)) {
    console.log(`- ${r.name} | ${r.phone} | ${r.address}`);
  }
  await sql.end();
}

checkHoanKiem();
