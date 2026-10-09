import React from 'react';
import { useStore } from '../context/StoreContext';
import { Heart, ShoppingBag, MessageCircle, Star, Eye, Ship, Plane, ShieldCheck } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    setSelectedProduct,
    getWhatsAppOrderLink,
    fxRates
  } = useStore();

  const isFavorited = isInWishlist(product.id);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Approximate FX conversion for price transparency
  const usdPrice = (product.price / (fxRates?.USD_GHS || 15.65)).toFixed(1);
  const rmbPrice = Math.round(product.price / (fxRates?.RMB_GHS || 2.18));

  // Determine importation freight route
  const isHeavyItem = product.category === 'Appliances' || product.category === 'Furniture' || product.price > 300;

  return (
    <div className="product-card" style={{ borderRadius: '18px' }}>
      {/* Thumbnail Box */}
      <div
        className="product-thumb-box"
        onClick={() => setSelectedProduct(product)}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={product.images ? product.images[0] : (product.image || '')}
          alt={product.name}
          className="product-image"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div className="product-badges">
          {product.justLanded && (
            <span
              className="badge"
              style={{
                backgroundColor: '#ffffff',
                color: '#0284c7',
                border: '1.5px solid #bae6fd',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                fontSize: '0.66rem',
                fontWeight: 700,
                borderRadius: '6px'
              }}
            >
              Just Landed
            </span>
          )}

          {discount && (
            <span
              className="badge deal-badge-animated"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: '#fff',
                fontSize: '0.66rem',
                borderRadius: '6px',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.35)'
              }}
            >
              -{discount}%
            </span>
          )}

          {/* Freight Badge */}
          <span
            className={`badge ${isHeavyItem ? 'badge-sea' : 'badge-air'}`}
            style={{ borderRadius: '6px', fontSize: '0.64rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
          >
            {isHeavyItem ? <Ship size={10} /> : <Plane size={10} />}
            {isHeavyItem ? 'Sea FCL' : 'Air Cargo'}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          className={`wishlist-btn-overlay ${isFavorited ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid var(--glass-border)'
          }}
        >
          <Heart
            size={15}
            fill={isFavorited ? '#ef4444' : 'none'}
            color={isFavorited ? '#ef4444' : 'var(--text-muted)'}
          />
        </button>

        {/* Quick View overlay */}
        <div
          className="product-quick-view"
          style={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            background: 'rgba(37, 99, 235, 0.92)',
            color: '#ffffff'
          }}
        >
          <Eye size={14} />
          Quick Inspect
        </div>
      </div>

      {/* Card Content */}
      <div className="product-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="product-category">{product.category}</span>
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ${usdPrice} • ¥{rmbPrice}
          </span>
        </div>

        <h3
          className="product-title"
          onClick={() => setSelectedProduct(product)}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Star Rating */}
        {product.rating && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={11}
                  fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                  color={s <= Math.round(product.rating) ? '#f59e0b' : 'var(--border-medium)'}
                />
              ))}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              ({product.reviewCount || product.reviewsCount || 12})
            </span>
          </div>
        )}

        {/* Pricing */}
        <div className="product-pricing">
          <span className="price-main">
            <span className="currency-ghc">GH₵</span>
            {product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              GH₵{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="card-actions">
          <button
            className="card-add-btn"
            onClick={() => addToCart(product, 1)}
            style={{ borderRadius: '10px' }}
          >
            <ShoppingBag size={14} />
            <span>Add to Cart</span>
          </button>

          <a
            href={getWhatsAppOrderLink(product, 1)}
            target="_blank"
            rel="noreferrer"
            className="card-whatsapp-btn"
            title="Order via WhatsApp"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRadius: '10px' }}
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
