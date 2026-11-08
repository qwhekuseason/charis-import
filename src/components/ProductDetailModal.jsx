import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { productCategorySlug } from '../utils/categories';
import { HiddenGem } from './HiddenGem';
import { SmartImage } from './SmartImage';
import { productOptions, selectionComplete, cleanSelection } from '../utils/options';
import './ProductDetailModal.css';
import {
  X,
  ShoppingBag,
  Heart,
  MessageCircle,
  Truck,
  ShieldCheck,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Ship,
  Plane,
  Check,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Lock,
  Clock
} from 'lucide-react';

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;

// "2 days", "5 hrs", "20 min"
const timeLeft = (endsAt) => {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (!(ms > 0)) return null;
  const hours = ms / 3600000;
  if (hours >= 36) return `${Math.round(hours / 24)} days`;
  if (hours >= 1) return `${Math.floor(hours)} hr${Math.floor(hours) === 1 ? '' : 's'}`;
  return `${Math.max(1, Math.floor(ms / 60000))} min`;
};

// Delivery choices (same as checkout). Shipping costs differ by item, so no prices here — the team confirms them.
const DELIVERY_OPTIONS = [
  { icon: Ship, name: 'Sea shipping', time: '35–45 working days', note: 'Usually cheapest. Best for heavy or bulk items.' },
  { icon: Plane, name: 'Air shipping', time: '7–12 working days', note: 'Faster, for urgent orders.' },
  { icon: Truck, name: 'Local delivery (Kumasi)', time: '1–2 working days', note: 'For items already in stock in Kumasi.' },
];

