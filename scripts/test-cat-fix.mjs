import postgres from 'postgres';
const sql = postgres('postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', { prepare: false });

async function testQuery(query) {
  console.log(`\nTesting query: "${query}"`);
  const lowerQuery = query.toLowerCase().trim();
  const CATEGORY_KEYWORDS = [
    'spa', 'thẩm mỹ', 'tham my', 'massage', 'dưỡng sinh', 'duong sinh',
    'nha khoa', 'răng', 'rang', 'dental',
    'cắt tóc', 'hớt tóc', 'tiệm tóc', 'salon', 'tóc', 'toc', 'hair', 'barber', 'nail', 'cắt', 'hớt',
    'pickleball', 'sân', 'san', 'cầu lông', 'cau long', 'tennis',
    'phòng khám', 'phong kham', 'bác sĩ', 'bac si', 'clinic',
    'nhà hàng', 'nha hang', 'quán ăn', 'quan an',
    'khách sạn', 'khach san', 'hotel'
  ];

  let detectedCategory = null;
  for (const catKey of CATEGORY_KEYWORDS) {
    if (lowerQuery.includes(catKey)) {
      if (['spa', 'thẩm mỹ', 'massage', 'dưỡng sinh'].some(k => catKey.includes(k))) detectedCategory = 'spa';
      else if (['nha khoa', 'răng', 'dental'].some(k => catKey.includes(k))) detectedCategory = 'dental';
      else if (['salon', 'tóc', 'hair', 'barber', 'nail', 'cắt', 'hớt'].some(k => catKey.includes(k))) detectedCategory = 'salon';
      else if (['pickleball', 'sân', 'cầu lông', 'tennis'].some(k => catKey.includes(k))) detectedCategory = 'sports';
      else if (['phòng khám', 'bác sĩ', 'clinic'].some(k => catKey.includes(k))) detectedCategory = 'clinic';
      break;
    }
  }

  let locationPart = lowerQuery;
  // Sort category keywords by length descending so multi-word keywords match first
  const sortedCatKeywords = [...CATEGORY_KEYWORDS].sort((a, b) => b.length - a.length);
  for (const catKey of sortedCatKeywords) {
    locationPart = locationPart.replace(new RegExp(catKey, 'gi'), ' ');
  }
  const locationTokens = locationPart.trim().split(/\s+/).filter(w => w.length > 1);

  console.log('Detected category:', detectedCategory);
  console.log('Cleaned location tokens:', locationTokens);

  let whereClauses = [];
  if (detectedCategory) {
    whereClauses.push(sql`(category = ${detectedCategory} OR category_label ILIKE ${'%' + detectedCategory + '%'} OR name ILIKE ${'%' + detectedCategory + '%'})`);
  }
  if (locationTokens.length > 0) {
    for (const tok of locationTokens) {
      whereClauses.push(sql`(address ILIKE ${'%' + tok + '%'} OR city ILIKE ${'%' + tok + '%'} OR name ILIKE ${'%' + tok + '%'})`);
    }
  }

  let finalCondition = whereClauses.reduce((acc, curr) => sql`${acc} AND ${curr}`);
  const results = await sql`
    SELECT name, category, phone, city, address, google_rating
    FROM leads
    WHERE ${finalCondition}
    ORDER BY google_rating DESC
    LIMIT 20
  `;

  console.log(`Results count: ${results.length}`);
  for (const r of results) {
    console.log(`- [${r.name}] | ${r.phone} | ${r.address}`);
  }
}

async function run() {
  await testQuery('cắt tóc xuân mai');
  await sql.end();
}

run();
