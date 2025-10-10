const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load framework
const framework = require('./creative-traits-framework.json');

// Load existing analyses
let analyses = JSON.parse(fs.readFileSync('creative-traits-analyses.json', 'utf8'));

// Analyze new traits only
async function analyzeNewTraits(imagePath, adName, category) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    const prompt = `You are an expert ad analyst. Analyze this ${category} ad image and extract ONLY the following 6 traits with EXTREME PRECISION.

**CRITICAL RULES:**
1. HOLISTIC ANALYSIS: Examine the ENTIRE image - all visuals, graphics, photos, text, and design elements.
2. OPTION SELECTION: Choose ONLY from the exact options provided. Do NOT create new options.
3. TEXT INSPECTION: Read the headline text carefully to check for numbers, %, $, and "FREE".
4. JSON ONLY: Return ONLY valid JSON with no markdown, no explanation, no additional text.

**TRAIT OPTIONS (SELECT ONLY FROM THESE):**

Human presence (look at the entire image - are there people/faces/hands shown?):
${framework['Human presence'].options.join(', ')}

Headline contains number (does the headline text contain any number like 50%, $100, 2025, etc.?):
${framework['Headline contains number'].options.join(', ')}

% sign present (is there a % symbol anywhere in the ad?):
${framework['% sign present'].options.join(', ')}

$ sign present (is there a $ symbol anywhere in the ad?):
${framework['$ sign present'].options.join(', ')}

FREE present (is the word "FREE" present anywhere in the ad?):
${framework['FREE present'].options.join(', ')}

ALL CAPS headline (is the main headline text in ALL CAPITAL LETTERS?):
${framework['ALL CAPS headline'].options.join(', ')}

**REQUIRED JSON FORMAT (copy this structure exactly):**
{
  "Human presence": "exact option from list above",
  "Headline contains number": "Y or N",
  "% sign present": "Y or N",
  "$ sign present": "Y or N",
  "FREE present": "Y or N",
  "ALL CAPS headline": "Y or N"
}`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            max_tokens: 500
        });

        const content = response.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
            console.error(`❌ Failed to parse response for ${adName}`);
            return null;
        }

        const newTraits = JSON.parse(jsonMatch[0]);
        return newTraits;
    } catch (error) {
        console.error(`❌ Error analyzing ${adName}:`, error.message);
        return null;
    }
}

// Main function
async function main() {
    console.log(`📊 Found ${Object.keys(analyses).length} analyzed ads`);
    console.log(`🎯 Adding 6 new traits to all ads:\n`);

    let count = 0;

    for (const adName in analyses) {
        const ad = analyses[adName];

        // Skip if already has new traits
        if (ad['Human presence']) {
            console.log(`⏭️  Skipping ${adName} (already has new traits)`);
            continue;
        }

        // Find the image
        const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));
        const bathAds = JSON.parse(fs.readFileSync('bath-ads-data.json', 'utf8'));
        const allAds = [...windowsAds, ...bathAds];

        const adData = allAds.find(a => a.adName === adName);
        if (!adData || !adData.localImage) {
            console.log(`⏭️  Skipping ${adName} (no local image)`);
            continue;
        }

        console.log(`🔍 Analyzing: ${adName}`);

        const fullPath = path.join(__dirname, adData.localImage);
        if (!fs.existsSync(fullPath)) {
            console.log(`⏭️  Skipping (image not found: ${fullPath})`);
            continue;
        }

        const newTraits = await analyzeNewTraits(fullPath, adName, ad.category);

        if (newTraits) {
            // Merge new traits into existing analysis
            analyses[adName] = {
                ...ad,
                ...newTraits
            };
            count++;
            console.log(`✅ Added new traits\n`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save updated analyses
    fs.writeFileSync('creative-traits-analyses.json', JSON.stringify(analyses, null, 2));

    console.log(`\n✅ Analysis complete!`);
    console.log(`📊 Added 6 new traits to ${count} ads`);
}

main();
