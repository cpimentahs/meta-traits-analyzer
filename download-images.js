const fs = require('fs');
const https = require('https');
const path = require('path');

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

// Read CSV file
const csvContent = fs.readFileSync('top-35-ads.csv', 'utf8');
// Handle both \r\n and \n line endings
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

// Parse CSV and download images
const ads = [];
let downloadCount = 0;
let totalImages = 0;

console.log(`Found ${lines.length - 1} rows in CSV`);

for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');

    if (parts.length >= 10) {
        totalImages++;
        const adName = parts[1].replace(/^"|"$/g, '').trim();
        // URL is everything between field 5 and the last 4 fields
        const url = parts.slice(5, parts.length - 4).join(',').replace(/^"|"$/g, '').trim();
        console.log(`Processing ${i}: ${adName}`);

        // Create safe filename from ad name
        const safeFileName = adName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const imageFileName = `${safeFileName}_${i}.jpg`;
        const localPath = path.join(imagesDir, imageFileName);

        // Store ad data with local image path
        ads.push({
            concept: parts[0].replace(/^"|"$/g, '').trim(),
            adName: adName,
            bar: parts[2].replace(/^"|"$/g, '').trim(),
            roas: parseFloat(parts[3]) || 0,
            adsets: parseInt(parts[4]) || 0,
            originalUrl: url,
            localImage: `images/${imageFileName}`
        });

        // Download image
        if (!fs.existsSync(localPath) && url.startsWith('http')) {
            const downloadUrl = url.startsWith('https://') ? url : `https://${url}`;
            https.get(downloadUrl, (response) => {
                if (response.statusCode === 200) {
                    const fileStream = fs.createWriteStream(localPath);
                    response.pipe(fileStream);
                    fileStream.on('finish', () => {
                        fileStream.close();
                        downloadCount++;
                        console.log(`Downloaded ${downloadCount}/${totalImages}: ${imageFileName}`);

                        // When all downloads complete, create updated CSV
                        if (downloadCount === totalImages) {
                            createUpdatedCSV();
                        }
                    });
                } else {
                    console.log(`Failed to download: ${adName} (${response.statusCode})`);
                    downloadCount++;
                    if (downloadCount === totalImages) {
                        createUpdatedCSV();
                    }
                }
            }).on('error', (err) => {
                console.error(`Error downloading ${adName}:`, err);
                downloadCount++;
                if (downloadCount === totalImages) {
                    createUpdatedCSV();
                }
            });
        } else if (fs.existsSync(localPath)) {
            console.log(`Already exists: ${imageFileName}`);
            downloadCount++;
            if (downloadCount === totalImages) {
                createUpdatedCSV();
            }
        } else {
            console.log(`Skipping non-HTTP URL: ${url.substring(0, 30)}...`);
            downloadCount++;
            if (downloadCount === totalImages) {
                createUpdatedCSV();
            }
        }
    }
}

// If no images to download, create CSV immediately
if (totalImages === 0) {
    console.log('No images found in CSV');
    createUpdatedCSV();
}

function createUpdatedCSV() {
    // Create a new CSV with local image paths
    let newCsv = 'Concepts,ad_name,BAR,ROAS,# of Adsets,URL,LocalImage\n';
    ads.forEach(ad => {
        newCsv += `"${ad.concept}","${ad.adName}","${ad.bar}",${ad.roas},${ad.adsets},"${ad.originalUrl}","${ad.localImage}"\n`;
    });

    fs.writeFileSync('top-35-ads-with-local.csv', newCsv);
    console.log('\n✅ All images processed!');
    console.log('📄 Created: top-35-ads-with-local.csv');
    console.log('🖼️  Images saved in: ./images/');

    // Create ads data JSON for HTML
    fs.writeFileSync('ads-data.json', JSON.stringify(ads, null, 2));
    console.log('📊 Created: ads-data.json');
}

console.log('Starting image downloads...');