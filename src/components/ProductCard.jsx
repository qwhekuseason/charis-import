import React from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage, imageSrcSet } from '../utils/images';
import { SmartImage } from './SmartImage';
import { Heart, ShoppingBag, MessageCircle, Star } from 'lucide-react';

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, setSelectedProduct, getWhatsAppOrderLink } = useStore();

  const isFavorited = isInWishlist(product.id);
  const mainImage = product.images ? product.images[0] : (product.image || '');
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const reviewCount = product.reviewCount || product.reviewsCount || 0;

  return (
    <div className="product-card">
      <div className="product-thumb-box" onClick={() => setSelectedProduct(product)} style={{ cursor: 'pointer' }}>
        <SmartImage
          src={sizedImage(mainImage, 480)}
          srcSet={imageSrcSet(mainImage, [320, 480, 720])}
          sizes="(max-width: 768px) 50vw, 260px"
          alt={product.name}
          fallbackLabel={product.name}
          className="product-image"
          loading="lazy"
          decoding="async"
        />

        <div className="product-badges">
          {discount && <span className="badge badge-sale">−{discount}%</span>}
          {product.justLanded && <span className="badge badge-new">New</span>}
        </div>

        <button
          className={`wishlist-btn-overlay ${isFavorited ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product);
          }}
          aria-label={isFavorited ? 'Remove from saved items' : 'Save item'}
          title={isFavorited ? 'Remove from saved items' : 'Save item'}
        >
          <Heart size={15} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : 'var(--text-muted)'} />
        </button>
      </div>

      <div className="product-content">
        <span className="product-category">{product.category}</span>

        <h3 className="product-title" onClick={() => setSelectedProduct(product)} title={product.name}>
          {product.name}
        </h3>

        {product.rating > 0 && reviewCount > 0 && (
          <div className="product-rating" aria-label={`Rated ${product.rating} out of 5`}>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <span>{Number(product.rating).toFixed(1)}</span>
            <span className="product-rating-count">({reviewCount})</span>
          </div>
        )}

        <div className="product-pricing">
          <span className="price-main">
            <span className="currency-ghc">GH₵</span>
            {product.price.toFixed(2)}
          </span>
          {discount && <span className="price-was">GH₵{product.originalPrice.toFixed(2)}</span>}
        </div>

        <div className="card-actions">
          <button className="card-add-btn" onClick={() => addToCart(product, 1)}>
            <ShoppingBag size={14} />
            <span>Add to cart</span>
          </button>
          <a
            href={getWhatsAppOrderLink(product, 1)}
            target="_blank"
            rel="noreferrer"
            className="card-whatsapp-btn"
            aria-label={`Order ${product.name} on WhatsApp`}
            title="Order on WhatsApp"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle size={16} />
          </a>
        </div>
      </div>
    </div>
  );
};
