import fs from 'fs';

const html = fs.readFileSync('scripts/debug_google.html', 'utf-8');
console.log('HTML length:', html.length);

// In Google desktop search, local pack cards have class "VkpGBb" or "rllt__details" or "OSrXXb"
const vkpMatches = html.match(/class="[^"]*VkpGBb[^"]*"/g);
console.log('VkpGBb matches:', vkpMatches ? vkpMatches.length : 0);

const rlltMatches = html.match(/class="[^"]*rllt__details[^"]*"/g);
console.log('rllt__details matches:', rlltMatches ? rlltMatches.length : 0);

const osrMatches = html.match(/class="[^"]*OSrXXb[^"]*"/g);
console.log('OSrXXb matches:', osrMatches ? osrMatches.length : 0);

// Search for text near "Hàng Bông" or "Spa" in the HTML
const lines = html.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Hàng Bông') || lines[i].includes('Phùng Hưng') || lines[i].includes('Orient')) {
    console.log(`Line ${i}:`, lines[i].substring(0, 300));
  }
}
