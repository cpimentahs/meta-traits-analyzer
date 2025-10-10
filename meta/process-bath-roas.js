const fs = require('fs');

// Read Bath ROAS CSV file
const csvContent = fs.readFileSync('Bath - ROAS Charts.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Processing ${lines.length - 1} Bath ads ROAS data`);

const roasChartData = {};

// Parse header to get week labels
const header = lines[0].split(',');
const weekLabels = header.slice(1); // Skip 'ad_name' column

// Process each ad's ROAS data
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const adName = parts[0].trim();

    if (adName) {
        const weeklyRoas = parts.slice(1).map(val => {
            const num = parseFloat(val);
            return isNaN(num) ? 0 : num;
        });

        roasChartData[adName] = {
            weeks: weekLabels,
            values: weeklyRoas
        };
    }
}

// Write Bath ROAS chart data as JSON
fs.writeFileSync('bath-roas-chart-data.json', JSON.stringify(roasChartData, null, 2));

console.log(`✅ Created bath-roas-chart-data.json with ${Object.keys(roasChartData).length} ads`);
console.log(`Week labels: ${weekLabels.join(', ')}`);