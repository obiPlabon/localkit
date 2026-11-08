// Renders public/og.png (1200x630), the default social preview. Run: node scripts/og.mjs
import sharp from 'sharp';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#1a1af0"/>
  <g fill="none" stroke="#ffffff" stroke-opacity=".18" stroke-width="2">
    <path d="M700 430 850 355 1000 430 850 505Z"/><path d="M860 430 1010 355 1160 430 1010 505Z"/>
    <path d="M780 495 930 420 1080 495 930 570Z"/><path d="M620 495 770 420 920 495 770 570Z"/>
  </g>
  <g fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round">
    <path d="M96 118 150 88l54 30v60l-54 30-54-30z"/><path d="M96 118l54 30 54-30M150 148v60"/>
  </g>
  <text x="228" y="170" font-family="Helvetica, Arial, sans-serif" font-size="56" font-weight="700" fill="#fff">Localkit</text>
  <text x="96" y="340" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#fff">Tools that never</text>
  <text x="96" y="440" font-family="Helvetica, Arial, sans-serif" font-size="92" font-weight="700" fill="#fff">leave your browser.</text>
  <text x="96" y="530" font-family="Courier New, monospace" font-size="30" fill="#fff" fill-opacity=".85" letter-spacing="3">FREE · NO SIGN-UP · NOTHING UPLOADED</text>
</svg>`;
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('wrote public/og.png');
