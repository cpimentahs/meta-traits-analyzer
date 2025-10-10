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

        // Only include rows with "N" in Has Traits and has a URL
        if (row['Has Traits?'] === 'N' && row.creative_url && row.ad_name) {
            data.push(row);
        }
    }
    return data;
}

// Download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
            } else {
                reject(new Error(`Failed to download: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
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
    // Create images directory if it doesn't exist
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    // Parse both CSV files
    const windowsAds = parseCSV('Windows-missing-traits.csv');
    const bathAds = parseCSV('Bath-missing-traits.csv');
    const allAds = [...windowsAds, ...bathAds];

    console.log(`📊 Found ${allAds.length} ads to download`);

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < allAds.length; i++) {
        const ad = allAds[i];
        const adName = ad.ad_name;
        const url = ad.creative_url;

        if (!url) {
            console.log(`⚠️  Skipping ${adName} - no URL`);
            skipped++;
            continue;
        }

        // Determine file extension from URL
        const ext = url.includes('.jpg') ? '.jpg' : '.png';
        const filename = sanitizeFilename(adName) + ext;
        const filepath = path.join(imagesDir, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ ${i + 1}/${allAds.length} - Already exists: ${filename}`);
            skipped++;
            continue;
        }

        try {
            console.log(`⬇️  ${i + 1}/${allAds.length} - Downloading: ${filename}`);
            await downloadImage(url, filepath);
            console.log(`✅ Downloaded: ${filename}`);
            downloaded++;

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
            console.error(`❌ Failed: ${filename} - ${error.message}`);
            failed++;
        }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Downloaded: ${downloaded}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
}

main().catch(console.error);
