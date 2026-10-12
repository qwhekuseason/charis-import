import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { productCategorySlug } from '../utils/categories';
import { HiddenGem } from './HiddenGem';
import {
  X,
  ShoppingBag,
  Heart,
  MessageCircle,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Star,
  Plus,
  Minus,
  ArrowRight,
  Package,
  ThumbsUp,
  Ship,
  Plane,
  Lock
} from 'lucide-react';

export const ProductDetailModal = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    addToCart,
    toggleWishlist,
    isInWishlist,
    getWhatsAppOrderLink,
    navigate,
    setCartDrawerOpen,
    products,
    addReview,
    getReviewsForProduct,
    voteHelpfulReview,
    user,
    openAuth,
    calculateVolumetricFreight
  } = useStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'logistics' | 'reviews'
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [userReview, setUserReview] = useState({
    name: user?.name || '',
    city: user?.city || 'Accra',
    title: '',
    comment: '',
    rating: 5
  });
  const [submittedReview, setSubmittedReview] = useState(false);

  // Volumetric Freight Simulation State
  const [customCbm, setCustomCbm] = useState(0.045);
  const [customKg, setCustomKg] = useState(3.5);

  // Reset when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      setActiveImageIndex(0);
      setSubmittedReview(false);
      setShowReviewForm(false);
      setCustomCbm(selectedProduct.cbm || 0.045);
      setCustomKg(selectedProduct.weightKg || 3.5);
      setUserReview({
        name: user?.name || '',
        city: user?.city || 'Accra',
        title: '',
        comment: '',
        rating: 5
      });
    }
  }, [selectedProduct, user]);

  if (!selectedProduct) return null;

  const isFavorited = isInWishlist(selectedProduct.id);
  const images = selectedProduct.images || (selectedProduct.image ? [selectedProduct.image] : []);
  const activeImage = images[activeImageIndex] || images[0] || '';
  const discount = selectedProduct.originalPrice
    ? Math.round(((selectedProduct.originalPrice - selectedProduct.price) / selectedProduct.originalPrice) * 100)
    : null;
  const totalCost = (selectedProduct.price * quantity).toFixed(2);

  const handleQtyChange = (delta) => {
    const newQty = quantity + delta;
    if (newQty >= 1) setQuantity(newQty);
  };

  const handleBuyNow = () => {
    addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
    navigate('checkout');
  };

  const handleAddToCart = () => {
    addToCart(selectedProduct, quantity);
    setSelectedProduct(null);
    setCartDrawerOpen(true);
  };

  // Related products in same category
  const relatedProducts = (products || [])
    .filter((p) => productCategorySlug(p) === productCategorySlug(selectedProduct) && p.id !== selectedProduct.id)
    .slice(0, 3);

  // Calculated freight rates
  const freightCalc = calculateVolumetricFreight
    ? calculateVolumetricFreight(customCbm * quantity, customKg * quantity)
    : {
        cbm: customCbm * quantity,
        actualKg: customKg * quantity,
        volumetricKg: (customCbm * quantity * 167).toFixed(1),
        seaFreightGhs: (customCbm * quantity * 280 * 15.65).toFixed(2),
        airFreightGhs: (customKg * quantity * 12.5 * 15.65).toFixed(2),
        customsDutyEstimateGhs: (selectedProduct.price * quantity * 0.12).toFixed(2)
      };

  return (
    <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
      <div
        className="modal-content-box glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: 0,
          maxWidth: '960px',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--glass-shadow)'
        }}
      >
        {/* Close Button */}
        <button
          className="modal-close-btn"
          onClick={() => setSelectedProduct(null)}
          title="Close product details"
          style={{
            zIndex: 10,
            background: 'var(--glass-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-light)'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Left Column: Image Gallery & Badges */}
          <div
            style={{
              padding: '24px',
              backgroundColor: 'var(--bg-card)',
              borderRight: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {/* Main Image */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '88%',
                borderRadius: '16px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-light)'
              }}
            >
              <img
                src={activeImage}
                alt={selectedProduct.name}
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Badges */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedProduct.justLanded && (
                  <span className="badge-new">New</span>
                )}
                {discount && (
                  <span className="badge-sale">
                    −{discount}%
                  </span>
                )}
              </div>

              {/* In Stock Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  backgroundColor: selectedProduct.inStock === false ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: selectedProduct.inStock === false ? '#ef4444' : '#10b981',
                  border: `1px solid ${selectedProduct.inStock === false ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,                  fontSize: '0.74rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                
                {selectedProduct.inStock === false ? 'Out of stock' : 'Available to order'}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    style={{
                      width: '64px', height: '64px',
                      borderRadius: '10px', overflow: 'hidden',
                      border: activeImageIndex === idx ? '2px solid #2563eb' : '1px solid var(--border-light)',
                      padding: '2px', backgroundColor: 'var(--bg-main)',
                      cursor: 'pointer'
                    }}
                  >
                    <img
                      src={img}
                      alt={`thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Delivery & Logistics Guarantee Badges */}
            <div
              className="glass-panel"
              style={{
                marginTop: 'auto',
                padding: '16px',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Delivery across Ghana:</strong> to your door or your nearest bus station.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Checked before shipping:</strong> we inspect items before they leave the supplier.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>Fixed price in cedis:</strong> the price won't change after you order.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Dynamic Tabs */}
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px', overflow: 'auto', maxHeight: '90vh' }}>
            {/* Category + Wishlist */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {selectedProduct.category}
              </span>
              <button
                onClick={() => toggleWishlist(selectedProduct)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '0.82rem', fontWeight: 600,
                  color: isFavorited ? '#ef4444' : 'var(--text-secondary)',
                  background: 'none', border: 'none', cursor: 'pointer'
                }}
              >
                <Heart size={18} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : 'currentColor'} />
                <span>{isFavorited ? 'Saved' : 'Save'}</span>
              </button>
            </div>

            {/* Product Name */}
            <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25, margin: 0 }}>
              {selectedProduct.name}
            </h2>

            <HiddenGem spot={`product:${selectedProduct.id}`} className="hidden-gem-inline" />

            {/* Star Rating — only from real customer reviews */}
            {selectedProduct.reviewCount > 0 && selectedProduct.rating > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', color: '#2563eb' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.floor(selectedProduct.rating) ? '#2563eb' : 'none'}
                    />
                  ))}
                </div>
                <span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedProduct.rating}</strong>
                  {selectedProduct.reviewCount > 0 && <span> ({selectedProduct.reviewCount} reviews)</span>}
                </span>
              </div>
            )}

            {/* Price */}
            <div
              className="glass-panel"
              style={{
                borderRadius: '16px',
                padding: '18px',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Price
                  </span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                  <span className="currency-ghc">GH₵</span>
                  {selectedProduct.price.toFixed(2)}
                </div>
                {selectedProduct.originalPrice && (
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    GH₵{selectedProduct.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {discount && (
                <span
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    padding: '6px 12px',
                    borderRadius: '8px'
                  }}
                >
                  Save {discount}%
                </span>
              )}
            </div>

            {/* Quantity Stepper & Subtotal */}
            <div
              className="glass-panel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                  Quantity
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => handleQtyChange(-1)}
                    disabled={quantity <= 1}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      opacity: quantity <= 1 ? 0.4 : 1
                    }}
                  >
                    <Minus size={15} />
                  </button>

                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setQuantity(Math.max(1, val));
                    }}
                    style={{
                      width: '60px', textAlign: 'center', fontWeight: 800,
                      fontSize: '1rem', border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                      borderRadius: '8px', padding: '4px'
                    }}
                  />

                  <button
                    onClick={() => handleQtyChange(1)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-light)',
                      color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600 }}>Total:</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                  <span className="currency-ghc">GH₵</span>
                  {totalCost}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={selectedProduct.inStock === false}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  <ShoppingBag size={18} /> Add to cart
                </button>

                <button
                  className="btn btn-dark"
                  onClick={handleBuyNow}
                  disabled={selectedProduct.inStock === false}
                  style={{ width: '100%', borderRadius: '12px' }}
                >
                  Buy now <ArrowRight size={18} />
                </button>
              </div>

              <a
                href={getWhatsAppOrderLink(selectedProduct, quantity)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
                style={{ width: '100%', borderRadius: '12px' }}
              >
                <MessageCircle size={20} /> Order via WhatsApp
              </a>
            </div>

            {/* Navigation Tabs */}
            <div style={{ marginTop: '6px' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '16px' }}>
                <button
                  onClick={() => setActiveTab('details')}
                  style={{
                    padding: '10px 0', fontSize: '0.9rem', fontWeight: 800,
                    color: activeTab === 'details' ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'details' ? '2px solid #2563eb' : 'none',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Description & Specs
                </button>

                <button
                  onClick={() => setActiveTab('logistics')}
                  style={{
                    padding: '10px 0', fontSize: '0.9rem', fontWeight: 800,
                    color: activeTab === 'logistics' ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'logistics' ? '2px solid #2563eb' : 'none',
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                   Delivery
                </button>

                <button
                  onClick={() => setActiveTab('reviews')}
                  style={{
                    padding: '10px 0', fontSize: '0.9rem', fontWeight: 800,
                    color: activeTab === 'reviews' ? '#2563eb' : 'var(--text-secondary)',
                    borderBottom: activeTab === 'reviews' ? '2px solid #2563eb' : 'none',
                    background: 'none', border: 'none', cursor: 'pointer'
                  }}
                >
                  Reviews {selectedProduct.reviewCount ? `(${selectedProduct.reviewCount})` : ''}
                </button>
              </div>

              {/* Tab 1: Description & Specs */}
              {activeTab === 'details' && (
                <div style={{ paddingTop: '16px' }}>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                    {selectedProduct.description}
                  </p>

                  {/* Specifications */}
                  {selectedProduct.specifications && selectedProduct.specifications.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      {selectedProduct.specifications.map((spec, i) => (
                        <div
                          key={i}
                          style={{
                            display: 'flex', justifyContent: 'space-between',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg-main)',
                            borderRadius: '8px',
                            border: '1px solid var(--border-light)'
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{spec.label}:</span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Delivery options (same prices as checkout) */}
              {activeTab === 'logistics' && (
                <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { icon: Ship, name: 'Sea shipping', time: '35–45 working days', fee: 35, note: 'Cheapest option. Best for heavy or bulk items.' },
                    { icon: Plane, name: 'Air shipping', time: '7–12 working days', fee: 75, note: 'Faster delivery for urgent orders.' },
                    { icon: Truck, name: 'Local delivery (Kumasi)', time: '1–2 working days', fee: 40, note: 'For items already in stock in Kumasi.' },
                  ].map((opt) => (
                    <div key={opt.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                          <span>{opt.name}</span>
                          <span>GH₵{opt.fee.toFixed(2)}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{opt.time} · {opt.note}</div>
                      </div>
                    </div>
                  ))}
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    You choose your delivery option at checkout. Customs clearance is included.
                  </p>
                </div>
              )}
              {/* Tab 3: Reviews */}
              {activeTab === 'reviews' && (
                <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const currentReviews = getReviewsForProduct(selectedProduct.id);
                    const totalReviews = currentReviews.length;
                    const avgRating = totalReviews > 0
                      ? (currentReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                      : '0.0';

                    const starCounts = [5, 4, 3, 2, 1].map((s) => ({
                      star: s,
                      count: currentReviews.filter((r) => r.rating === s).length,
                      percentage: totalReviews > 0 ? (currentReviews.filter((r) => r.rating === s).length / totalReviews) * 100 : 0
                    }));

                    const handleReviewSubmit = async (e) => {
                      e.preventDefault();
                      if (!userReview.name || !userReview.comment) return;
                      const saved = await addReview(selectedProduct.id, userReview);
                      if (!saved) return;
                      setSubmittedReview(true);
                      setShowReviewForm(false);
                      setUserReview({
                        name: user?.name || '',
                        city: user?.city || 'Accra',
                        title: '',
                        comment: '',
                        rating: 5
                      });
                    };

                    return (
                      <>
                        {/* Rating Summary Card */}
                        <div
                          className="glass-panel"
                          style={{
                            borderRadius: '14px',
                            padding: '16px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                              {avgRating}
                            </div>
                            <div>
                              <div style={{ display: 'flex', color: '#2563eb', marginBottom: '4px' }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    fill={i < Math.floor(Number(avgRating)) ? '#2563eb' : 'none'}
                                  />
                                ))}
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => (user ? setShowReviewForm(!showReviewForm) : openAuth('login'))}
                            className="btn btn-sm"
                            style={{
                              backgroundColor: showReviewForm ? 'var(--bg-main)' : 'var(--text-primary)',
                              color: showReviewForm ? 'var(--text-primary)' : 'var(--bg-card)',
                              border: '1px solid var(--border-light)',
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                          >
                            {showReviewForm ? 'Cancel Review' : user ? 'Write a Review' : 'Sign in to Review'}
                          </button>
                        </div>

                        {/* Breakdown Bars */}
                        {totalReviews > 0 && !showReviewForm && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
                            {starCounts.map(({ star, count, percentage }) => (
                              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ width: '28px', color: 'var(--text-secondary)', fontWeight: 600 }}>{star}★</span>
                                <div style={{ flex: 1, height: '6px', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#2563eb', borderRadius: '3px' }} />
                                </div>
                                <span style={{ width: '20px', color: 'var(--text-muted)', textAlign: 'right' }}>{count}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Write Review Form */}
                        {showReviewForm && (
                          <form
                            onSubmit={handleReviewSubmit}
                            className="glass-panel"
                            style={{
                              borderRadius: '14px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              Share Your Customer Experience
                            </h4>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                Your Rating *
                              </label>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setUserReview({ ...userReview, rating: star })}
                                    onMouseEnter={() => setHoverStar(star)}
                                    onMouseLeave={() => setHoverStar(0)}
                                    style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', lineHeight: 0 }}
                                  >
                                    <Star
                                      size={22}
                                      color="#2563eb"
                                      fill={(hoverStar || userReview.rating) >= star ? '#2563eb' : 'none'}
                                    />
                                  </button>
                                ))}
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', marginLeft: '6px' }}>
                                  {userReview.rating} of 5 Stars
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <input
                                type="text"
                                placeholder="Your Name (e.g. Ama Mensah) *"
                                required
                                value={userReview.name}
                                onChange={(e) => setUserReview({ ...userReview, name: e.target.value })}
                                style={{
                                  padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                  backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                }}
                              />
                              <input
                                type="text"
                                placeholder="Your City (e.g. Accra, Kumasi)"
                                value={userReview.city}
                                onChange={(e) => setUserReview({ ...userReview, city: e.target.value })}
                                style={{
                                  padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                  backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem'
                                }}
                              />
                            </div>

                            <input
                              type="text"
                              placeholder="Headline (e.g. Cleared customs fast, high build quality!)"
                              value={userReview.title}
                              onChange={(e) => setUserReview({ ...userReview, title: e.target.value })}
                              style={{
                                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem'
                              }}
                            />

                            <textarea
                              placeholder="Write your honest review about this product & shipping..."
                              required
                              rows={3}
                              value={userReview.comment}
                              onChange={(e) => setUserReview({ ...userReview, comment: e.target.value })}
                              style={{
                                padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem'
                              }}
                            />

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="submit"
                                className="btn btn-primary btn-sm"
                                style={{ fontWeight: 700, fontSize: '0.85rem', borderRadius: '8px' }}
                              >
                                Post review
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowReviewForm(false)}
                                style={{
                                  padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border-light)',
                                  background: 'var(--bg-main)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        )}

                        {submittedReview && (
                          <div
                            style={{
                              padding: '12px 16px',
                              backgroundColor: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              borderRadius: '10px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            
                            Thanks! Your review is now live.
                          </div>
                        )}

                        {/* Customer Reviews List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {currentReviews.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                              No reviews yet for this product. Be the first to share your experience!
                            </div>
                          ) : (
                            currentReviews.map((rev) => (
                              <div
                                key={rev.id}
                                className="glass-panel"
                                style={{
                                  padding: '14px',
                                  borderRadius: '12px',
                                  border: '1px solid var(--border-light)'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                      {rev.userName}
                                    </span>
                                    {rev.verified && (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                          color: '#10b981',
                                          fontSize: '0.7rem',
                                          fontWeight: 700,
                                          padding: '2px 6px',
                                          borderRadius: '4px'
                                        }}
                                      >
                                         Bought this item
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {rev.userCity || 'Ghana'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', color: '#2563eb', marginBottom: '6px' }}>
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      size={13}
                                      fill={i < rev.rating ? '#2563eb' : 'none'}
                                    />
                                  ))}
                                </div>

                                {rev.title && (
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    {rev.title}
                                  </div>
                                )}

                                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                                  {rev.comment}
                                </p>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                                  <button
                                    onClick={() => voteHelpfulReview(rev.id)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      fontSize: '0.72rem',
                                      color: 'var(--text-secondary)',
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '2px 6px',
                                      borderRadius: '4px'
                                    }}
                                  >
                                     Helpful ({rev.helpfulCount || 0})
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                  You may also like
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => setSelectedProduct(rel)}
                      className="glass-panel"
                      style={{
                        cursor: 'pointer', padding: '10px', borderRadius: '12px',
                        border: '1px solid var(--border-light)',
                        transition: 'transform 0.2s ease, border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.borderColor = '#2563eb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.borderColor = 'var(--border-light)';
                      }}
                    >
                      <img
                        src={sizedImage((rel.images?.[0]) || rel.image || '', 320)}
                        alt={rel.name}
                        style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px', marginBottom: '6px' }}
                      />
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {rel.name}
                      </div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563eb' }}>
                        GH₵{rel.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
