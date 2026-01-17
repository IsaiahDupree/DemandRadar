const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../docs/screenshots/hookd');

// Screenshots captured from MCP Puppeteer (base64 data will be passed as args)
const screenshots = {
  '04-clone-ads': process.argv[2],
  '05-video-scripts': process.argv[3],
  '06-brand-assets': process.argv[4],
  '07-image-templates': process.argv[5],
  '08-funnel-templates': process.argv[6],
  '09-creative-analyzer': process.argv[7],
  '09b-dashboard': process.argv[8],
};

Object.entries(screenshots).forEach(([name, b64]) => {
  if (b64) {
    const data = b64.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(path.join(DIR, `${name}.png`), Buffer.from(data, 'base64'));
    console.log(`Saved: ${name}.png`);
  }
});
