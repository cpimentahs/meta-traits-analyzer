const fs = require('fs');

// Check both Windows and Bath ads
const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));
const bathAds = JSON.parse(fs.readFileSync('bath-ads-data.json', 'utf8'));

const missingMedia = [];

// Check Windows ads
windowsAds.forEach(ad => {
    if (!ad.url || ad.url.trim() === '') {
        missingMedia.push({
            dataset: 'Windows',
            adName: ad.adName,
            concept: ad.concept,
            spend: ad.spend,
            roas: ad.roas,
            bar: ad.bar
        });
    }
});

// Check Bath ads
bathAds.forEach(ad => {
    if (!ad.url || ad.url.trim() === '') {
        missingMedia.push({
            dataset: 'Bath',
            adName: ad.adName,
            concept: ad.concept,
            spend: ad.spend,
            roas: ad.roas,
            bar: ad.bar
        });
    }
});

if (missingMedia.length === 0) {
    console.log('✅ All ads have media URLs!');
} else {
    // Create CSV output
    const csvLines = ['Dataset,Ad Name,Concept,Spend,ROAS,BAR'];

    missingMedia.forEach(ad => {
        csvLines.push(`${ad.dataset},"${ad.adName}","${ad.concept}",${ad.spend},${ad.roas},${ad.bar}`);
    });

    const csvContent = csvLines.join('\n');

    // Write to file
    fs.writeFileSync('Ads Missing Media.csv', csvContent);

    console.log(`⚠️ Found ${missingMedia.length} ads without media URLs`);
    console.log('✅ Created "Ads Missing Media.csv" with details');
}

// Also report stats
const totalAds = windowsAds.length + bathAds.length;
const adsWithMedia = totalAds - missingMedia.length;
console.log(`\nStats:`);
console.log(`- Total ads: ${totalAds}`);
console.log(`- Windows ads: ${windowsAds.length}`);
console.log(`- Bath ads: ${bathAds.length}`);
console.log(`- Ads with media: ${adsWithMedia} (${((adsWithMedia/totalAds)*100).toFixed(1)}%)`);
console.log(`- Ads missing media: ${missingMedia.length} (${((missingMedia.length/totalAds)*100).toFixed(1)}%)`);