const fs = require('fs');

// Read Bath targeting CSV file
const csvContent = fs.readFileSync('Bath - Targeting Table.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Found ${lines.length - 1} Bath targeting entries`);

const targetingData = {};

// Parse Bath targeting data
// Headers: ad_name,Targeting,Spend,BAR,ROAS,CTR,CVR
for (let i = 1; i < lines.length; i++) {
    // Check if this is a "Total" row (has " Total" in first column and empty second column)
    if (lines[i].includes(' Total,')) {
        // Parse total row: "ad_name Total,,spend,bar,roas,ctr,cvr"
        const match = lines[i].match(/^(.+) Total,,"?([0-9,\.]+)"?,([^,]+),([^,]+),([^,]+),(.+)$/);

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

            // Convert BAR from decimal to percentage if needed for total row
            let barFormatted = bar;
            const barNum = parseFloat(bar);
            if (!isNaN(barNum) && barNum < 1) {
                barFormatted = (barNum * 100).toFixed(0) + '%';
            } else if (!isNaN(barNum)) {
                barFormatted = barNum.toFixed(0) + '%';
            }

            // Convert CTR and CVR to percentage format for total row
            let ctrFormatted = ctr;
            const ctrNum = parseFloat(ctr);
            if (!isNaN(ctrNum) && ctrNum < 1) {
                ctrFormatted = (ctrNum * 100).toFixed(2) + '%';
            }

            let cvrFormatted = cvr;
            const cvrNum = parseFloat(cvr);
            if (!isNaN(cvrNum) && cvrNum < 1) {
                cvrFormatted = (cvrNum * 100).toFixed(2) + '%';
            }

            targetingData[adName].push({
                targeting: 'Total',
                spend: parseFloat(spend) || 0,
                bar: barFormatted,
                roas: roas,
                ctr: ctrFormatted,
                cvr: cvrFormatted,
                isTotal: true
            });
        }
    } else {
        // Regular row parsing - handle quoted spend values and empty ad_name
        // Format: ad_name,Targeting,"Spend",BAR,ROAS,CTR,CVR
        const match = lines[i].match(/^([^,]*),([^,]+),"?([0-9,\.]+)"?,([^,]+),([^,]+),([^,]+),(.+)$/);

        if (match) {
            let adName = match[1].trim();
            const targeting = match[2].trim();
            const spend = match[3].replace(/,/g, '');  // Remove commas from number
            const bar = match[4].trim();
            const roas = parseFloat(match[5]) || 0;
            const ctr = match[6].trim();
            const cvr = match[7].trim();

            // If ad_name is empty, use the last non-empty ad_name
            if (!adName && i > 1) {
                // Find the last non-empty ad_name
                for (let j = i - 1; j >= 1; j--) {
                    const prevLine = lines[j];
                    if (!prevLine.includes(' Total,')) {
                        const prevParts = prevLine.split(',');
                        if (prevParts[0].trim()) {
                            adName = prevParts[0].trim();
                            break;
                        }
                    }
                }
            }

            if (adName && targeting) {
                if (!targetingData[adName]) {
                    targetingData[adName] = [];
                }

                // Convert BAR from decimal to percentage if needed
                let barFormatted = bar;
                const barNum = parseFloat(bar);
                if (!isNaN(barNum) && barNum < 1) {
                    barFormatted = (barNum * 100).toFixed(0) + '%';
                } else if (!isNaN(barNum)) {
                    barFormatted = barNum.toFixed(0) + '%';
                }

                // Convert CTR and CVR to percentage format
                let ctrFormatted = ctr;
                const ctrNum = parseFloat(ctr);
                if (!isNaN(ctrNum) && ctrNum < 1) {
                    ctrFormatted = (ctrNum * 100).toFixed(2) + '%';
                }

                let cvrFormatted = cvr;
                const cvrNum = parseFloat(cvr);
                if (!isNaN(cvrNum) && cvrNum < 1) {
                    cvrFormatted = (cvrNum * 100).toFixed(2) + '%';
                }

                targetingData[adName].push({
                    targeting: targeting,
                    spend: parseFloat(spend) || 0,
                    bar: barFormatted,
                    roas: roas,
                    ctr: ctrFormatted,
                    cvr: cvrFormatted
                });
            }
        }
    }
}

// Write Bath targeting data as JSON
fs.writeFileSync('bath-targeting-data.json', JSON.stringify(targetingData, null, 2));

console.log(`✅ Created bath-targeting-data.json with ${Object.keys(targetingData).length} ads`);
console.log(`First ad: ${Object.keys(targetingData)[0]}`);
console.log(`Targeting lines for first ad (including total): ${targetingData[Object.keys(targetingData)[0]]?.length}`);