import fs from 'fs';

const raw = fs.readFileSync('scripts/maps_stream.json', 'utf-8');
const data = JSON.parse(raw);

function findStrings(obj, depth = 0, path = '') {
  if (typeof obj === 'string' && obj.length > 2) {
    if (obj.includes('Spa') || obj.includes('Yên Bái') || obj.includes('09') || obj.includes('03') || obj.includes('08')) {
      console.log(`[${path}]: ${obj}`);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, idx) => findStrings(item, depth + 1, `${path}[${idx}]`));
  } else if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(key => findStrings(obj[key], depth + 1, `${path}.${key}`));
  }
}

findStrings(data);
