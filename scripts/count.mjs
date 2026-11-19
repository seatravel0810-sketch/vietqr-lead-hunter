import postgres from 'postgres';
const sql = postgres('postgresql://postgres.ugsirgcornvyoamvzuyy:VqHunter2026%21DbSecret@aws-1-ap-south-1.pooler.supabase.com:6543/postgres', { prepare: false });
const total = await sql`SELECT count(*) FROM leads`;
console.log('TOTAL LEADS:', total[0].count);
const stats = await sql`SELECT category, city, count(*) as count FROM leads GROUP BY category, city ORDER BY count DESC`;
console.table(stats);
await sql.end();
