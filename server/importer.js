// "Import from link": reads a supplier's product page and pulls out the name, photos,
// description and price, so the admin gets a draft to check instead of typing it all in.
//
// Safety: only the admin can use this, but a tool that fetches any URL can still be abused to
// make the server visit private addresses (its own admin ports, cloud metadata, the local network).
// So every connection — including each redirect — is checked against the address it actually
// connects to, and only public internet addresses on the normal web ports are allowed.
import http from 'http';
import https from 'https';
import dns from 'dns';
import net from 'net';

const USER_AGENT = 'Mozilla/5.0 (compatible; CHARI-ProductImport/1.0; +https://charis-import.onrender.com)';
const PAGE_LIMIT = 3 * 1024 * 1024; // 3 MB of HTML is plenty for a product page
const IMAGE_LIMIT = 10 * 1024 * 1024;
const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 4;

// Sites that only show product details to signed-in app users. We don't try to get around that:
// the draft keeps the link and the admin fills in the details.
const LOGIN_ONLY_SITES = [
  { match: /(^|\.)(yangkeduo|pinduoduo)\.com$/, name: 'Pinduoduo' },
  { match: /(^|\.)1688\.com$/, name: '1688' },
  { match: /(^|\.)(taobao|tmall)\.com$/, name: 'Taobao' },
];
const SITE_NAMES = [
  [/(^|\.)alibaba\.com$/, 'Alibaba'], [/(^|\.)aliexpress\.(com|us)$/, 'AliExpress'], [/(^|\.)amazon\./, 'Amazon'],
  [/(^|\.)shein\./, 'Shein'], [/(^|\.)trendyol\.com$/, 'Trendyol'], [/(^|\.)noon\.com$/, 'Noon'], [/(^|\.)temu\.com$/, 'Temu'],
];
export const siteNameOf = (host) => {
  const h = String(host || '').toLowerCase();
  return LOGIN_ONLY_SITES.find((s) => s.match.test(h))?.name
    || SITE_NAMES.find(([re]) => re.test(h))?.[1]
    || h.replace(/^(www|m|mobile)\./, '');
};

// ---- Address checks --------------------------------------------------------
const ipv4ToInt = (ip) => ip.split('.').reduce((n, part) => (n << 8) + Number(part), 0) >>> 0;
const inV4 = (ip, base, bits) => (ipv4ToInt(ip) >>> (32 - bits)) === (ipv4ToInt(base) >>> (32 - bits));
const PRIVATE_V4 = [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12],
  ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
];
export const isPublicAddress = (ip) => {
  if (net.isIPv4(ip)) return !PRIVATE_V4.some(([base, bits]) => inV4(ip, base, bits));
  if (net.isIPv6(ip)) {
    const a = ip.toLowerCase();
    const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]);
    if (a === '::' || a === '::1') return false;
    // Unique-local (fc00::/7), link-local (fe80::/10), multicast (ff00::/8), documentation (2001:db8::/32), 6to4/NAT64 helpers.
    return !/^(f[cd]|fe[89ab]|ff|2001:db8|64:ff9b|2002:)/.test(a);
  }
  return false;
};

// DNS lookup used for every connection: refuses names that point at private addresses.
// Checking here (not just before the request) also stops "DNS rebinding" tricks.
const safeLookup = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
    if (err) return callback(err);
    const list = Array.isArray(addresses) ? addresses : [{ address: addresses, family: options.family || 4 }];
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (bad || list.length === 0) return callback(Object.assign(new Error('That address is not allowed.'), { code: 'BLOCKED_ADDRESS' }));
    if (options.all) return callback(null, list);
    return callback(null, list[0].address, list[0].family);
  });
};

const checkUrl = (raw) => {
  let url;
  try { url = new URL(raw); } catch { throw Object.assign(new Error('That is not a valid link.'), { code: 'BAD_URL' }); }
  if (!['http:', 'https:'].includes(url.protocol)) throw Object.assign(new Error('Only web links (https://…) can be imported.'), { code: 'BAD_URL' });
  if (url.username || url.password) throw Object.assign(new Error('Links with a username or password are not allowed.'), { code: 'BAD_URL' });
  if (url.port && !['80', '443'].includes(url.port)) throw Object.assign(new Error('That link uses an unusual port.'), { code: 'BAD_URL' });
  if (net.isIP(url.hostname.replace(/^\[|\]$/g, '')) && !isPublicAddress(url.hostname.replace(/^\[|\]$/g, ''))) {
    throw Object.assign(new Error('That address is not allowed.'), { code: 'BLOCKED_ADDRESS' });
  }
  return url;
};

