import fs from 'fs';

let raw = fs.readFileSync('scripts/yenbai_response.txt', 'utf-8');
if (raw.startsWith(")]}'")) {
  raw = raw.replace(/^\)\]\}'/, '').trim();
}

const data = JSON.parse(raw);
console.log('data[64] length:', data[64] ? data[64].length : 'null');
if (data[64]) {
  console.log('data[64][0] isArray:', Array.isArray(data[64][0]));
  console.log('data[64][0][1] keys or sample:');
  const p = data[64][0][1];
  console.log('p[11]:', p[11]);
  console.log('p[2]:', p[2]);
  console.log('p[39]:', p[39]);
  console.log('p[178]:', p[178]);
}
