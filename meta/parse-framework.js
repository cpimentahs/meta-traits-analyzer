const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('creative_traits_framework_full.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

// Parse the framework into a structured format
const framework = {
    'Headline (Hook Text)': {
        type: 'text',
        options: null // Free text field
    },
    'Problem Shown': {
        type: 'select',
        options: []
    },
    'Solution / Transformation Shown': {
        type: 'select',
        options: []
    },
    'Offer Style': {
        type: 'select',
        options: []
    },
    'CTA (Text Itself)': {
        type: 'text',
        options: null // Free text field
    },
    'CTA Position': {
        type: 'select',
        options: []
    },
    'Social Proof / Credibility': {
        type: 'select',
        options: []
    },
    'Emotion / Vibe': {
        type: 'select',
        options: []
    },
    'Brand Presence': {
        type: 'select',
        options: []
    },
    'Urgency Signals': {
        type: 'select',
        options: []
    },
    'Contrast': {
        type: 'select',
        options: []
    },
    'Color': {
        type: 'select',
        options: []
    },
    'Human presence': {
        type: 'select',
        options: []
    },
    'Headline contains number': {
        type: 'select',
        options: []
    },
    '% sign present': {
        type: 'select',
        options: []
    },
    '$ sign present': {
        type: 'select',
        options: []
    },
    'FREE present': {
        type: 'select',
        options: []
    },
    'ALL CAPS headline': {
        type: 'select',
        options: []
    }
};

// Extract unique options for each column
Object.keys(framework).forEach(column => {
    if (framework[column].type === 'select') {
        const options = new Set();
        data.forEach(row => {
            if (row[column] && row[column] !== 'NaN' && row[column].toString().trim() !== '') {
                options.add(row[column].toString().trim());
            }
        });
        framework[column].options = Array.from(options);
    }
});

// Save to JSON
fs.writeFileSync('creative-traits-framework.json', JSON.stringify(framework, null, 2));

console.log('✅ Framework parsed successfully!');
console.log('\nTrait Summary:');
Object.keys(framework).forEach(trait => {
    if (framework[trait].type === 'select') {
        console.log(`\n${trait}:`);
        framework[trait].options.forEach(opt => console.log(`  - ${opt}`));
    } else {
        console.log(`\n${trait}: [Free text]`);
    }
});