// GET a public URL, following a few redirects (each one checked again). Returns { url, type, body }.
export const fetchPublic = (raw, { limit = PAGE_LIMIT, accept = 'text/html,application/xhtml+xml', redirects = 0 } = {}) => new Promise((resolve, reject) => {
  let url;
  try { url = checkUrl(raw); } catch (e) { reject(e); return; }
  const lib = url.protocol === 'https:' ? https : http;
  const req = lib.get(url, {
    lookup: safeLookup,
    timeout: TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'en-GB,en;q=0.9' },
  }, (res) => {
    const { statusCode = 0, headers } = res;
    if (statusCode >= 300 && statusCode < 400 && headers.location) {
      res.resume();
      if (redirects >= MAX_REDIRECTS) { reject(new Error('The link redirected too many times.')); return; }
      fetchPublic(new URL(headers.location, url).toString(), { limit, accept, redirects: redirects + 1 }).then(resolve, reject);
      return;
    }
    if (statusCode >= 400) { res.resume(); reject(Object.assign(new Error(`The site answered ${statusCode}.`), { code: 'HTTP_ERROR', status: statusCode })); return; }
    const chunks = [];
    let size = 0;
    res.on('data', (c) => {
      size += c.length;
      if (size > limit) { req.destroy(Object.assign(new Error('The page is too large.'), { code: 'TOO_LARGE' })); return; }
      chunks.push(c);
    });
    res.on('end', () => resolve({ url: url.toString(), type: String(headers['content-type'] || ''), body: Buffer.concat(chunks) }));
    res.on('error', reject);
  });
  req.on('timeout', () => req.destroy(Object.assign(new Error('The site took too long to answer.'), { code: 'TIMEOUT' })));
  req.on('error', reject);
});

// Download a photo for copying into our own storage (only real images, size-capped).
export const fetchImage = async (raw) => {
  const { type, body } = await fetchPublic(raw, { limit: IMAGE_LIMIT, accept: 'image/avif,image/webp,image/png,image/jpeg,image/*' });
  if (!/^image\/(jpeg|png|webp|gif|avif)/i.test(type)) throw new Error('That link is not a photo.');
  return body;
};

// ---- Reading the page ------------------------------------------------------
const decodeEntities = (s) => String(s || '')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');
const clean = (s, max) => decodeEntities(String(s || '').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, max);

const metaTags = (html) => {
  const out = {};
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const key = (tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i) || [])[1];
    const value = (tag.match(/\bcontent\s*=\s*"([^"]*)"/i) || tag.match(/\bcontent\s*=\s*'([^']*)'/i) || [])[1];
    if (!key || value === undefined) continue;
    const k = key.toLowerCase();
    (out[k] ||= []).push(decodeEntities(value).trim());
  }
  return out;
};

// Product data that shops publish for Google (schema.org JSON-LD).
const jsonLdProducts = (html) => {
  const found = [];
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    const type = [].concat(node['@type'] || []).map(String);
    if (type.some((t) => /^(Product|ProductGroup|IndividualProduct)$/i.test(t))) found.push(node);
    if (node['@graph']) visit(node['@graph']);
    if (node.mainEntity) visit(node.mainEntity);
  };
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { visit(JSON.parse(m[1].trim())); } catch { /* skip broken blocks */ }
  }
  return found;
};

const imageList = (value) => [].concat(value || []).flatMap((v) => (typeof v === 'string' ? [v] : v?.url ? [v.url] : v?.contentUrl ? [v.contentUrl] : []));

const priceOf = (offers) => {
  for (const o of [].concat(offers || [])) {
    const nested = o?.offers ? priceOf(o.offers) : null;
    if (nested) return nested;
    const amount = Number(String(o?.price ?? o?.lowPrice ?? o?.priceSpecification?.price ?? '').replace(/[^\d.]/g, ''));
    if (Number.isFinite(amount) && amount > 0) return { amount, currency: String(o?.priceCurrency || o?.priceSpecification?.priceCurrency || '').toUpperCase().slice(0, 3) || null };
  }
  return null;
};

// Sizes/colours from a ProductGroup's variants, when the shop lists them.
const optionsOf = (product) => {
  const variants = [].concat(product?.hasVariant || []);
  const pick = (key) => [...new Set(variants.map((v) => clean(v?.[key], 40)).filter(Boolean))].slice(0, 30);
  return [['Size', pick('size')], ['Colour', pick('color')]].filter(([, values]) => values.length > 1).map(([name, values]) => ({ name, values }));
};

const absolute = (u, base) => { try { const url = new URL(u, base); return /^https?:$/.test(url.protocol) ? url.toString() : null; } catch { return null; } };

