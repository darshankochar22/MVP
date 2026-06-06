const fs = require('fs');
const path = require('path');
const https = require('https');

const content = fs.readFileSync('/Users/darshan/.gemini/antigravity/brain/73d60589-b48d-4361-82ea-98496de90760/.system_generated/steps/6456/content.md', 'utf8');
const regex = /https:\/\/github\.com\/user-attachments\/assets\/[a-f0-9-]+/g;
const matches = content.match(regex);
if (!matches) {
  console.log('No image URLs found.');
  process.exit(1);
}

const uniqueUrls = Array.from(new Set(matches));
const destDir = '/Users/darshan/Startup/client/src/assets/issues_img_27';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function download(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filename);
    https.get(url, (response) => {
      // follow redirects if any
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', (err) => {
          fs.unlink(filename, () => reject(err));
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', (err) => {
      fs.unlink(filename, () => reject(err));
    });
  });
}

async function run() {
  console.log(`Starting download of ${uniqueUrls.length} images...`);
  for (let i = 0; i < uniqueUrls.length; i++) {
    const url = uniqueUrls[i];
    const destPath = path.join(destDir, `image${i + 1}.png`);
    console.log(`Downloading ${url} -> image${i + 1}.png ...`);
    try {
      await download(url, destPath);
      console.log(`✓ Saved image${i + 1}.png`);
    } catch (err) {
      console.error(`❌ Failed to download image${i + 1}.png: ${err.message}`);
    }
  }
  console.log('Finished downloads.');
}

run();
