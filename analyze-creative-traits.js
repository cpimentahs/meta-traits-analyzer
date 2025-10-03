require('dotenv').config();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Load framework
const framework = JSON.parse(fs.readFileSync('creative-traits-framework.json', 'utf8'));

// Load existing analyses if they exist
let analyses = {};
if (fs.existsSync('creative-traits-analyses.json')) {
    analyses = JSON.parse(fs.readFileSync('creative-traits-analyses.json', 'utf8'));
}

async function analyzeImage(imagePath, adName, category) {
    console.log(`\n🔍 Analyzing: ${adName}`);

    // Read image as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

    // Build prompt with all trait options
    const prompt = `You are an expert ad analyst. Analyze this ${category} ad image and extract creative traits with EXTREME PRECISION.

**CRITICAL ANALYSIS APPROACH:**
You must examine THE ENTIRE IMAGE HOLISTICALLY - look at ALL visual elements, text, graphics, images, colors, and design components together. Do NOT focus only on text. Consider:
- What visual story is being told through images, before/after photos, people, products shown
- What problem is illustrated or implied through visuals (drafty windows, old fixtures, high bills graphics, etc.)
- What solution is demonstrated through imagery (modern products, energy savings visuals, beautiful transformations)
- The overall emotional tone created by the combination of imagery, colors, and design
- All credibility signals like badges, reviews, warranties, testimonials shown visually or in text

**CRITICAL RULES:**
1. TEXT EXTRACTION: Copy the EXACT text character-by-character. Include ALL punctuation, capitalization, line breaks (use \\n). Do NOT paraphrase, summarize, or interpret.
2. HOLISTIC ANALYSIS: Examine the ENTIRE image - all visuals, graphics, photos, illustrations, text, colors, and design elements together. Don't just read text - LOOK at what's being shown visually.
3. PROBLEM/SOLUTION: Identify what problem is shown or implied through ANY element (images, icons, text, before/after photos). Identify what solution/transformation is demonstrated visually or stated.
4. OPTION SELECTION: Choose ONLY from the exact options provided. Do NOT create new options or variations.
5. MOST PROMINENT: If multiple elements exist, select the ONE most visually dominant or impactful element based on size, placement, and visual weight.
6. SPECIFICITY: "Other" or "None" should ONLY be used when truly nothing matches after examining all visual and textual elements - try hard to find a match first.
7. JSON ONLY: Return ONLY valid JSON with no markdown, no explanation, no additional text.

**TRAIT OPTIONS (SELECT ONLY FROM THESE):**

Problem Shown (select the MOST PROMINENT problem visually depicted or implied):
${framework['Problem Shown'].options.join(', ')}

Solution / Transformation Shown (select the MOST PROMINENT solution/transformation):
${framework['Solution / Transformation Shown'].options.join(', ')}

Offer Style (select the ONE that matches the offer):
${framework['Offer Style'].options.join(', ')}

CTA Position (where is the primary CTA button/text located):
${framework['CTA Position'].options.join(', ')}

Social Proof / Credibility (select the MOST PROMINENT type shown):
${framework['Social Proof / Credibility'].options.join(', ')}

Emotion / Vibe (select the PRIMARY emotional tone):
${framework['Emotion / Vibe'].options.join(', ')}

Brand Presence (how prominently is the brand/logo shown):
${framework['Brand Presence'].options.join(', ')}

Urgency Signals (select the MOST PROMINENT urgency element):
${framework['Urgency Signals'].options.join(', ')}

Contrast (overall visual contrast level - High=bold/vibrant, Mid=moderate, Low=subtle/muted):
${framework['Contrast'].options.join(', ')}

Color (dominant color temperature/palette):
${framework['Color'].options.join(', ')}

**REQUIRED JSON FORMAT (copy this structure exactly):**
{
  "Headline (Hook Text)": "exact text from image - copy character by character",
  "Problem Shown": "exact option from list above",
  "Solution / Transformation Shown": "exact option from list above",
  "Offer Style": "exact option from list above",
  "CTA (Text Itself)": "exact CTA button text - copy character by character",
  "CTA Position": "exact option from list above",
  "Social Proof / Credibility": "exact option from list above",
  "Emotion / Vibe": "exact option from list above",
  "Brand Presence": "exact option from list above",
  "Urgency Signals": "exact option from list above",
  "Contrast": "exact option from list above",
  "Color": "exact option from list above"
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
            max_tokens: 1000
        });

        const content = response.choices[0].message.content.trim();

        // Try to extract JSON if there's extra text
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        const traits = JSON.parse(jsonStr);

        console.log(`✅ Successfully analyzed`);
        return traits;

    } catch (error) {
        console.error(`❌ Error analyzing ${adName}:`, error.message);
        return null;
    }
}

async function main() {
    // Load ads data
    const windowsAds = JSON.parse(fs.readFileSync('ads-data.json', 'utf8'));
    const bathAds = JSON.parse(fs.readFileSync('bath-ads-data.json', 'utf8'));

    // Filter to only image ads (no videos)
    const allAds = [
        ...windowsAds.map(ad => ({ ...ad, category: 'Windows' })),
        ...bathAds.map(ad => ({ ...ad, category: 'Bath' }))
    ].filter(ad => {
        const isVideo = ad.adName && (
            ad.adName.toLowerCase().includes('_vid_') ||
            ad.adName.toLowerCase().includes('video') ||
            (ad.url && ad.url.includes('.mp4'))
        );
        return !isVideo && (ad.localImage || ad.url);
    });

    console.log(`📊 Found ${allAds.length} image ads to analyze`);
    console.log(`📁 ${Object.keys(analyses).length} ads already analyzed`);

    // Find new ads that haven't been analyzed
    const newAds = allAds.filter(ad => !analyses[ad.adName]);

    if (newAds.length === 0) {
        console.log('\n✅ All ads have been analyzed!');
        return;
    }

    console.log(`\n🆕 Found ${newAds.length} new ads to analyze\n`);

    // Analyze new ads
    for (const ad of newAds) {
        const imagePath = ad.localImage || ad.url;

        // Only analyze if it's a local image
        if (!imagePath || imagePath.startsWith('http')) {
            console.log(`⏭️  Skipping ${ad.adName} (no local image)`);
            continue;
        }

        const fullPath = path.join(__dirname, imagePath);

        if (!fs.existsSync(fullPath)) {
            console.log(`⏭️  Skipping ${ad.adName} (image not found: ${fullPath})`);
            continue;
        }

        const traits = await analyzeImage(fullPath, ad.adName, ad.category);

        if (traits) {
            analyses[ad.adName] = {
                ...traits,
                category: ad.category,
                analyzedAt: new Date().toISOString()
            };

            // Save after each successful analysis
            fs.writeFileSync(
                'creative-traits-analyses.json',
                JSON.stringify(analyses, null, 2)
            );
        }

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Analysis complete!`);
    console.log(`📊 Total ads analyzed: ${Object.keys(analyses).length}`);
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { analyzeImage, analyses };