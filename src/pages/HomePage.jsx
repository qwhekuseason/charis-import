import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { getActiveBatches } from '../services/api';
import { sizedImage } from '../utils/images';
import { ArrowRight, Search, Smartphone, ShieldCheck, Truck, ChevronLeft, ChevronRight, Plane, PackagePlus, Link2, Gift, MessageCircle, Clock } from 'lucide-react';
import './HomePage.css';
import { HiddenGem } from '../components/HiddenGem';

const DAY_MS = 24 * 60 * 60 * 1000;

// Where customers find things — scrolls past in the band under the hero.
const SOURCES = ['Shein', '1688', 'Alibaba', 'Taobao', 'TikTok Shop', 'Instagram', 'AliExpress'];

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

// Ticks on its own so the rest of the home page doesn't redraw every second.
const DealCountdown = ({ endsAt }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="countdown">{formatCountdown(endsAt - now)}</span>;
};

// A row of products that slides sideways (arrows on desktop, swipe on phones), so it never ends in a lone card.
const ProductRail = ({ products, onSeeAll, seeAllLabel, label, showMore = true }) => {
  const railRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const updateEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [products.length]);
  const scrollRail = (dir) => {
    const el = railRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  return (
    <div className="hm-rail-wrap">
      <button type="button" className="hm-rail-arrow is-prev" onClick={() => scrollRail(-1)} disabled={edges.start} aria-label={`Scroll ${label} back`}><ChevronLeft size={20} /></button>
      <div className="hm-rail" ref={railRef} onScroll={updateEdges} role="list" aria-label={label}>
        {products.map((product, i) => <div role="listitem" key={product.id} data-reveal style={{ '--i': Math.min(i, 5) }}><ProductCard product={product} /></div>)}
        {showMore && (
          <div role="listitem" data-reveal style={{ '--i': Math.min(products.length, 5) }}>
            <button type="button" className="hm-rail-more" onClick={onSeeAll}>
              <span className="hm-rail-more-icon"><ArrowRight size={20} /></span>
              {seeAllLabel}
            </button>
          </div>
        )}
      </div>
      <button type="button" className="hm-rail-arrow is-next" onClick={() => scrollRail(1)} disabled={edges.end} aria-label={`Scroll ${label} forward`}><ChevronRight size={20} /></button>
    </div>
  );
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
    catalogStatus,
    setSearchQuery
  } = useStore();
  const [moreFilter, setMoreFilter] = useState('all');
  const [activeBatch, setActiveBatch] = useState(null);
  const [heroSearch, setHeroSearch] = useState('');
  const homeRef = useRef(null);

  // Sections fade up as they scroll into view. Skipped for people who ask their device for less motion,
  // and nothing is hidden unless this runs, so the page never ends up blank.
  useEffect(() => {
    const root = homeRef.current;
    if (!root || !('IntersectionObserver' in window)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    root.classList.add('hm-animate');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const watch = () => root.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => io.observe(el));
    watch();
    // Products arrive after the first paint — watch them too.
    const mo = new MutationObserver(watch);
    mo.observe(root, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  // Desktop: the hero photos drift a little with the mouse, each at its own depth.
  const onHeroPointer = (e) => {
    if (e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', ((e.clientX - box.left) / box.width - 0.5).toFixed(3));
    e.currentTarget.style.setProperty('--my', ((e.clientY - box.top) / box.height - 0.5).toFixed(3));
  };
  const resetHeroPointer = (e) => {
    e.currentTarget.style.setProperty('--mx', '0');
    e.currentTarget.style.setProperty('--my', '0');
  };
  const now = Date.now();

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

  const batchInfo = describeBatch(activeBatch);

  // Only real reviews written by customers — the section stays hidden until there are some.
  const customerReviews = (reviews || [])
    .filter((r) => r.rating >= 4 && (r.comment || '').trim().length >= 20)
    .slice(0, 3);

  const runSearch = (e) => {
    e.preventDefault();
    setSearchQuery(heroSearch.trim());
    setSelectedCategory('all');
    navigate('shop');
  };

  const openCategory = (slug) => {
    setSelectedCategory(slug);
    navigate('shop');
  };

  const discountOf = (p) => (p.originalPrice && p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0);

  // Each section shows different products so the store doesn't look like it repeats itself.
  // Deals set in Admin (with an end time) come first; otherwise show products that are simply on sale.
  const liveDeals = products.filter((p) => p.onDeal && p.dealEndsAt && new Date(p.dealEndsAt).getTime() > now);
  const hasLiveDeals = liveDeals.length > 0;
  // Timed deals first, topped up with other discounted products so the row is never half empty.
  const byDiscount = (a, b) => discountOf(b) - discountOf(a);
  const liveDealIds = new Set(liveDeals.map((p) => p.id));
  const dealProducts = [
    ...[...liveDeals].sort(byDiscount),
    ...products.filter((p) => !liveDealIds.has(p.id) && discountOf(p) > 0).sort(byDiscount),
  ].slice(0, 10);
  const soonestDealEnd = hasLiveDeals ? Math.min(...liveDeals.map((p) => new Date(p.dealEndsAt).getTime())) : null;
  const dealIds = new Set(dealProducts.map((p) => p.id));
  const maxDealPercent = Math.round(Math.max(0, ...dealProducts.map(discountOf)) * 100);

  const popularProducts = [...products]
    .filter((p) => !dealIds.has(p.id))
    .sort((a, b) => (b.reviewsCount || b.reviewCount || 0) - (a.reviewsCount || a.reviewCount || 0))
    .slice(0, 8);
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
    .slice(0, 8);

  // Four category photos make the hero picture — real products, not a stock photo.
  const heroCategories = categories.filter((c) => c.image).slice(0, 4);
  const tileCategories = categories.slice(0, 7);

  return (
    <div className="home hm" ref={homeRef}>
      {/* Hero — ink, like the logo */}
      <section className="hm-hero" onPointerMove={onHeroPointer} onPointerLeave={resetHeroPointer}>
        {/* A plane flies a gold route across the hero, like the one circling the logo */}
        <svg className="hm-flight" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          <path id="hm-route" className="hm-flight-route" d="M -60 560 C 220 520 360 300 600 260 S 980 120 1260 -40" />
          <g className="hm-flight-plane">
            <path d="M14 0 L-6 -3.2 L-10 -12 L-14 -12 L-10 -2.6 L-16 -2 L-19 -6 L-21 -6 L-19.5 0 L-21 6 L-19 6 L-16 2 L-10 2.6 L-14 12 L-10 12 L-6 3.2 Z" />
            <animateMotion dur="14s" repeatCount="indefinite" rotate="auto" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
              <mpath href="#hm-route" />
            </animateMotion>
          </g>
        </svg>
        <div className="container hm-hero-grid">
          <div className="hm-hero-copy">
            <span className="hm-eyebrow"><Plane size={14} aria-hidden="true" /> Direct imports, delivered across Ghana</span>
            <h1 className="hm-hero-title">
              <span className="hm-line"><span>See it. Send it.</span></span>
              <span className="hm-line"><em>We'll source it.</em></span>
              <HiddenGem spot="home-hero" />
            </h1>
            <p className="hm-hero-text">
              Clothes, kitchen appliances, mannequins and more — bought from trusted overseas suppliers, checked, and delivered to your door.
            </p>
            <form className="hm-search" role="search" onSubmit={runSearch}>
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                enterKeyHint="search"
                placeholder="Search air fryers, dresses, mannequins…"
                aria-label="Search products"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-gold">Search</button>
            </form>
            <div className="hm-hero-actions">
              <button type="button" className="btn btn-gold btn-lg" onClick={() => navigate('shop')}>
                Shop now <ArrowRight size={17} />
              </button>
              <button type="button" className="btn hm-btn-ghost btn-lg" onClick={() => setQuoteModalOpen(true)}>
                <PackagePlus size={17} /> Request an item
              </button>
            </div>
            <ul className="hm-trust">
              <li><Smartphone size={15} aria-hidden="true" /> Pay with MoMo</li>
              <li><ShieldCheck size={15} aria-hidden="true" /> Customs included</li>
              <li><Truck size={15} aria-hidden="true" /> Delivery across Ghana</li>
            </ul>
          </div>

          <div className="hm-hero-visual">
            {heroCategories.length === 4 ? (
              <div className="hm-mosaic">
                {heroCategories.map((cat, i) => (
                  <button type="button" key={cat.id} className={`hm-mosaic-tile is-${i}`} onClick={() => openCategory(cat.slug)}>
                    <SmartImage src={sizedImage(cat.image, i === 0 ? 640 : 360)} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                    <span>{cat.name} <ArrowRight size={14} aria-hidden="true" /></span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="hm-mosaic is-empty" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => <span key={i} className={`hm-mosaic-tile is-${i}`} />)}
              </div>
            )}
            {batchInfo && (
              <div className="hm-shipment">
                <span className="hm-shipment-icon"><Plane size={16} aria-hidden="true" /></span>
                <div className="hm-shipment-text">
                  <strong>{batchInfo.title}</strong>
                  <span>{batchInfo.status}</span>
                  {batchInfo.progress !== null && (
                    <span className="hm-shipment-bar" aria-hidden="true"><span style={{ width: `${batchInfo.progress}%` }} /></span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it works — replaces the small-print notice */}
      <section className="container hm-how" aria-labelledby="hm-how-title">
        <h2 id="hm-how-title" className="sr-only">How ordering works</h2>
        <ol className="hm-how-steps" data-reveal>
          <li>
            <span className="hm-how-num">1</span>
            <div>
              <strong>Pick it or send a link</strong>
              <span>Shop here, or send a link or photo from 1688, Shein, TikTok or Instagram.</span>
            </div>
          </li>
          <li>
            <span className="hm-how-num">2</span>
            <div>
              <strong>Pay in full by MoMo</strong>
              <span>The price is fixed in cedis, and customs is included.</span>
            </div>
          </li>
          <li>
            <span className="hm-how-num">3</span>
            <div>
              <strong>We ship and deliver</strong>
              <span>Sea 35–45 working days, air 7–12. Track it here all the way.</span>
            </div>
          </li>
        </ol>
        <button type="button" className="hm-how-terms" onClick={() => setPreorderTermsOpen(true)}>
          <Clock size={14} aria-hidden="true" /> <span>Pre-orders can't be changed once placed with the supplier — <u>read the terms</u></span>
        </button>
      </section>

      {/* Where customers find things — a slow ticker */}
      <section className="hm-ticker" aria-label="Where we can buy from">
        <div className="hm-ticker-track">
          {[0, 1].map((copy) => (
            <div className="hm-ticker-group" key={copy} aria-hidden={copy === 1 ? 'true' : undefined}>
              <span className="hm-ticker-lead">We buy from</span>
              {SOURCES.map((name) => (
                <span key={name} className="hm-ticker-item">{name}<i aria-hidden="true">✦</i></span>
              ))}
              <span className="hm-ticker-lead">and deliver across Ghana</span>
              <i className="hm-ticker-sep" aria-hidden="true">✦</i>
            </div>
          ))}
        </div>
      </section>

      {/* Categories — one tidy row of tiles; the last one opens the full list */}
      <section className="container home-section">
        <div className="hm-head" data-reveal>
          <h2>Shop by category <HiddenGem spot="home-categories" /></h2>
          <button type="button" className="hm-head-link" onClick={() => navigate('categories')}>All categories <ArrowRight size={15} /></button>
        </div>
        <div className="hm-cats">
          {catalogStatus === 'loading' && categories.length === 0 && [...Array(8)].map((_, i) => (
            <div key={i} className="hm-cat is-loading" aria-hidden="true"><span className="hm-cat-img" /><span className="hm-cat-name">&nbsp;</span></div>
          ))}
          {tileCategories.map((cat, i) => (
            <button type="button" key={cat.id} className="hm-cat" data-reveal style={{ '--i': i }} onClick={() => openCategory(cat.slug)}>
              <span className="hm-cat-img"><SmartImage src={sizedImage(cat.image, 240)} alt="" width="120" height="120" loading="lazy" /></span>
              <span className="hm-cat-name">{cat.name}</span>
            </button>
          ))}
          {categories.length > tileCategories.length && (
            <button type="button" className="hm-cat is-more" data-reveal style={{ '--i': tileCategories.length }} onClick={() => navigate('categories')}>
              <span className="hm-cat-img"><span>+{categories.length - tileCategories.length}</span></span>
              <span className="hm-cat-name">More</span>
            </button>
          )}
        </div>
      </section>

      {/* Deals — an ink panel with the countdown, beside the deal products */}
      {dealProducts.length > 0 && (
        <section className="container home-section">
          <div className="hm-deals" data-reveal>
            <div className="hm-deals-intro">
              <span className="hm-eyebrow">{hasLiveDeals ? 'Limited time' : 'Price drops'}</span>
              <h2>{hasLiveDeals ? 'Deals' : 'On sale'}</h2>
              <p>Up to <strong>{maxDealPercent}% off</strong> selected items.</p>
              {hasLiveDeals && (
                <div className="hm-countdown"><Clock size={15} aria-hidden="true" /> Ends in <DealCountdown endsAt={soonestDealEnd} /></div>
              )}
              <button type="button" className="btn btn-gold" onClick={() => navigate('shop', { filter: 'deals' })}>
                See all deals <ArrowRight size={16} />
              </button>
            </div>
            <div className="hm-deals-products">
              <ProductRail products={dealProducts} label="Deals" showMore={false} onSeeAll={() => navigate('shop', { filter: 'deals' })} seeAllLabel="See all deals" />
            </div>
          </div>
        </section>
      )}

      {/* Popular */}
      {popularProducts.length > 0 && (
        <section className="container home-section">
          <div className="hm-head" data-reveal>
            <h2>Popular right now</h2>
            <button type="button" className="hm-head-link" onClick={() => navigate('shop')}>See all <ArrowRight size={15} /></button>
          </div>
          <ProductRail products={popularProducts} label="Popular products" onSeeAll={() => navigate('shop')} seeAllLabel="See all products" />
        </section>
      )}

      {/* Request an item + invite a friend */}
      <section className="container home-section hm-promos">
        <div className="hm-promo is-ink" data-reveal>
          <span className="hm-promo-icon"><Link2 size={20} aria-hidden="true" /></span>
          <h2>Can't find what you want?</h2>
          <p>Send us a link or photo from 1688, Taobao, Shein or Instagram. We'll buy it, clear customs and deliver it to you.</p>
          <div className="hm-promo-actions">
            <button type="button" className="btn btn-gold" onClick={() => setQuoteModalOpen(true)}>Request an item</button>
            <a
              className="btn hm-btn-ghost"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I would like to request an item.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Ask on WhatsApp
            </a>
          </div>
        </div>
        <div className="hm-promo is-gold" data-reveal style={{ '--i': 1 }}>
          <span className="hm-promo-icon"><Gift size={20} aria-hidden="true" /></span>
          <h2>Give GH₵25, get GH₵25</h2>
          <p>Your friend gets GH₵25 off their first order. You get GH₵25 store credit when they pay.</p>
          <div className="hm-promo-actions">
            <button type="button" className="btn btn-primary" onClick={() => setReferralModalOpen(true)}>Get my invite link</button>
          </div>
        </div>
      </section>

      {/* More products */}
      <section className="container home-section">
        <div className="hm-head" data-reveal>
          <h2>More to explore</h2>
          <div className="hm-chips" role="tablist" aria-label="Filter products">
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
                className={moreFilter === tab.id ? 'is-active' : ''}
                onClick={() => setMoreFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        {catalogStatus === 'loading' && products.length === 0 ? (
          <div className="products-grid hm-grid" aria-label="Loading products">
            {[...Array(8)].map((_, i) => <div key={i} className="pcard-skeleton" aria-hidden="true" />)}
          </div>
        ) : moreProducts.length > 0 ? (
          <>
            <div className="products-grid hm-grid">
              {moreProducts.map((product, i) => (
                <div key={product.id} className="hm-grid-item" data-reveal style={{ '--i': i % 4 }}><ProductCard product={product} /></div>
              ))}
            </div>
            {products.length > moreProducts.length && (
              <div className="hm-more">
                <button type="button" className="btn btn-outline btn-lg" onClick={() => navigate('shop')}>
                  Browse all {products.length} products <ArrowRight size={17} />
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="empty-note">
            {catalogStatus === 'error' ? 'We couldn’t load products. Please refresh the page.' : 'New products are coming soon.'}
          </p>
        )}
      </section>

      {/* Reviews — real customer reviews only */}
      {customerReviews.length > 0 && (
        <section className="container home-section">
          <div className="hm-head" data-reveal>
            <h2>What customers say</h2>
          </div>
          <div className="hm-reviews">
            {customerReviews.map((r) => (
              <figure key={r.id} className="hm-review" data-reveal>
                <span className="hm-review-stars" aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(Math.round(r.rating))}</span>
                <blockquote>“{r.comment}”</blockquote>
                <figcaption>{r.userName}{r.userCity ? ` · ${r.userCity}` : ''}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="container home-section">
        <div className="hm-contact" data-reveal>
          <div>
            <h2>Have a question?</h2>
            <p>Ask about sizes, bulk orders or delivery. We reply on WhatsApp every day.</p>
          </div>
          <div className="hm-promo-actions">
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I have a question.')}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
            <button type="button" className="btn btn-outline" onClick={() => navigate('contact')}>Contact us</button>
          </div>
        </div>
      </section>
    </div>
  );
};
