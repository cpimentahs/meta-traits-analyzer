const windowsAds = require('./ads-data.json');
const bathAds = require('./bath-ads-data.json');

const allAds = [
  ...windowsAds.map(ad => ({...ad, category: 'Windows'})),
  ...bathAds.map(ad => ({...ad, category: 'Bath'}))
];

// Filter out videos
const imageAds = allAds.filter(ad => {
  const isVideo = ad.adName && (
    ad.adName.toLowerCase().includes('_vid_') ||
    ad.adName.toLowerCase().includes('video') ||
    (ad.url && ad.url.includes('.mp4'))
  );
  return !isVideo;
});

const withLocalImage = imageAds.filter(ad => ad.localImage);
const withoutLocalImage = imageAds.filter(ad => !ad.localImage);

console.log('📊 Image Ads Breakdown:');
console.log('Total image ads:', imageAds.length);
console.log('');
console.log('✅ With local images:', withLocalImage.length);
console.log('❌ Without local images (URL only):', withoutLocalImage.length);
console.log('');
console.log('By Category:');
console.log('Windows with local images:', withLocalImage.filter(a => a.category === 'Windows').length);
console.log('Bath with local images:', withLocalImage.filter(a => a.category === 'Bath').length);
console.log('');
console.log('Windows without local images:', withoutLocalImage.filter(a => a.category === 'Windows').length);
console.log('Bath without local images:', withoutLocalImage.filter(a => a.category === 'Bath').length);

console.log('\n📝 Ads without local images:');
withoutLocalImage.forEach(ad => {
  console.log(`  ${ad.category}: ${ad.adName}`);
});