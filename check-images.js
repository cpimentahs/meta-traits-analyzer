const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',');
        const row = {};
        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
        });

        // Only include rows with ad_name
        if (row.ad_name && row.ad_name.trim()) {
            data.push(row);
        }
    }
    return data;
}

// Check if URL is accessible
function checkURL(url) {
    return new Promise((resolve) => {
        const protocol = url.startsWith('https') ? https : http;

        const req = protocol.get(url, { timeout: 5000 }, (response) => {
            resolve(response.statusCode === 200);
        });

        req.on('error', () => {
            resolve(false);
        });

        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
    });
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .substring(0, 200);
}

async function main() {
    // Parse both CSV files
    const windowsAds = parseCSV('Windows-missing-traits.csv');
    const bathAds = parseCSV('Bath-missing-traits.csv');
    const allAds = [...windowsAds, ...bathAds];

    console.log(`📊 Found ${allAds.length} total ads to check`);

    const adsWithNoLink = [];
    const adsWithBrokenLink = [];
    const imagesDir = path.join(__dirname, 'images');

    for (let i = 0; i < allAds.length; i++) {
        const ad = allAds[i];
        const adName = ad.ad_name;
        const url = ad.creative_url;

        console.log(`Checking ${i + 1}/${allAds.length}: ${adName}`);

        // Check if no URL at all
        if (!url || url.trim() === '') {
            adsWithNoLink.push({
                ad_name: adName,
                category: adName.includes('Bath') ? 'Bath' : 'Windows',
                reason: 'No URL provided'
            });
            console.log(`  ❌ No URL`);
            continue;
        }

        // Check if local image exists
        const ext = url.includes('.jpg') ? '.jpg' : '.png';
        const filename = sanitizeFilename(adName) + ext;
        const filepath = path.join(imagesDir, filename);

        if (fs.existsSync(filepath)) {
            console.log(`  ✓ Local file exists`);
            continue;
        }

        // Check if URL is accessible
        console.log(`  🔍 Checking URL...`);
        const isAccessible = await checkURL(url);

        if (!isAccessible) {
            adsWithBrokenLink.push({
                ad_name: adName,
                category: adName.includes('Bath') ? 'Bath' : 'Windows',
                url: url,
                reason: 'URL not accessible or returns error'
            });
            console.log(`  ❌ URL broken`);
        } else {
            console.log(`  ⚠️  URL works but not downloaded`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Write results to CSV files
    console.log('\n📝 Writing results...\n');

    // Ads with no link
    if (adsWithNoLink.length > 0) {
        let csv = 'ad_name,category,reason\n';
        adsWithNoLink.forEach(ad => {
            csv += `"${ad.ad_name}",${ad.category},"${ad.reason}"\n`;
        });
        fs.writeFileSync('ads-with-no-link.csv', csv);
        console.log(`✅ Created ads-with-no-link.csv (${adsWithNoLink.length} ads)`);
    } else {
        console.log('✅ No ads without links found');
    }

    // Ads with broken links
    if (adsWithBrokenLink.length > 0) {
        let csv = 'ad_name,category,url,reason\n';
        adsWithBrokenLink.forEach(ad => {
            csv += `"${ad.ad_name}",${ad.category},"${ad.url}","${ad.reason}"\n`;
        });
        fs.writeFileSync('ads-with-broken-link.csv', csv);
        console.log(`✅ Created ads-with-broken-link.csv (${adsWithBrokenLink.length} ads)`);
    } else {
        console.log('✅ No ads with broken links found');
    }

    console.log('\n📊 Summary:');
    console.log(`Total ads checked: ${allAds.length}`);
    console.log(`Ads with no link: ${adsWithNoLink.length}`);
    console.log(`Ads with broken link: ${adsWithBrokenLink.length}`);
}

main().catch(console.error);
