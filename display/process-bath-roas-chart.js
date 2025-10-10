const fs = require('fs');

// Read Bath ROAS chart CSV file
const csvContent = fs.readFileSync('Bath - ROAS Charts.csv', 'utf8');
const lines = csvContent.split(/\r?\n/).filter(line => line.trim());

console.log(`Found ${lines.length - 1} Bath ads with ROAS chart data`);

const roasChartData = {};

// Parse header to get week labels
const header = lines[0].split(',');
const weekLabels = header.slice(1); // Skip 'ad_name' column

console.log(`Week labels: ${weekLabels.join(', ')}`);

// Parse ROAS chart data
for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');

    if (parts.length >= 2) {
        const adName = parts[0].trim();

        // Get ROAS values for each week
        const weeklyRoas = [];
        for (let j = 1; j < parts.length; j++) {
            const value = parseFloat(parts[j]) || 0;
            weeklyRoas.push(value);
        }

        roasChartData[adName] = {
            weeks: weekLabels,
            values: weeklyRoas
        };
    }
}

// Write Bath ROAS chart data as JSON
fs.writeFileSync('bath-roas-chart-data.json', JSON.stringify(roasChartData, null, 2));

console.log(`✅ Created bath-roas-chart-data.json with ${Object.keys(roasChartData).length} ads`);
console.log(`First ad: ${Object.keys(roasChartData)[0]}`);
console.log(`Weekly ROAS for first ad: ${roasChartData[Object.keys(roasChartData)[0]]?.values.join(', ')}`);