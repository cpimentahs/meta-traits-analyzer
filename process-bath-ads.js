const fs = require('fs');

// Read Bath ads CSV file
const csvContent = fs.readFileSync('Bath - Top Ads.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Found ${lines.length - 1} Bath ads`);

const adsData = [];

// Parse Bath ads data
// Headers: Concepts,ad_name,SUM of spend,SUM of matched_leads,SUM of booked_appts,SUM of hs_rev,BAR,ROAS,# of Adsets,URL
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');

    if (parts.length >= 10) {
        const concept = parts[0].trim();
        const adName = parts[1].trim();
        const spend = parseFloat(parts[2]) || 0;
        const leads = parseInt(parts[3]) || 0;
        const appointments = parseInt(parts[4]) || 0;
        const revenue = parseFloat(parts[5]) || 0;
        const bar = parts[6].trim();
        const roas = parseFloat(parts[7]) || 0;
        const adsets = parseInt(parts[8]) || 0;

        // URL is everything after field 9
        const urlPart = parts.slice(9).join(',').trim();

        adsData.push({
            concept: concept,
            adName: adName,
            bar: bar,
            roas: roas,
            adsets: adsets,
            url: urlPart,
            originalUrl: urlPart,
            spend: spend,
            leads: leads,
            appointments: appointments,
            revenue: revenue
        });
    }
}

// Write Bath ads data as JSON
fs.writeFileSync('bath-ads-data.json', JSON.stringify(adsData, null, 2));

console.log(`✅ Created bath-ads-data.json with ${adsData.length} ads`);
console.log(`First ad: ${adsData[0]?.adName}`);
console.log(`Total spend: $${adsData.reduce((sum, ad) => sum + ad.spend, 0).toFixed(2)}`);