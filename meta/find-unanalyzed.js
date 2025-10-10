const bathAds = require('./bath-ads-data.json');
const windowsAds = require('./ads-data.json');
const analyses = require('./creative-traits-analyses.json');

// Filter to image ads with local images
function getImageAdsWithLocal(ads) {
    return ads.filter(ad => {
        const isVideo = ad.adName && (
            ad.adName.toLowerCase().includes('_vid_') ||
            ad.adName.toLowerCase().includes('video') ||
            (ad.url && ad.url.includes('.mp4'))
        );
        return !isVideo && ad.localImage;
    });
}

const bathImageAds = getImageAdsWithLocal(bathAds);
const windowsImageAds = getImageAdsWithLocal(windowsAds);

const unanalyzedBath = bathImageAds.filter(ad => !analyses[ad.adName]);
const unanalyzedWindows = windowsImageAds.filter(ad => !analyses[ad.adName]);

console.log('Windows ads with local images:', windowsImageAds.length);
console.log('Windows ads analyzed:', windowsImageAds.length - unanalyzedWindows.length);
console.log('Windows ads unanalyzed:', unanalyzedWindows.length);

console.log('\nBath ads with local images:', bathImageAds.length);
console.log('Bath ads analyzed:', bathImageAds.length - unanalyzedBath.length);
console.log('Bath ads unanalyzed:', unanalyzedBath.length);

if (unanalyzedWindows.length > 0) {
    console.log('\n❌ Unanalyzed Windows ads:');
    unanalyzedWindows.forEach(ad => console.log('  -', ad.adName));
}

if (unanalyzedBath.length > 0) {
    console.log('\n❌ Unanalyzed Bath ads:');
    unanalyzedBath.forEach(ad => console.log('  -', ad.adName));
}

console.log('\n✅ Total analyzed:', Object.keys(analyses).length);
console.log('📊 Total with local images:', windowsImageAds.length + bathImageAds.length);
console.log('🎯 Completion rate:', Math.round((Object.keys(analyses).length / (windowsImageAds.length + bathImageAds.length)) * 100) + '%');