const Stars = ({ value, size = 14 }) => (
  <span className="pd-stars" aria-hidden="true">
    {[0, 1, 2, 3, 4].map((i) => (
      <Star key={i} size={size} fill={i < Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </span>
);

export const ProductDetailModal = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    getWhatsAppOrderLink,
    navigate,
    products,
    addReview,
    getReviewsForProduct,
    user,
    openAuth,
    WHATSAPP_NUMBER
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'delivery' | 'reviews'
  const [added, setAdded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [userReview, setUserReview] = useState({ title: '', comment: '', rating: 5 });
  const [postingReview, setPostingReview] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(false);
  const [selected, setSelected] = useState({}); // the buyer's choices, e.g. { Size: 'M' }
  const [optionError, setOptionError] = useState(false);
  const scrollRef = useRef(null);
  const optionsRef = useRef(null);
  const trackRef = useRef(null);
  const tabsRef = useRef(null);

  const close = () => setSelectedProduct(null);

  // Fresh start whenever a different product opens (including from "You may also like").
  useEffect(() => {
    if (!selectedProduct) return;
    setQuantity(1);
    setSelected({});
    setOptionError(false);
    setActiveImageIndex(0);
    setActiveTab('details');
    setAdded(false);
    setSubmittedReview(false);
    setShowReviewForm(false);
    setUserReview({ title: '', comment: '', rating: 5 });
    scrollRef.current?.scrollTo({ top: 0 });
    trackRef.current?.scrollTo({ left: 0 });
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!added) return undefined;
    const t = setTimeout(() => setAdded(false), 1800);
    return () => clearTimeout(t);
  }, [added]);

  const images = selectedProduct
    ? (selectedProduct.images?.length ? selectedProduct.images : selectedProduct.image ? [selectedProduct.image] : [])
    : [];

  const showImage = (index) => {
    const next = (index + images.length) % images.length;
    setActiveImageIndex(next);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
  };

  // Left / right arrow keys flip through photos (but not while typing a review).
  useEffect(() => {
    if (images.length < 2) return undefined;
    const onKey = (e) => {
      if (/input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight') showImage(activeImageIndex + 1);
      if (e.key === 'ArrowLeft') showImage(activeImageIndex - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!selectedProduct) return null;

  const product = selectedProduct;
  const isFavorited = isInWishlist(product.id);
  const soldOut = product.inStock === false;
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const dealLeft = product.onDeal && product.dealEndsAt ? timeLeft(product.dealEndsAt) : null;
  const label = soldOut ? { text: 'Out of stock', tone: 'muted' }
    : product.onDeal ? { text: 'Deal', tone: 'deal' }
    : product.justLanded ? { text: 'New', tone: 'new' }
    : null;
  const totalCost = product.price * quantity;
  const reviews = getReviewsForProduct(product.id);
  const reviewCount = reviews.length || product.reviewCount || 0;
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : Number(product.rating) || 0;

  const changeQty = (delta) => setQuantity((q) => Math.min(999, Math.max(1, q + delta)));

  const options = productOptions(product);
  const missing = options.find((o) => !o.values.includes(selected[o.name]));
  const choose = (name, value) => {
    setSelected((prev) => ({ ...prev, [name]: value }));
    setOptionError(false);
  };
  // Every choice must be made first; if not, point the buyer at the one that's missing.
  const readyToAdd = () => {
    if (selectionComplete(product, selected)) return true;
    setOptionError(true);
    optionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  };

  const handleAddToCart = () => {
    if (!readyToAdd()) return;
    addToCart(product, quantity, cleanSelection(product, selected));
    setAdded(true);
  };

  const handleBuyNow = () => {
    if (!readyToAdd()) return;
    addToCart(product, quantity, cleanSelection(product, selected));
    close();
    navigate('checkout');
  };

  const onTrackScroll = (e) => {
    const { scrollLeft, clientWidth } = e.currentTarget;
    const index = Math.round(scrollLeft / Math.max(1, clientWidth));
    if (index !== activeImageIndex) setActiveImageIndex(index);
  };

  const openReviews = () => {
    setActiveTab('reviews');
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!userReview.comment.trim() || postingReview) return;
    setPostingReview(true);
    const saved = await addReview(product.id, { ...userReview, userName: user?.name, userCity: user?.city });
    setPostingReview(false);
    if (!saved) return;
    setSubmittedReview(true);
    setShowReviewForm(false);
    setUserReview({ title: '', comment: '', rating: 5 });
  };

  const relatedProducts = (products || [])
    .filter((p) => productCategorySlug(p) === productCategorySlug(product) && p.id !== product.id)
    .slice(0, 4);

  const backInStockLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello CHARI, please let me know when "${product.name}" is back in stock.`)}`;

  const qtyStepper = (
    <div className="pd-qty" role="group" aria-label="Quantity">
      <button type="button" onClick={() => changeQty(-1)} disabled={quantity <= 1} aria-label="One less"><Minus size={16} /></button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={999}
        value={quantity}
        aria-label="Quantity"
        onChange={(e) => setQuantity(Math.min(999, Math.max(1, parseInt(e.target.value, 10) || 1)))}
      />
      <button type="button" onClick={() => changeQty(1)} aria-label="One more"><Plus size={16} /></button>
    </div>
  );

  const addButton = (
    <button
      type="button"
      className={`btn btn-primary pd-add ${added ? 'is-added' : ''}`}
      onClick={handleAddToCart}
    >
      {added ? <><Check size={18} /> Added</> : <><ShoppingBag size={18} /> Add to cart · {money(totalCost)}</>}
    </button>
  );

  return (
    <div className="pd-overlay" onClick={close}>
      <div
        className="pd-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pd-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="pd-grab" aria-hidden="true" />
        <button type="button" className="pd-close" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        <div className="pd-scroll" ref={scrollRef}>
          <div className="pd-layout">
            {/* ── Photos ── */}
            <div className="pd-gallery">
              <div className="pd-stage">
                <div className="pd-track" ref={trackRef} onScroll={onTrackScroll}>
                  {(images.length ? images : ['']).map((img, idx) => (
                    <div className="pd-slide" key={`${img}-${idx}`}>
                      <SmartImage
                        src={sizedImage(img, 900)}
                        alt={idx === 0 ? product.name : `${product.name}, photo ${idx + 1}`}
                        fallbackLabel={product.name}
                        className="pd-image"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        draggable={false}
                      />
                    </div>
                  ))}
                </div>

                {label && <span className={`pd-label pd-label-${label.tone}`}>{label.text}</span>}

                {images.length > 1 && (
                  <>
                    <button type="button" className="pd-arrow pd-arrow-prev" onClick={() => showImage(activeImageIndex - 1)} aria-label="Previous photo">
                      <ChevronLeft size={20} />
                    </button>
                    <button type="button" className="pd-arrow pd-arrow-next" onClick={() => showImage(activeImageIndex + 1)} aria-label="Next photo">
                      <ChevronRight size={20} />
                    </button>
                    <div className="pd-dots" aria-hidden="true">
                      {images.map((_, idx) => <span key={idx} className={idx === activeImageIndex ? 'is-active' : ''} />)}
                    </div>
                    <span className="pd-counter">{activeImageIndex + 1} / {images.length}</span>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="pd-thumbs">
                  {images.map((img, idx) => (
                    <button
                      key={`${img}-${idx}`}
                      type="button"
                      className={`pd-thumb ${activeImageIndex === idx ? 'is-active' : ''}`}
                      onClick={() => showImage(idx)}
                      aria-label={`Show photo ${idx + 1}`}
                      aria-current={activeImageIndex === idx ? 'true' : undefined}
                    >
                      <SmartImage src={sizedImage(img, 160)} alt="" className="pd-thumb-img" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Details ── */}
            <div className="pd-info">
              <div className="pd-topline">
                <span className="pd-category">{product.category}</span>
                <button
                  type="button"
                  className={`pd-save ${isFavorited ? 'is-on' : ''}`}
                  onClick={() => toggleWishlist(product)}
                  aria-pressed={isFavorited}
                >
                  <Heart size={17} fill={isFavorited ? 'currentColor' : 'none'} />
                  {isFavorited ? 'Saved' : 'Save'}
                </button>
              </div>

              <h2 id="pd-title" className="pd-title">{product.name}</h2>
              <HiddenGem spot={`product:${product.id}`} className="hidden-gem-inline" />

              {reviewCount > 0 && avgRating > 0 && (
                <button type="button" className="pd-rating" onClick={openReviews}>
                  <Stars value={avgRating} />
                  <strong>{avgRating.toFixed(1)}</strong>
                  <span>({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
                </button>
              )}

              <div className="pd-price">
                <span className="pd-now">{money(product.price)}</span>
                {discount && (
                  <>
                    <s className="pd-was">{money(product.originalPrice)}</s>
                    <span className="pd-off">Save {discount}%</span>
                  </>
                )}
              </div>
              {dealLeft && (
                <p className="pd-deal"><Clock size={14} aria-hidden="true" /> Deal price ends in {dealLeft}</p>
              )}

              <p className={`pd-stock ${soldOut ? 'is-out' : ''}`}>
                <span className="pd-stock-dot" aria-hidden="true" />
                {soldOut ? 'Out of stock right now' : 'Available to order · price fixed in cedis'}
              </p>

              {/* The buyer's choices: size, colour… */}
              {!soldOut && options.length > 0 && (
                <div ref={optionsRef} className={`pd-options ${optionError ? 'has-error' : ''}`}>
                  {options.map((o) => (
                    <div key={o.name} className="pd-option" role="radiogroup" aria-label={o.name}>
                      <span className="pd-option-label">
                        {o.name}{selected[o.name] ? <>: <strong>{selected[o.name]}</strong></> : <em> — choose one</em>}
                      </span>
                      <div className="pd-option-values">
                        {o.values.map((v) => (
                          <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={selected[o.name] === v}
                            className={`pd-chip ${selected[o.name] === v ? 'is-active' : ''}`}
                            onClick={() => choose(o.name, v)}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {optionError && missing && (
                    <p className="pd-option-error" role="alert">Please choose a {missing.name.toLowerCase()}.</p>
                  )}
                </div>
              )}

              {/* Buy box (desktop; phones get the bar at the bottom) */}
              {soldOut ? (
                <a href={backInStockLink} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-block pd-buy-inline">
                  <MessageCircle size={18} /> Ask when it's back in stock
                </a>
              ) : (
                <div className="pd-buy pd-buy-inline">
                  <div className="pd-buy-row">
                    {qtyStepper}
                    {addButton}
                  </div>
                  <button type="button" className="btn btn-dark btn-block" onClick={handleBuyNow}>
                    Buy now <ArrowRight size={17} />
                  </button>
                </div>
              )}

              {!soldOut && (
                <a href={getWhatsAppOrderLink(product, quantity, cleanSelection(product, selected))} target="_blank" rel="noreferrer" className="pd-wa-link">
                  <MessageCircle size={16} /> Prefer WhatsApp? Order this in a chat
                </a>
              )}

              <ul className="pd-perks">
                <li><Truck size={16} aria-hidden="true" /> Delivery anywhere in Ghana, to your door or bus station</li>
                <li><ShieldCheck size={16} aria-hidden="true" /> Checked before it leaves the supplier</li>
                <li><Lock size={16} aria-hidden="true" /> Price fixed in cedis once you order</li>
              </ul>

              {/* Tabs */}
              <div className="pd-tabs" role="tablist" aria-label="Product information" ref={tabsRef}>
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'delivery', label: 'Delivery' },
                  { id: 'reviews', label: `Reviews${reviewCount ? ` (${reviewCount})` : ''}` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`pd-tab-${tab.id}`}
                    aria-selected={activeTab === tab.id}
                    aria-controls={`pd-panel-${tab.id}`}
                    className={`pd-tab ${activeTab === tab.id ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="pd-panel" role="tabpanel" id={`pd-panel-${activeTab}`} aria-labelledby={`pd-tab-${activeTab}`}>
                {activeTab === 'details' && (
                  <>
                    {product.description && <p className="pd-desc">{product.description}</p>}
                    {product.specifications?.length > 0 && (
                      <dl className="pd-specs">
                        {product.specifications.map((spec, i) => (
                          <div key={i}>
                            <dt>{spec.label}</dt>
                            <dd>{spec.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {!product.description && !product.specifications?.length && (
                      <p className="pd-muted">Ask us on WhatsApp for sizes, colours or more photos.</p>
                    )}
                  </>
                )}

                {activeTab === 'delivery' && (
                  <>
                    <ul className="pd-delivery">
                      {DELIVERY_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <li key={opt.name}>
                            <span className="pd-delivery-icon" aria-hidden="true"><Icon size={17} /></span>
                            <span className="pd-delivery-body">
                              <span className="pd-delivery-top"><strong>{opt.name}</strong></span>
                              <span>{opt.time} · {opt.note}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="pd-muted">You choose delivery at checkout. Shipping costs differ by item, so we confirm the cost with you after you order. Customs clearance is included.</p>
                  </>
                )}

                {activeTab === 'reviews' && (
                  <div className="pd-reviews">
                    <div className="pd-review-summary">
                      <div className="pd-review-score">
                        <strong>{reviews.length ? avgRating.toFixed(1) : '–'}</strong>
                        <span>
                          <Stars value={avgRating} />
                          <small>{reviews.length ? `Based on ${reviews.length} review${reviews.length === 1 ? '' : 's'}` : 'No reviews yet'}</small>
                        </span>
                      </div>
                      {!showReviewForm && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => (user ? setShowReviewForm(true) : openAuth('login'))}
                        >
                          {user ? 'Write a review' : 'Sign in to review'}
                        </button>
                      )}
                    </div>

                    {reviews.length > 0 && !showReviewForm && (
                      <div className="pd-bars">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = reviews.filter((r) => r.rating === s).length;
                          return (
                            <div key={s} className="pd-bar-row">
                              <span>{s}★</span>
                              <span className="pd-bar"><span style={{ width: `${(count / reviews.length) * 100}%` }} /></span>
                              <span>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {showReviewForm && (
                      <form onSubmit={handleReviewSubmit} className="pd-review-form">
                        <span className="pd-form-label">Your rating</span>
                        <div className="pd-rate" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHoverStar(0)}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              role="radio"
                              aria-checked={userReview.rating === star}
                              aria-label={`${star} star${star === 1 ? '' : 's'}`}
                              onClick={() => setUserReview({ ...userReview, rating: star })}
                              onMouseEnter={() => setHoverStar(star)}
                            >
                              <Star size={26} fill={(hoverStar || userReview.rating) >= star ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Headline (optional)"
                          aria-label="Review headline"
                          maxLength={120}
                          value={userReview.title}
                          onChange={(e) => setUserReview({ ...userReview, title: e.target.value })}
                        />
                        <textarea
                          placeholder="How was the product and the delivery?"
                          aria-label="Your review"
                          required
                          rows={3}
                          maxLength={2000}
                          value={userReview.comment}
                          onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                        />
                        <span className="pd-muted">Posted as {user?.name}. Only customers who ordered this item can review it.</span>
                        <div className="pd-form-actions">
                          <button type="submit" className={`btn btn-primary btn-sm ${postingReview ? 'is-loading' : ''}`} disabled={!userReview.comment.trim()}>
                            Post review
                          </button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowReviewForm(false)}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {submittedReview && (
                      <p className="pd-review-thanks"><Check size={15} /> Thanks! Your review is now live.</p>
                    )}

                    {reviews.length === 0 ? (
                      !showReviewForm && <p className="pd-muted pd-center">Bought this item? Be the first to review it.</p>
                    ) : (
                      <ul className="pd-review-list">
                        {reviews.map((rev) => (
                          <li key={rev.id} className="pd-review">
                            <div className="pd-review-head">
                              <strong>{rev.userName}</strong>
                              {rev.verified && <span className="pd-verified"><BadgeCheck size={13} /> Bought this item</span>}
                              <span className="pd-review-city">{rev.userCity || 'Ghana'}</span>
                            </div>
                            <Stars value={rev.rating} size={13} />
                            {rev.title && <p className="pd-review-title">{rev.title}</p>}
                            <p className="pd-review-text">{rev.comment}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {relatedProducts.length > 0 && (
                <section className="pd-related" aria-label="You may also like">
                  <h3>You may also like</h3>
                  <div className="pd-related-row">
                    {relatedProducts.map((rel) => (
                      <button key={rel.id} type="button" className="pd-related-card" onClick={() => setSelectedProduct(rel)}>
                        <SmartImage
                          src={sizedImage(rel.images?.[0] || rel.image || '', 320)}
                          alt=""
                          fallbackLabel={rel.name}
                          className="pd-related-img"
                        />
                        <span className="pd-related-name">{rel.name}</span>
                        <span className="pd-related-price">{money(rel.price)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Phones: quantity and add-to-cart always in reach */}
        <div className="pd-footer">
          {soldOut ? (
            <a href={backInStockLink} target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-block">
              <MessageCircle size={18} /> Ask when it's back
            </a>
          ) : (
            <>
              {qtyStepper}
              {addButton}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
