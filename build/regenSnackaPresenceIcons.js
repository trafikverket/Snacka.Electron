// Regenerates the Snacka-branded tray icons (win32/linux/darwin) using
// `sharp` for SVG->PNG, so no puppeteer/Chromium is needed. The React
// pipeline in src/buildAssets.ts hangs behind our corporate proxy, and
// librsvg (sharp's backend) doesn't fully support the AppIcon.tsx
// mask/filter chain — so this script emits FLAT SVGs (chat bubble + a
// solid presence bullet on top) that render cleanly.
//
// The 12-px overlap between the bubble tail area and the presence bullet is
// intentional: at 24-48px tray sizes it reads as a small badge on the
// icon, matching how the Rocket.Chat upstream design looks at that size.
//
// Output paths and sizes mirror createWindowsTrayIcons /
// createLinuxTrayIcons / createMacOSTrayIcons in src/buildAssets.ts.

const { promises: fs } = require('fs');
const path = require('path');

const sharp = require('sharp');
const icoConvert = require('@fiahfy/ico-convert');

// Snacka logo path lifted from ikon-snacka-nomargin_v2.svg. Coord range
// 64..576 in both axes; wrap in translate(-64 -64) to sit in a 0..512 box.
const SNACKA_PATH =
  'M64,304C64,358.4 83.3,408.6 115.9,448.9L67.1,538.3C65.1,542 64,546.2 64,550.5C64,564.6 75.4,576 89.5,576C93.5,576 97.3,575.4 101,573.9L217.4,524C248.8,536.9 283.5,544 320,544C461.4,544 576,436.5 576,304C576,171.5 461.4,64 320,64C178.6,64 64,171.5 64,304ZM158,471.9C167.3,454.8 165.4,433.8 153.2,418.7C127.1,386.4 112,346.8 112,304C112,200.8 202.2,112 320,112C437.8,112 528,200.8 528,304C528,407.2 437.8,496 320,496C289.8,496 261.3,490.1 235.7,479.6C223.8,474.7 210.4,474.8 198.6,479.9L140,504.9L158,471.9ZM208,336C225.7,336 240,321.7 240,304C240,286.3 225.7,272 208,272C190.3,272 176,286.3 176,304C176,321.7 190.3,336 208,336ZM352,304C352,286.3 337.7,272 320,272C302.3,272 288,286.3 288,304C288,321.7 302.3,336 320,336C337.7,336 352,321.7 352,304ZM432,336C449.7,336 464,321.7 464,304C464,286.3 449.7,272 432,272C414.3,272 400,286.3 400,304C400,321.7 414.3,336 432,336Z';

// Kept in sync with src/ui/icons/presenceColors.ts (Fuselage status colors).
const PRESENCE_COLORS = {
  online: '#2DE0A5',
  away: '#FFD21F',
  busy: '#F5455C',
  offline: '#CBCED1',
};

const DISCONNECTED_COLOR = '#F38C39';

// Bullet position: bottom-right corner in the 512-viewBox. Diameter ~160
// (r=80) — reads as a clear badge at 24-48px sizes.
const BULLET_CX = 400;
const BULLET_CY = 400;
const BULLET_R = 80;

const buildSvg = ({ color, overlay }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <g fill="${color}" fill-rule="nonzero" transform="translate(-64 -64)">
    <path d="${SNACKA_PATH}"/>
  </g>
  ${overlay || ''}
</svg>`;

const bullet = (fill) =>
  `<circle cx="${BULLET_CX}" cy="${BULLET_CY}" r="${BULLET_R}" fill="${fill}"/>`;

const offlineRing = (color) =>
  `<circle cx="${BULLET_CX}" cy="${BULLET_CY}" r="${BULLET_R - 12}" fill="none" stroke="${color}" stroke-width="24"/>`;

const disconnectedBadge = () => `
  <circle cx="${BULLET_CX}" cy="${BULLET_CY}" r="${BULLET_R}" fill="${DISCONNECTED_COLOR}"/>
  <rect x="${BULLET_CX - 16}" y="${BULLET_CY - 45}" width="32" height="64" rx="16" fill="white"/>
  <circle cx="${BULLET_CX}" cy="${BULLET_CY + 45}" r="16" fill="white"/>`;

const svgFor = (props, iconColor) => {
  if (props.disconnected) {
    return buildSvg({ color: iconColor, overlay: disconnectedBadge() });
  }
  if (props.presence) {
    const pc = PRESENCE_COLORS[props.presence];
    const overlay =
      props.presence === 'offline' ? offlineRing(pc) : bullet(pc);
    return buildSvg({ color: iconColor, overlay });
  }
  return buildSvg({ color: iconColor });
};

const renderPng = async (svg, size) =>
  sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

const writeFile = async (filePath, data) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data);
  console.log('wrote', filePath, data.length, 'bytes');
};

// Tint colours match src/ui/icons/{Windows,Linux,MacOS}TrayIcon.tsx:
// Windows/Linux use `#9EA2A8` (Chromium tray neutral), macOS renders black
// on the "Template" image and the OS re-tints it.
const writeWindows = async (props, name) => {
  const svg = svgFor(props, '#9EA2A8');
  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngs = await Promise.all(sizes.map((s) => renderPng(svg, s)));
  const ico = await icoConvert.convert(pngs);
  await writeFile(`src/public/images/tray/win32/${name}.ico`, ico);
};

const writeLinux = async (props, name) => {
  const svg = svgFor(props, '#9EA2A8');
  const [p1, p2] = await Promise.all([renderPng(svg, 24), renderPng(svg, 48)]);
  await writeFile(`src/public/images/tray/linux/${name}.png`, p1);
  await writeFile(`src/public/images/tray/linux/${name}@2x.png`, p2);
};

const writeMac = async (props, name) => {
  const svg = svgFor(props, 'black');
  const [p1, p2] = await Promise.all([renderPng(svg, 24), renderPng(svg, 48)]);
  await writeFile(`src/public/images/tray/darwin/${name}.png`, p1);
  await writeFile(`src/public/images/tray/darwin/${name}@2x.png`, p2);
};

const writeMacDefault = async () => {
  const svg = svgFor({}, 'black');
  const [p1, p2] = await Promise.all([renderPng(svg, 24), renderPng(svg, 48)]);
  await writeFile('src/public/images/tray/darwin/defaultTemplate.png', p1);
  await writeFile('src/public/images/tray/darwin/defaultTemplate@2x.png', p2);
};

const main = async () => {
  await writeWindows({}, 'default');
  await writeLinux({}, 'default');
  await writeMacDefault();

  for (const presence of ['online', 'away', 'busy', 'offline']) {
    await writeWindows({ presence }, `presence-${presence}`);
    await writeLinux({ presence }, `presence-${presence}`);
    await writeMac({ presence }, `presence-${presence}`);
  }
  await writeWindows({ disconnected: true }, 'disconnected');
  await writeLinux({ disconnected: true }, 'disconnected');
  await writeMac({ disconnected: true }, 'disconnected');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
