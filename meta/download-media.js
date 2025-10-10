const fs = require('fs');
const https = require('https');
const http = require('http');
const path = require('path');

// Load both Windows and Bath ads
const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));
const bathAds = JSON.parse(fs.readFileSync('bath-ads-data.json', 'utf8'));

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

let totalDownloaded = 0;
let totalSkipped = 0;
let totalFailed = 0;

function sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const protocol = url.startsWith('https') ? https : http;

        const request = protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(true);
                });
            } else if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirects
                file.close();
                fs.unlinkSync(filepath);
                downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
            } else {
                file.close();
                fs.unlinkSync(filepath);
                reject(new Error(`Failed with status ${response.statusCode}`));
            }
        });

        request.on('error', (err) => {
            fs.unlinkSync(filepath);
            reject(err);
        });

        request.setTimeout(10000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function processAd(ad, dataset, index) {
    if (!ad.url || ad.url.trim() === '') {
        console.log(`⏭️  ${dataset} - ${ad.adName}: No URL`);
        totalSkipped++;
        return;
    }

    const safeFileName = sanitizeFilename(ad.adName);

    // Determine file extension based on URL or ad name
    let extension = '.jpg';
    if (ad.url.includes('.png')) {
        extension = '.png';
    } else if (ad.url.includes('.mp4') || ad.adName.toLowerCase().includes('vid')) {
        extension = '.mp4';
    }

    const filename = `${dataset.toLowerCase()}_${safeFileName}_${index}${extension}`;
    const filepath = path.join(imagesDir, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
        console.log(`✓ ${dataset} - ${ad.adName}: Already exists as ${filename}`);
        totalSkipped++;
        return;
    }

    try {
        await downloadFile(ad.url, filepath);
        console.log(`✅ ${dataset} - ${ad.adName}: Downloaded as ${filename}`);
        totalDownloaded++;

        // Update the ad record to include local image path
        return {
            ...ad,
            localImage: `images/${filename}`
        };
    } catch (error) {
        console.log(`❌ ${dataset} - ${ad.adName}: Failed (${error.message})`);
        totalFailed++;
        return ad;
    }
}

async function downloadAllMedia() {
    console.log('Starting media download...\n');

    // Process Windows ads
    console.log('=== Processing Windows Ads ===');
    const updatedWindowsAds = [];
    for (let i = 0; i < windowsAds.length; i++) {
        const updatedAd = await processAd(windowsAds[i], 'Windows', i) || windowsAds[i];
        updatedWindowsAds.push(updatedAd);

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Process Bath ads
    console.log('\n=== Processing Bath Ads ===');
    const updatedBathAds = [];
    for (let i = 0; i < bathAds.length; i++) {
        const updatedAd = await processAd(bathAds[i], 'Bath', i) || bathAds[i];
        updatedBathAds.push(updatedAd);

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Save updated JSON files with local image paths
    fs.writeFileSync('ads-data-with-local.json', JSON.stringify(updatedWindowsAds, null, 2));
    fs.writeFileSync('bath-ads-data-with-local.json', JSON.stringify(updatedBathAds, null, 2));

    // Summary
    console.log('\n=== Summary ===');
    console.log(`✅ Downloaded: ${totalDownloaded}`);
    console.log(`⏭️  Skipped (already exists or no URL): ${totalSkipped}`);
    console.log(`❌ Failed: ${totalFailed}`);
    console.log(`📁 Total files in images folder: ${fs.readdirSync(imagesDir).length}`);

    console.log('\n✅ Created updated JSON files with local paths:');
    console.log('   - ads-data-with-local.json');
    console.log('   - bath-ads-data-with-local.json');
}

downloadAllMedia().catch(console.error);