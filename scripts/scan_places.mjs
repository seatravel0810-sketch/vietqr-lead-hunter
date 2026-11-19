import fs from 'fs';

let raw = fs.readFileSync('scripts/yenbai_response.txt', 'utf-8');
if (raw.startsWith(")]}'")) {
  raw = raw.replace(/^\)\]\}'/, '').trim();
}

const data = JSON.parse(raw);

// Find all objects or arrays that contain names of Spas or Yen Bai
function scanForPlaces(node, path = '') {
  if (Array.isArray(node)) {
    // Check if this array looks like a place entry
    // A place entry in Google Maps usually has a name, coords, and category/address
    if (typeof node[11] === 'string' && (node[11].includes('Spa') || node[11].includes('Viện') || node[11].includes('Massage'))) {
      console.log(`Found place at ${path}:`);
      console.log(`  Name: ${node[11]}`);
      console.log(`  Rating/Reviews:`, node[4]);
      console.log(`  Address:`, node[2] || node[39]);
      console.log(`  Phone:`, node[178] || node[3]);
      console.log(`  Maps URL:`, node[27]);
    }
    for (let i = 0; i < node.length; i++) {
      scanForPlaces(node[i], `${path}[${i}]`);
    }
  } else if (typeof node === 'object' && node !== null) {
    for (const key of Object.keys(node)) {
      scanForPlaces(node[key], `${path}.${key}`);
    }
  }
}

scanForPlaces(data);