// Pull what we can out of a product page.
export const parseProductPage = (html, pageUrl) => {
  const meta = metaTags(html);
  const first = (k) => meta[k]?.find(Boolean) || '';
  const ld = jsonLdProducts(html)[0] || {};
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];

  const name = clean(ld.name || first('og:title') || first('twitter:title') || title, 120);
  const description = clean(ld.description || first('og:description') || first('description') || first('twitter:description'), 2000);
  const images = [...new Set([...imageList(ld.image), ...(meta['og:image'] || []), ...(meta['og:image:url'] || []), ...(meta['og:image:secure_url'] || []), first('twitter:image')]
    .filter(Boolean).map((u) => absolute(u, pageUrl)).filter(Boolean))].slice(0, 8);
  let price = priceOf(ld.offers);
  if (!price) {
    const amount = Number(String(first('product:price:amount') || first('og:price:amount') || first('price')).replace(/[^\d.]/g, ''));
    if (amount > 0) price = { amount, currency: (first('product:price:currency') || first('og:price:currency') || first('pricecurrency')).toUpperCase().slice(0, 3) || null };
  }
  const specs = [];
  const brand = clean(typeof ld.brand === 'string' ? ld.brand : ld.brand?.name, 120);
  if (brand) specs.push({ label: 'Brand', value: brand });
  const material = clean(ld.material, 120);
  if (material) specs.push({ label: 'Material', value: material });
  return { name, description, images, price, specs, options: optionsOf(ld) };
};

// ---- One link → one draft --------------------------------------------------
// The admin can paste plain links, or the text an app's "Share" button copies
// ("【Pinduoduo】Women's summer dress https://…") — the words before the link become the name.
export const splitPastedLinks = (text) => String(text || '').split(/\r?\n/)
  .map((line) => {
    const url = (line.match(/https?:\/\/[^\s<>"'，。]+/i) || [])[0];
    if (!url) return null;
    const hint = clean(line.replace(url, '').replace(/[【】[\]]/g, ' ').replace(/^\s*(pinduoduo|拼多多|taobao|淘宝|1688)\s*/i, ''), 120);
    return { url, hint };
  })
  .filter(Boolean);

const tidyName = (name, site) => name
  .replace(new RegExp(`\\s*[|\\-–—:]\\s*${site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`, 'i'), '')
  .replace(/\s*[|–—]\s*(Amazon\.[a-z.]+|AliExpress|Alibaba\.com|SHEIN.*|Trendyol)\s*$/i, '')
  .trim();

export const importLink = async ({ url: raw, hint }) => {
  const url = checkUrl(raw);
  const site = siteNameOf(url.hostname);
  const base = { sourceUrl: url.toString(), sourceSite: site, name: hint || '', description: '', images: [], sourcePrice: null, sourceCurrency: null, specs: [], options: [] };

  if (LOGIN_ONLY_SITES.some((s) => s.match.test(url.hostname.toLowerCase()))) {
    return { ...base, status: 'NEEDS_INFO', note: `${site} only shows product details inside its app, so fill these in from the listing.` };
  }
  try {
    const page = await fetchPublic(url.toString());
    if (!/html|xml/i.test(page.type)) return { ...base, status: 'NEEDS_INFO', note: 'That link isn\'t a product page.' };
    const found = parseProductPage(page.body.toString('utf8'), page.url);
    const draft = {
      ...base,
      name: tidyName(found.name, site) || base.name,
      description: found.description,
      images: found.images,
      sourcePrice: found.price?.amount ?? null,
      sourceCurrency: found.price?.currency ?? null,
      specs: found.specs,
      options: found.options,
    };
    const missing = [!draft.name && 'name', !draft.images.length && 'photos', draft.sourcePrice == null && 'price'].filter(Boolean);
    return { ...draft, status: missing.length ? 'NEEDS_INFO' : 'READY', note: missing.length ? `Couldn't find the ${missing.join(', ')} — please add ${missing.length > 1 ? 'them' : 'it'}.` : null };
  } catch (err) {
    const why = err.code === 'TIMEOUT' ? 'the site took too long to answer'
      : err.status === 403 || err.status === 429 || err.status === 503 ? `${site} blocked the automatic visit`
      : err.code === 'BLOCKED_ADDRESS' || err.code === 'BAD_URL' ? err.message.replace(/\.$/, '').toLowerCase()
      : 'the page couldn\'t be read';
    return { ...base, status: 'NEEDS_INFO', note: `Couldn't fetch it (${why}). Fill in the details from the listing.` };
  }
};

// Supplier price → suggested shop price in cedis, using the admin's rates and markup.
export const suggestPrice = (amount, currency, pricing) => {
  if (!(amount > 0)) return null;
  const rate = currency === 'GHS' ? 1 : Number(pricing?.rates?.[currency || pricing?.defaultCurrency || '']);
  if (!(rate > 0)) return null;
  const markup = Number(pricing?.markupPercent) || 0;
  const extra = Number(pricing?.addFixed) || 0;
  return Math.ceil(amount * rate * (1 + markup / 100) + extra);
};
