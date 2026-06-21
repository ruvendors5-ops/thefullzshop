// ── Build Script — The Fullz Shop for Netlify (v2 Atlas Edition) ──

const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const DIST = path.join(__dirname, 'dist');
const PUBLIC = path.join(__dirname, 'public');
const DB = require('./database');

// ── Clean dist ──
if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true });

// ── Copy public assets ──
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}
copyDir(PUBLIC, DIST);

// ── Shared locals ──
const stats = DB.getStats();
const reviews = DB.getReviews();
const locals = {
  totalOrders: stats.total,
  completedOrders: stats.completed,
  activeNow: 14,
  reviews,
  currentYear: new Date().getFullYear(),
  siteName: DB.SITE_NAME,
  contact: DB.CONTACT,
  terms: DB.TERMS,
  recentOrders: []
};

// ── Render helper ──
function render(template, data = {}) {
  const file = path.join(SRC, 'views', template + '.ejs');
  return ejs.renderFile(file, { ...locals, ...data }, { root: path.join(SRC, 'views') });
}

async function writePage(route, html) {
  const dir = route === '/' ? DIST : path.join(DIST, route);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`  ✓ /${route}`);
}

// ── Build all pages ──
async function build() {
  console.log('\n  ┌──────────────────────────────────────┐');
  console.log('  │  The Fullz Shop — Atlas Trade Group  │');
  console.log('  └──────────────────────────────────────┘\n');

  // 1. Home
  const indexHtml = await render('index', {
    seo: DB.SEO['/'],
    reviews: DB.getReviews()
  });
  await writePage('', indexHtml); // root

  // 2-11. Product pages
  const pages = [
    'fullz', 'ccs', 'dumps', 'banklogs',
    'cashapp', 'paypal', 'venmo', 'wu', 'zelle', 'cloned'
  ];

  for (const id of pages) {
    const product = DB.PRODUCTS[id];
    if (!product) {
      console.log(`  ✗ /${id} — no product data`);
      continue;
    }
    
    const seo = DB.SEO[id] || {};
    const html = await render('product', {
      seo,
      pageId: id,
      product
    });
    await writePage(id, html);
  }

  // Order page
  const orderHtml = await render('order', {
    seo: { title: 'Order Status — The Fullz Shop', description: 'Track your order' }
  });
  const orderDir = path.join(DIST, 'order');
  if (!fs.existsSync(orderDir)) fs.mkdirSync(orderDir, { recursive: true });
  fs.writeFileSync(path.join(orderDir, 'index.html'), orderHtml);
  console.log('  ✓ /order');

  // 404
  const notFoundHtml = await render('404');
  fs.writeFileSync(path.join(DIST, '404.html'), notFoundHtml);
  console.log('  ✓ 404');

  // ── Generate sitemap.xml ──
  const SITE_URL = 'https://thefullz.shop';
  const today = new Date().toISOString().split('T')[0];
  const allRoutes = [
    { route: '', priority: '1.0', changefreq: 'weekly' },
    ...pages.map(id => ({ route: id, priority: '0.8', changefreq: 'weekly' })),
    { route: 'order', priority: '0.3', changefreq: 'monthly' }
  ];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const r of allRoutes) {
    const loc = r.route === '' ? SITE_URL : `${SITE_URL}/${r.route}/`;
    sitemap += `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
  }
  sitemap += `</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), sitemap);
  console.log('  ✓ sitemap.xml');

  console.log(`\n  ── Complete: ${pages.length + 3} pages generated + sitemap — ready for Netlify ──\n`);
}

build().catch(err => { console.error('Build failed:', err); process.exit(1); });
