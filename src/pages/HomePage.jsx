import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { getActiveBatches } from '../services/api';
import { sizedImage, imageSrcSet } from '../utils/images';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&auto=format';

const DAY_MS = 24 * 60 * 60 * 1000;

const BATCH_STAGE_LABELS = {
  CONFIRMED: 'Booking orders now',
  QC_BATCHING: 'Being checked and packed',
  HIGH_SEAS: 'On the way to Ghana',
  CUSTOMS_CLEARANCE: 'Clearing customs',
  CUSTOMS_CLEARING: 'Clearing customs',
  ACCRA_HUB: 'Arrived in Accra',
  DELIVERY_READY: 'Out for delivery',
};

const formatShortDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Ghana runs on GMT all year, so "today's" deals end at the next UTC midnight.
const msUntilGhanaMidnight = () => DAY_MS - (Date.now() % DAY_MS);

const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(Math.floor(totalSeconds / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
};

// Turns a live batch record into the copy shown on the hero card.
const describeBatch = (batch) => {
  if (!batch) return null;
  const isSea = batch.type === 'SEA_FCL';
  const capacity = isSea ? batch.capacityCbm : batch.capacityKg;
  const allocated = isSea ? batch.allocatedCbm : batch.allocatedKg;
  const percentFull = capacity ? Math.min(100, Math.round((allocated / capacity) * 100)) : null;
  const daysToCutoff = batch.cutoffDate
    ? Math.round((Date.parse(`${batch.cutoffDate}T00:00:00Z`) - (Date.now() - (Date.now() % DAY_MS))) / DAY_MS)
    : null;
  const isOpen = daysToCutoff !== null && daysToCutoff >= 0;
  const from = (batch.originPort || 'China').split(',').pop().trim();

  if (isOpen) {
    return {
      isOpen: true,
      title: `Next ${isSea ? 'sea' : 'air'} shipment from ${from}`,
      status: `${percentFull !== null ? `${percentFull}% full · ` : ''}${daysToCutoff === 0 ? 'closes today' : `closes in ${daysToCutoff} day${daysToCutoff === 1 ? '' : 's'}`}`,
      progress: percentFull,
    };
  }
  return {
    isOpen: false,
    title: `Current ${isSea ? 'sea' : 'air'} shipment from ${from}`,
    status: `${BATCH_STAGE_LABELS[batch.status] || 'In transit'}${batch.eta ? ` · arriving around ${formatShortDate(batch.eta)}` : ''}`,
    progress: null,
  };
};

// Hard-coded until real customer reviews are added.
const TESTIMONIALS = [
  { quote: 'Ordered a commercial blender and kids sets to Kumasi. Packaged well and arrived at the VIP station within 24 hours.', name: 'Nana Ama S.', location: 'Kumasi' },
  { quote: 'Same-day delivery to East Legon. The dresses fit true to size and looked exactly like the photos.', name: 'Esi Mensah', location: 'Accra' },
  { quote: 'They replied on WhatsApp within minutes when I asked about mannequin sizes. Paying with MoMo was easy.', name: 'Kofi B.', location: 'Takoradi' },
];

export const HomePage = () => {
  const {
    navigate,
    setSelectedCategory,
    products,
    categories,
    WHATSAPP_NUMBER,
    setPreorderTermsOpen,
    setQuoteModalOpen,
    setReferralModalOpen
  } = useStore();
  const [moreFilter, setMoreFilter] = useState('all');
  const [activeBatch, setActiveBatch] = useState(null);
  const [dealsCountdown, setDealsCountdown] = useState(msUntilGhanaMidnight);

  useEffect(() => {
    let cancelled = false;
    getActiveBatches().then((batches) => {
      if (cancelled || !batches) return;
      // Prefer whichever batch is still taking orders; otherwise show the shipment in transit.
      const candidates = [batches.sea, batches.air].filter(Boolean);
      const open = candidates.find((b) => describeBatch(b)?.isOpen);
      setActiveBatch(open || batches.sea || batches.air || null);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDealsCountdown(msUntilGhanaMidnight()), 1000);
    return () => clearInterval(timer);
  }, []);

  const batchInfo = describeBatch(activeBatch);

  const openCategory = (slug) => {
    setSelectedCategory(slug);
    navigate('shop');
  };

  const discountOf = (p) => (p.originalPrice && p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0);

  // Each section shows different products so the store doesn't look like it repeats itself.
  const dealProducts = [...products].filter((p) => discountOf(p) > 0).sort((a, b) => discountOf(b) - discountOf(a)).slice(0, 5);
  const dealIds = new Set(dealProducts.map((p) => p.id));
  const maxDealPercent = Math.round(Math.max(0, ...products.map(discountOf)) * 100);

  const popularProducts = [...products]
    .filter((p) => !dealIds.has(p.id))
    .sort((a, b) => (b.reviewsCount || b.reviewCount || 0) - (a.reviewsCount || a.reviewCount || 0))
    .slice(0, 5);
  const shownAbove = new Set([...dealIds, ...popularProducts.map((p) => p.id)]);

  const matchesMoreFilter = (p) => {
    const cat = (p.category || '').toLowerCase();
    if (moreFilter === 'fashion') return cat.includes('wear');
    if (moreFilter === 'home') return cat.includes('appliance') || cat.includes('kitchen') || cat.includes('furniture');
    return true;
  };
  const moreProducts = [...products]
    .sort((a, b) => Number(shownAbove.has(a.id)) - Number(shownAbove.has(b.id)))
    .filter(matchesMoreFilter)
    .slice(0, 10);

  return (
    <div className="home">
      {/* Hero */}
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div>
            <h1 className="home-hero-title">
              See it. Send it.<br />
              <span>We'll source it.</span>
            </h1>
            <p className="home-hero-text">
              Clothes, kitchen appliances, mannequins and more — ordered from trusted overseas suppliers and delivered anywhere in Ghana.
            </p>
            <div className="home-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate('shop')}>
                Shop now <ArrowRight size={17} />
              </button>
              <button type="button" className="btn btn-outline btn-lg" onClick={() => setQuoteModalOpen(true)}>
                Request an item
              </button>
            </div>
            <p className="home-meta">Pay with MoMo or bank transfer · Customs included · Delivery anywhere in Ghana</p>

            {batchInfo && (
              <div className="shipment-card">
                <div className="shipment-card-row">
                  <strong>{batchInfo.title}</strong>
                  <span>{batchInfo.status}</span>
                </div>
                {batchInfo.progress !== null && (
                  <div className="shipment-bar" aria-hidden="true">
                    <div style={{ width: `${batchInfo.progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="home-hero-media">
            <img
              src={sizedImage(HERO_IMAGE, 900)}
              srcSet={imageSrcSet(HERO_IMAGE, [480, 720, 900, 1200])}
              sizes="(max-width: 900px) 100vw, 560px"
              alt="A customer paying for her order in a shop"
              width="900"
              height="600"
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </div>
      </section>

      {/* Ordering notice */}
      <section className="container">
        <button type="button" className="home-notice" onClick={() => setPreorderTermsOpen(true)}>
          <span>
            <strong>Before you order:</strong> pre-orders are paid in full, sea shipping takes 30–50 days and orders can't be changed once placed with the supplier.
          </span>
          <span className="home-notice-link">Read terms</span>
        </button>
      </section>

      {/* Categories */}
      <section className="container home-section">
        <div className="section-head">
          <h2>Shop by category</h2>
          <button type="button" className="section-head-link" onClick={() => navigate('categories')}>See all</button>
        </div>
        <div className="category-tiles">
          {categories.map((cat) => (
            <button type="button" key={cat.id} className="category-tile" onClick={() => openCategory(cat.slug)}>
              <SmartImage src={sizedImage(cat.image, 240)} alt="" width="120" height="120" loading="lazy" />
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Deals */}
      {dealProducts.length > 0 && (
        <section className="container home-section">
          <div className="section-head">
            <div>
              <h2>Today's deals</h2>
              <p className="section-head-sub">
                Up to {maxDealPercent}% off · ends in <span className="countdown">{formatCountdown(dealsCountdown)}</span>
              </p>
            </div>
            <button type="button" className="section-head-link" onClick={() => navigate('shop', { filter: 'deals' })}>See all deals</button>
          </div>
          <div className="products-grid">
            {dealProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* Popular */}
      {popularProducts.length > 0 && (
        <section className="container home-section">
          <div className="section-head">
            <h2>Popular right now</h2>
            <button type="button" className="section-head-link" onClick={() => navigate('shop')}>See all</button>
          </div>
          <div className="products-grid">
            {popularProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </section>
      )}

      {/* Custom orders + referrals */}
      <section className="container home-section home-banners">
        <div className="home-banner home-banner-dark">
          <h2>Can't find what you want?</h2>
          <p>Send us a link or photo from 1688, Taobao, Shein or Instagram. We'll buy it, handle customs and deliver it to you.</p>
          <div className="home-actions">
            <button type="button" className="btn btn-light" onClick={() => setQuoteModalOpen(true)}>Request an item</button>
            <a
              className="btn btn-outline-light"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I would like to request an item.')}`}
              target="_blank"
              rel="noreferrer"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
        <div className="home-banner">
          <h2>Give GH₵25, get GH₵25</h2>
          <p>Your friend gets GH₵25 off their first order. You get GH₵25 store credit when they pay.</p>
          <div className="home-actions">
            <button type="button" className="btn btn-primary" onClick={() => setReferralModalOpen(true)}>Get my invite link</button>
          </div>
        </div>
      </section>

      {/* More products */}
      <section className="container home-section">
        <div className="section-head">
          <h2>More products</h2>
          <div className="segmented segmented-inline" role="tablist">
            {[
              { id: 'all', label: 'All' },
              { id: 'fashion', label: 'Fashion' },
              { id: 'home', label: 'Home & kitchen' },
            ].map((tab) => (
              <button
                type="button"
                role="tab"
                key={tab.id}
                aria-selected={moreFilter === tab.id}
                className={moreFilter === tab.id ? 'active' : ''}
                onClick={() => setMoreFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="products-grid">
          {moreProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* Reviews */}
      <section className="container home-section">
        <div className="section-head">
          <h2>What customers say</h2>
        </div>
        <div className="review-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="review-quote">
              <blockquote>“{t.quote}”</blockquote>
              <figcaption>{t.name} · {t.location}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="container home-section">
        <div className="home-contact">
          <div>
            <h2>Have a question?</h2>
            <p>Ask about sizes, bulk orders or delivery. We reply on WhatsApp every day.</p>
          </div>
          <div className="home-actions">
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I have a question.')}`}
              target="_blank"
              rel="noreferrer"
            >
              Chat on WhatsApp
            </a>
            <button type="button" className="btn btn-outline" onClick={() => navigate('contact')}>Contact us</button>
          </div>
        </div>
      </section>
    </div>
  );
};
