const fs = require('fs');
const https = require('https');
const http = require('http');

// Check both Windows and Bath ads
const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));
const bathAds = JSON.parse(fs.readFileSync('bath-ads-data.json', 'utf8'));

const brokenMedia = [];
let checked = 0;
let total = 0;

function checkUrl(url, adInfo) {
    return new Promise((resolve) => {
        if (!url || url.trim() === '') {
            resolve({ ...adInfo, status: 'Empty URL', working: false });
            return;
        }

        const protocol = url.startsWith('https') ? https : http;

        // Just do a HEAD request to check if the URL is accessible
        const urlObj = new URL(url);
        const options = {
            method: 'HEAD',
            host: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            timeout: 5000
        };

        const req = protocol.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 400) {
                resolve({ ...adInfo, status: `OK (${res.statusCode})`, working: true });
            } else {
                resolve({ ...adInfo, status: `Error ${res.statusCode}`, working: false });
            }
        });

        req.on('error', (err) => {
            resolve({ ...adInfo, status: `Network Error: ${err.message.substring(0, 50)}`, working: false });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ ...adInfo, status: 'Timeout', working: false });
        });

        req.end();
    });
}

async function checkAllAds() {
    const allAds = [];

    // Prepare Windows ads
    windowsAds.forEach(ad => {
        allAds.push({
            dataset: 'Windows',
            adName: ad.adName,
            concept: ad.concept || '',
            spend: ad.spend,
            roas: ad.roas,
            bar: ad.bar,
            url: ad.url
        });
    });

    // Prepare Bath ads
    bathAds.forEach(ad => {
        allAds.push({
            dataset: 'Bath',
            adName: ad.adName,
            concept: ad.concept || '',
            spend: ad.spend,
            roas: ad.roas,
            bar: ad.bar,
            url: ad.url
        });
    });

    total = allAds.length;
    console.log(`Checking ${total} media URLs...`);

    // Check URLs in batches to avoid overwhelming the network
    const batchSize = 10;
    for (let i = 0; i < allAds.length; i += batchSize) {
        const batch = allAds.slice(i, Math.min(i + batchSize, allAds.length));
        const results = await Promise.all(
            batch.map(ad => checkUrl(ad.url, ad))
        );

        results.forEach(result => {
            checked++;
            if (!result.working) {
                brokenMedia.push(result);
            }
            // Show progress
            if (checked % 10 === 0 || checked === total) {
                process.stdout.write(`\rProgress: ${checked}/${total} (${((checked/total)*100).toFixed(0)}%)`);
            }
        });
    }

    console.log('\n');

    if (brokenMedia.length === 0) {
        console.log('✅ All media URLs are working!');
    } else {
        // Create CSV output
        const csvLines = ['Dataset,Ad Name,Concept,Spend,ROAS,BAR,Status,URL'];

        brokenMedia.forEach(ad => {
            // Escape quotes in strings and truncate URL for CSV
            const urlShort = ad.url ? ad.url.substring(0, 100) + '...' : '';
            csvLines.push(`"${ad.dataset}","${ad.adName.replace(/"/g, '""')}","${ad.concept.replace(/"/g, '""')}",${ad.spend},${ad.roas},"${ad.bar}","${ad.status}","${urlShort}"`);
        });

        const csvContent = csvLines.join('\n');

        // Write to file
        fs.writeFileSync('Ads With Broken Media.csv', csvContent);

        console.log(`⚠️ Found ${brokenMedia.length} ads with broken/inaccessible media URLs`);
        console.log('✅ Created "Ads With Broken Media.csv" with details');

        // Show first few broken ones
        console.log('\nFirst few broken URLs:');
        brokenMedia.slice(0, 5).forEach(ad => {
            console.log(`- ${ad.dataset}: ${ad.adName} (${ad.status})`);
        });
    }

    // Report stats
    const workingCount = total - brokenMedia.length;
    console.log(`\nStats:`);
    console.log(`- Total ads checked: ${total}`);
    console.log(`- Working media: ${workingCount} (${((workingCount/total)*100).toFixed(1)}%)`);
    console.log(`- Broken/inaccessible media: ${brokenMedia.length} (${((brokenMedia.length/total)*100).toFixed(1)}%)`);
}

checkAllAds().catch(console.error);