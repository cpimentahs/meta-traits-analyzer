const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const row = {};

        headers.forEach((header, index) => {
            row[header.trim()] = values[index]?.trim() || '';
        });

        data.push(row);
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

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Handle redirects
                downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function main() {
    const mediagoAds = parseCSV('traits-mediago-ads.csv');
    const taboolaAds = parseCSV('traits-taboola-ads.csv');
    
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir);
    }

    let downloaded = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`\n📥 Downloading MediaGO images...`);
    for (const ad of mediagoAds) {
        const assetId = ad.assetid;
        const imageUrl = ad['Image URL'];

        if (!assetId || !imageUrl) {
            console.log(`⚠️  Skipping - no asset ID or image URL`);
            skipped++;
            continue;
        }

        // Determine extension from URL
        const ext = imageUrl.match(/\.(jpg|jpeg|png|gif)($|\?)/i)?.[1] || 'png';
        const filename = `${assetId}.${ext}`;
        const filepath = path.join(imagesDir, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ ${filename} (already exists)`);
            skipped++;
            continue;
        }

        try {
            await downloadImage(imageUrl, filepath);
            console.log(`✅ ${filename}`);
            downloaded++;
        } catch (error) {
            console.error(`❌ ${filename} - ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📥 Downloading Taboola images...`);
    for (const ad of taboolaAds) {
        const assetId = ad.assetid;
        const imageUrl = ad['Image URL'];

        if (!assetId || !imageUrl) {
            console.log(`⚠️  Skipping - no asset ID or image URL`);
            skipped++;
            continue;
        }

        // Determine extension from URL
        const ext = imageUrl.match(/\.(jpg|jpeg|png|gif)($|\?)/i)?.[1] || 'jpg';
        const filename = `${assetId}.${ext}`;
        const filepath = path.join(imagesDir, filename);

        // Skip if already exists
        if (fs.existsSync(filepath)) {
            console.log(`✓ ${filename} (already exists)`);
            skipped++;
            continue;
        }

        try {
            await downloadImage(imageUrl, filepath);
            console.log(`✅ ${filename}`);
            downloaded++;
        } catch (error) {
            console.error(`❌ ${filename} - ${error.message}`);
            failed++;
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Downloaded: ${downloaded}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed: ${failed}`);
}

main();
