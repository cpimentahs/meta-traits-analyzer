const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse CSV
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');

    // Find header row (the one with "Category" in it)
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

        // Only include rows with Ad Name
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

// Download image
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, { timeout: 10000 }, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(filepath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve();
                });
                fileStream.on('error', (err) => {
                    reject(err);
                });
            } else {
                reject(new Error(`HTTP ${response.statusCode}`));
            }
        }).on('error', (err) => {
            reject(err);
        }).on('timeout', () => {
            reject(new Error('Request timeout'));
        });
    });
}

async function main() {
    // Parse both CSV files
    const windowsAds = parseCSV('traits-windows-ads.csv');
    const bathAds = parseCSV('traits-bath-ads.csv');
    const allAds = [...windowsAds, ...bathAds];

    console.log(`📊 Found ${allAds.length} total ads to download\n`);

    const imagesDir = path.join(__dirname, 'images');
    const successfulDownloads = [];
    const failedDownloads = [];

    for (let i = 0; i < allAds.length; i++) {
        const ad = allAds[i];
        const adId = ad.ad_id;
        const adName = ad['Ad Name'];
        const url = ad.creative_url;

        console.log(`[${i + 1}/${allAds.length}] ${adName}`);

        // Check if no URL at all
        if (!url || url.trim() === '') {
            console.log(`  ❌ No URL provided`);
            failedDownloads.push({
                ad_id: adId,
                ad_name: adName,
                reason: 'No URL provided'
            });
            continue;
        }

        // Check if no ad_id
        if (!adId || adId.trim() === '') {
            console.log(`  ❌ No ad_id provided`);
            failedDownloads.push({
                ad_id: 'N/A',
                ad_name: adName,
                reason: 'No ad_id in CSV'
            });
            continue;
        }

        // Determine file extension from URL
        const ext = url.includes('.jpg') || url.includes('.jpeg') ? '.jpg' : '.png';
        const filename = `${adId}${ext}`;
        const filepath = path.join(imagesDir, filename);

        // Check if already exists
        if (fs.existsSync(filepath)) {
            console.log(`  ✓ Already exists`);
            successfulDownloads.push({ ad_id: adId, ad_name: adName, filename });
            continue;
        }

        // Try to download
        try {
            console.log(`  🔍 Downloading...`);
            await downloadImage(url, filepath);
            console.log(`  ✅ Saved as ${filename}`);
            successfulDownloads.push({ ad_id: adId, ad_name: adName, filename });
        } catch (error) {
            console.log(`  ❌ Failed: ${error.message}`);
            failedDownloads.push({
                ad_id: adId,
                ad_name: adName,
                url: url,
                reason: error.message
            });
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Write results
    console.log('\n📝 Writing results...\n');

    // Failed downloads
    if (failedDownloads.length > 0) {
        let csv = 'ad_id,ad_name,url,reason\n';
        failedDownloads.forEach(item => {
            csv += `"${item.ad_id}","${item.ad_name}","${item.url || ''}","${item.reason}"\n`;
        });
        fs.writeFileSync('failed-downloads.csv', csv);
        console.log(`⚠️  Created failed-downloads.csv (${failedDownloads.length} ads)`);
    } else {
        console.log('✅ All downloads succeeded!');
    }

    console.log('\n📊 Summary:');
    console.log(`Total ads: ${allAds.length}`);
    console.log(`✅ Successful: ${successfulDownloads.length}`);
    console.log(`❌ Failed: ${failedDownloads.length}`);
}

main().catch(console.error);
