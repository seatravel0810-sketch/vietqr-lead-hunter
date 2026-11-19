import postgres from 'postgres';
const sql = postgres('postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', { prepare: false });

async function fixCities() {
  console.log('--- CORRECTING MISMATCHED CITIES IN SUPABASE ---');
  
  // 1. If address contains Hà Nội, city MUST be Hà Nội
  const hanoiFix = await sql`
    UPDATE leads 
    SET city = 'Hà Nội'
    WHERE (address ILIKE '%Hà Nội%' OR address ILIKE '%Ha Noi%') AND city != 'Hà Nội'
    RETURNING id, name, city, address
  `;
  console.log(`Updated ${hanoiFix.length} records to Hà Nội:`);
  for (const r of hanoiFix) {
    console.log(`- Fixed: ${r.name} -> City: Hà Nội`);
  }

  // 2. If address contains Hồ Chí Minh / TP.HCM / Sài Gòn, city MUST be TP.HCM
  const hcmFix = await sql`
    UPDATE leads 
    SET city = 'TP.HCM'
    WHERE (address ILIKE '%Hồ Chí Minh%' OR address ILIKE '%TP.HCM%' OR address ILIKE '%TP HCM%' OR address ILIKE '%Sài Gòn%') AND city != 'TP.HCM'
    RETURNING id, name, city, address
  `;
  console.log(`Updated ${hcmFix.length} records to TP.HCM:`);
  for (const r of hcmFix) {
    console.log(`- Fixed: ${r.name} -> City: TP.HCM`);
  }

  // 3. If address contains Đà Nẵng, city MUST be Đà Nẵng
  const danangFix = await sql`
    UPDATE leads 
    SET city = 'Đà Nẵng'
    WHERE (address ILIKE '%Đà Nẵng%' OR address ILIKE '%Da Nang%') AND city != 'Đà Nẵng'
    RETURNING id, name, city, address
  `;
  console.log(`Updated ${danangFix.length} records to Đà Nẵng:`);
  for (const r of danangFix) {
    console.log(`- Fixed: ${r.name} -> City: Đà Nẵng`);
  }

  // 4. If address contains Yên Bái, check if it's really Yên Bái province vs Yên Bái street in Hanoi
  // Note: '50-52 P. Yên Bái 1, Hai Bà Trưng, Hà Nội' -> already fixed to 'Hà Nội' above!

  await sql.end();
}

fixCities();
