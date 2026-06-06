const fs = require('fs');
const content = fs.readFileSync('/Users/darshan/.gemini/antigravity/brain/73d60589-b48d-4361-82ea-98496de90760/.system_generated/steps/6456/content.md', 'utf8');

const regex = /https:\/\/github\.com\/user-attachments\/assets\/[a-f0-9-]+/g;
const matches = content.match(regex);
if (matches) {
  const unique = Array.from(new Set(matches));
  console.log(`Found ${unique.length} unique images:`);
  unique.forEach((img, idx) => console.log(`${idx + 1}: ${img}`));
} else {
  console.log('No image URLs found.');
}
