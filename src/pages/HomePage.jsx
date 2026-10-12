import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { getActiveBatches } from '../services/api';
import { sizedImage, imageSrcSet } from '../utils/images';
import { ArrowRight } from 'lucide-react';
import { HiddenGem } from '../components/HiddenGem';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?fit=crop&auto=format';

const DAY_MS = 24 * 60 * 60 * 1000;

const BATCH_STAGE_LABELS = {
  CONFIRMED: 'Booking orders now',
  QC_BATCHING: 'Being checked and packed',
  HIGH_SEAS: 'On the way to Ghana',
  CUSTOMS_CLEARANCE: 'Clearing customs',
  CUSTOMS_CLEARING: 'Clearing customs',
  ACCRA_HUB: 'Arrived in Kumasi',
  DELIVERY_READY: 'Out for delivery',
};

const formatShortDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });


// "2d 04:15:09" or "04:15:09" — time left until a deal ends.
const formatCountdown = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const pad = (n) => String(n).padStart(2, '0');
  const days = Math.floor(totalSeconds / 86400);
  const clock = `${pad(Math.floor((totalSeconds % 86400) / 3600))}:${pad(Math.floor((totalSeconds % 3600) / 60))}:${pad(totalSeconds % 60)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
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


export const HomePage = () => {
  const {
    navigate,
    setSelectedCategory,
    products,
    categories,
    WHATSAPP_NUMBER,
    setPreorderTermsOpen,
    setQuoteModalOpen,
    setReferralModalOpen,
    reviews,
    catalogStatus
  } = useStore();
  const [moreFilter, setMoreFilter] = useState('all');
  const [activeBatch, setActiveBatch] = useState(null);
  const [now, setNow] = useState(Date.now());

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
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const batchInfo = describeBatch(activeBatch);

  // Only real reviews written by customers — the section stays hidden until there are some.
  const customerReviews = (reviews || [])
    .filter((r) => r.rating >= 4 && (r.comment || '').trim().length >= 20)
    .slice(0, 3);

  const openCategory = (slug) => {
    setSelectedCategory(slug);
    navigate('shop');
  };

  const discountOf = (p) => (p.originalPrice && p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0);

  // Each section shows different products so the store doesn't look like it repeats itself.
  // Deals set in Admin (with an end time) come first; otherwise show products that are simply on sale.
  const liveDeals = products.filter((p) => p.onDeal && p.dealEndsAt && new Date(p.dealEndsAt).getTime() > now);
  const hasLiveDeals = liveDeals.length > 0;
  const dealProducts = (hasLiveDeals ? liveDeals : products.filter((p) => discountOf(p) > 0))
    .sort((a, b) => discountOf(b) - discountOf(a))
    .slice(0, 10);
  const soonestDealEnd = hasLiveDeals ? Math.min(...liveDeals.map((p) => new Date(p.dealEndsAt).getTime())) : null;
  const dealIds = new Set(dealProducts.map((p) => p.id));
  const maxDealPercent = Math.round(Math.max(0, ...dealProducts.map(discountOf)) * 100);

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
              <HiddenGem spot="home-hero" />
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
          <h2>Shop by category <HiddenGem spot="home-categories" /></h2>
          <button type="button" className="section-head-link" onClick={() => navigate('categories')}>See all</button>
        </div>
        <div className="category-tiles">
          {catalogStatus === 'loading' && categories.length === 0 && [...Array(6)].map((_, i) => (
            <div key={i} className="category-tile is-loading" aria-hidden="true"><span className="skeleton-box" /><span className="skeleton-line" /></div>
          ))}
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
              <h2>{hasLiveDeals ? 'Deals' : 'On sale'}</h2>
              <p className="section-head-sub">
                Up to {maxDealPercent}% off{hasLiveDeals && <> · ends in <span className="countdown">{formatCountdown(soonestDealEnd - now)}</span></>}
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
        {catalogStatus === 'loading' && products.length === 0 ? (
          <div className="products-grid" aria-label="Loading products">
            {[...Array(5)].map((_, i) => <div key={i} className="pcard-skeleton" aria-hidden="true" />)}
          </div>
        ) : moreProducts.length > 0 ? (
          <div className="products-grid">
            {moreProducts.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <p className="empty-note">
            {catalogStatus === 'error' ? 'We couldn’t load products. Please refresh the page.' : 'New products are coming soon.'}
          </p>
        )}
      </section>

      {/* Reviews — real customer reviews only */}
      {customerReviews.length > 0 && (
        <section className="container home-section">
          <div className="section-head">
            <h2>What customers say</h2>
          </div>
          <div className="review-grid">
            {customerReviews.map((r) => (
              <figure key={r.id} className="review-quote">
                <blockquote>“{r.comment}”</blockquote>
                <figcaption>{r.userName}{r.userCity ? ` · ${r.userCity}` : ''}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

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
