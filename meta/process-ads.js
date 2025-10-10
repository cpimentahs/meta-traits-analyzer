const fs = require('fs');
const path = require('path');

// Read CSV file
const csvContent = fs.readFileSync('Windows - Top Ads.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Found ${lines.length - 1} ads in CSV`);

const ads = [];

// Parse all ads from CSV with new column order
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');

    if (parts.length >= 9) {
        // New column order: Concepts,ad_name,SUM of spend,SUM of matched_leads,SUM of booked_appts,SUM of hs_rev,BAR,ROAS,# of Adsets,URL
        const concept = parts[0].replace(/^"|"$/g, '').trim();
        const adName = parts[1].replace(/^"|"$/g, '').trim();
        const spend = parseFloat(parts[2]) || 0;
        const leads = parseInt(parts[3]) || 0;
        const appointments = parseInt(parts[4]) || 0;
        const revenue = parseFloat(parts[5]) || 0;
        const bar = parts[6].replace(/^"|"$/g, '').trim();
        const roas = parseFloat(parts[7]) || 0;
        const adsets = parseInt(parts[8]) || 0;

        // URL is everything after field 9
        const url = parts.slice(9).join(',').replace(/^"|"$/g, '').trim();

        // Create safe filename for local image - try to match existing images
        const safeFileName = adName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        // Try to find matching image in the images folder
        let localImagePath = null;
        const imageFiles = fs.readdirSync(path.join(__dirname, 'images')).filter(f =>
            f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
        );

        // Look for exact match or partial match
        for (const imgFile of imageFiles) {
            const imgName = imgFile.toLowerCase();
            // Check if the image name starts with the safe filename
            if (imgName.startsWith(safeFileName)) {
                localImagePath = `images/${imgFile}`;
                break;
            }
        }

        ads.push({
            concept: concept,
            adName: adName,
            bar: bar,
            roas: roas,
            adsets: adsets,
            originalUrl: url,
            url: url,
            localImage: localImagePath,
            spend: spend,
            leads: leads,
            appointments: appointments,
            revenue: revenue
        });
    }
}

// Write JSON file with all ads data
fs.writeFileSync('ads-data.json', JSON.stringify(ads, null, 2));

console.log(`✅ Created ads-data.json with ${ads.length} ads`);
console.log(`First ad: ${ads[0]?.adName}`);
console.log(`Last ad: ${ads[ads.length - 1]?.adName}`);