const fs = require('fs');
const content = fs.readFileSync('/Users/darshan/.gemini/antigravity/brain/73d60589-b48d-4361-82ea-98496de90760/.system_generated/steps/6456/content.md', 'utf8');

const regex = /<td class="[^"]*comment-body[^"]*"[^>]*>([\s\S]*?)<\/td>/g;
let match;
let count = 0;
while ((match = regex.exec(content)) !== null) {
  count++;
  console.log(`--- Comment #${count} ---`);
  // strip HTML tags
  let text = match[1].replace(/<[^>]*>/g, '').trim();
  console.log(text);
}
if (count === 0) {
  console.log('No comments found via regex.');
}
