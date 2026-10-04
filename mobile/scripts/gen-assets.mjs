// Renders the Kuraz icon, Android adaptive-icon layers, splash icon and favicon from the logo SVG.
// Paths mirror src/brand/Logo.tsx; keep them in sync. Usage: npm run gen:assets
import sharp from 'sharp';

const FLAME_OUTER =
  'M50 8C50 8 74 31 74 51C74 64.3 63.3 74 50 74C36.7 74 26 64.3 26 51C26 39 34 30 39 22C40 31 44 36 48 38C47 27 49 15 50 8Z';
const FLAME_INNER = 'M50 40C50 40 62 51 62 59.5C62 66 56.6 70.5 50 70.5C43.4 70.5 38 66 38 59.5C38 51 50 40 50 40Z';
const LAMP_NECK = 'M46 75H54V80H46Z';
const LAMP_BODY = 'M40 81H60C62.2 81 64 82.8 64 85V91C64 93.2 62.2 95 60 95H40C37.8 95 36 93.2 36 91V85C36 82.8 37.8 81 40 81Z';

const out = (name) => new URL(`../assets/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The mark scaled into a 100x100 box at `scale`, centred. */
function mark({ color = '#FFFFFF', inner = '#9EDCFF', scale = 1 }) {
  const offset = (100 - 100 * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">
    <path d="${FLAME_OUTER}" fill="${color}"/>
    <path d="${FLAME_INNER}" fill="${inner}"/>
    <path d="${LAMP_NECK}" fill="${color}"/>
    <path d="${LAMP_BODY}" fill="${color}"/>
  </g>`;
}

const gradient = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#22C3F7"/><stop offset="1" stop-color="#0A84E8"/></linearGradient></defs>`;

const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${body}</svg>`);

async function render(name, body, size) {
  await sharp(svg(body), { density: 1200 }).resize(size, size).png().toFile(out(name));
  console.log(`assets/${name} (${size}px)`);
}

// Legacy/store icon: full-bleed gradient (the launcher applies its own mask).
await render('icon.png', `${gradient}<rect width="100" height="100" fill="url(#g)"/>${mark({ inner: '#7FD1FF', scale: 0.66 })}`, 1024);
// Adaptive icon: the mark stays inside the 66% safe zone of the foreground layer.
await render('android-icon-foreground.png', mark({ inner: '#7FD1FF', scale: 0.5 }), 1024);
await render('android-icon-background.png', `${gradient}<rect width="100" height="100" fill="url(#g)"/>`, 1024);
await render('android-icon-monochrome.png', mark({ inner: '#FFFFFF00', scale: 0.5 }), 1024);
// Native splash: white mark on the navy splash background configured in app.json.
await render('splash-icon.png', mark({ scale: 1 }), 1024);
await render('favicon.png', `${gradient}<rect width="100" height="100" rx="24" fill="url(#g)"/>${mark({ inner: '#7FD1FF', scale: 0.66 })}`, 96);
