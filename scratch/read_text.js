const fs = require('fs');
const content = fs.readFileSync('/Users/darshan/.gemini/antigravity/brain/73d60589-b48d-4361-82ea-98496de90760/.system_generated/steps/6456/content.md', 'utf8');

const { JSDOM } = require('jsdom');
const dom = new JSDOM(content);
const doc = dom.window.document;

// Find issue body and comments
const commentBodies = doc.querySelectorAll('.comment-body');
console.log(`Found ${commentBodies.length} comment/issue bodies:`);
commentBodies.forEach((body, idx) => {
  console.log(`--- Comment #${idx + 1} ---`);
  console.log(body.textContent.trim());
});
