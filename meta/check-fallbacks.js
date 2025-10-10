const fs = require('fs');

// Check both Windows and Bath ads
const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));

let withLocalImage = 0;
let withoutLocalImage = 0;

console.log('Windows ads with local image fallbacks:\n');

windowsAds.forEach(ad => {
    if (ad.localImage) {
        withLocalImage++;
        console.log(`✓ ${ad.adName} -> ${ad.localImage}`);
    } else {
        withoutLocalImage++;
    }
});

console.log(`\nSummary:`);
console.log(`- Total Windows ads: ${windowsAds.length}`);
console.log(`- Ads with local fallback images: ${withLocalImage}`);
console.log(`- Ads without local fallback: ${withoutLocalImage}`);

// Check which local images are available
const imageFiles = fs.readdirSync('images').filter(f =>
    f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
);

console.log(`\nTotal local images available: ${imageFiles.length}`);