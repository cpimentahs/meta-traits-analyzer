const fs = require('fs');
const path = require('path');

// Parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    // Find header row
    let headerIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Category')) {
            headerIndex = i;
            break;
        }
    }

    const headers = parseCSVLine(lines[headerIndex]);
    const data = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
        });

        if (row['Ad Name'] && row['Ad Name'].trim()) {
            data.push(row);
        }
    }
    return data;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const windowsAds = parseCSV('traits-windows-ads.csv');
const bathAds = parseCSV('traits-bath-ads.csv');
const allAds = [...windowsAds, ...bathAds];

const imagesDir = path.join(__dirname, 'images');
const missingAds = [];

console.log(`📊 Checking ${allAds.length} ads for missing images\n`);

allAds.forEach((ad, i) => {
    const adId = ad.ad_id;
    const adName = ad['Ad Name'];

    if (!adId) {
        console.log(`❌ ${adName} - No ad_id in CSV`);
        missingAds.push({ ad_id: 'N/A', ad_name: adName, reason: 'No ad_id in CSV' });
        return;
    }

    // Check both .png and .jpg
    const pngPath = path.join(imagesDir, `${adId}.png`);
    const jpgPath = path.join(imagesDir, `${adId}.jpg`);

    if (!fs.existsSync(pngPath) && !fs.existsSync(jpgPath)) {
        console.log(`❌ ${adName} (ID: ${adId}) - Image not found`);
        missingAds.push({
            ad_id: adId,
            ad_name: adName,
            url: ad.creative_url || '',
            reason: 'Image file not found'
        });
    }
});

console.log(`\n📊 Summary:`);
console.log(`Total ads: ${allAds.length}`);
console.log(`Missing images: ${missingAds.length}`);

if (missingAds.length > 0) {
    let csv = 'ad_id,ad_name,url,reason\n';
    missingAds.forEach(item => {
        csv += `"${item.ad_id}","${item.ad_name}","${item.url}","${item.reason}"\n`;
    });
    fs.writeFileSync('failed-downloads.csv', csv);
    console.log(`\n✅ Updated failed-downloads.csv with ${missingAds.length} missing ads`);
} else {
    console.log(`\n🎉 All images are present!`);
}
