import postgres from 'postgres';
const sql = postgres('postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', { prepare: false });

async function check() {
  const mismatched = await sql`
    SELECT id, name, city, address 
    FROM leads 
    WHERE (address ILIKE '%Hà Nội%' OR address ILIKE '%Ha Noi%') AND city NOT ILIKE '%Hà Nội%'
  `;
  console.log('Mismatched count:', mismatched.length);
  for (const m of mismatched) {
    console.log(`- ID: ${m.id} | City in DB: [${m.city}] | Name: ${m.name} | Address: ${m.address}`);
  }

  // Also check if any Yen Bai records have wrong city
  const yenbaiMis = await sql`
    SELECT id, name, city, address
    FROM leads
    WHERE address ILIKE '%Yên Bái%' AND city NOT ILIKE '%Yên Bái%'
  `;
  console.log('\nYen Bai in address but not in city:', yenbaiMis.length);
  for (const m of yenbaiMis) {
    console.log(`- ID: ${m.id} | City in DB: [${m.city}] | Name: ${m.name} | Address: ${m.address}`);
  }

  await sql.end();
}

check();
