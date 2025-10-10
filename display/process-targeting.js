const fs = require('fs');

// Read targeting CSV file
const csvContent = fs.readFileSync('Windows - Targeting Breakdown.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Found ${lines.length - 1} targeting entries`);

const targetingData = {};

// Parse targeting data
for (let i = 1; i < lines.length; i++) {
    // Check if this is a "Total" row (has " Total" in first column and empty second column)
    if (lines[i].includes(' Total,')) {
        // Parse total row: "ad_name Total,,spend,bar,roas,ctr,cvr"
        const match = lines[i].match(/^(.+) Total,,"?\$?([0-9,\.]+)"?,([^,]+),([^,]+),([^,]+),(.+)$/);

        if (match) {
            const adName = match[1].trim();
            const spend = match[2].replace(/,/g, '');
            const bar = match[3].trim();
            const roas = parseFloat(match[4]) || 0;
            const ctr = match[5].trim();
            const cvr = match[6].trim();

            if (!targetingData[adName]) {
                targetingData[adName] = [];
            }

            targetingData[adName].push({
                targeting: 'Total',
                spend: parseFloat(spend) || 0,
                bar: bar,
                roas: roas,
                ctr: ctr,
                cvr: cvr,
                isTotal: true
            });
        }
    } else {
        // Regular row parsing
        const match = lines[i].match(/^([^,]+),([^,]+),"?\$?([0-9,\.]+)"?,([^,]+),([^,]+),([^,]+),(.+)$/);

        if (match) {
            const adName = match[1].trim();
            const targeting = match[2].trim();
            const spend = match[3].replace(/,/g, '');
            const bar = match[4].trim();
            const roas = parseFloat(match[5]) || 0;
            const ctr = match[6].trim();
            const cvr = match[7].trim();

            if (!targetingData[adName]) {
                targetingData[adName] = [];
            }

            targetingData[adName].push({
                targeting: targeting,
                spend: parseFloat(spend) || 0,
                bar: bar,
                roas: roas,
                ctr: ctr,
                cvr: cvr
            });
        }
    }
}

// Write targeting data as JSON
fs.writeFileSync('targeting-data.json', JSON.stringify(targetingData, null, 2));

console.log(`✅ Created targeting-data.json with ${Object.keys(targetingData).length} ads`);
console.log(`First ad: ${Object.keys(targetingData)[0]}`);
console.log(`Targeting lines for first ad: ${targetingData[Object.keys(targetingData)[0]].length}`);