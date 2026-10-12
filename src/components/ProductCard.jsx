import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage, imageSrcSet } from '../utils/images';
import { SmartImage } from './SmartImage';
import { Heart, Plus, Check, Star } from 'lucide-react';

// "3 days", "5 hours", "20 min" — short enough for a card.
const timeLeft = (endsAt) => {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const hours = ms / 3600000;
  if (hours >= 36) return `${Math.round(hours / 24)} days`;
  if (hours >= 1) return `${Math.floor(hours)} hr${Math.floor(hours) === 1 ? '' : 's'}`;
  return `${Math.max(1, Math.floor(ms / 60000))} min`;
};

const cedis = (n) => `GH₵${Number(n).toFixed(2).replace(/\.00$/, '')}`;

export const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist, setSelectedProduct } = useStore();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return undefined;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  const saved = isInWishlist(product.id);
  const soldOut = product.inStock === false;
  const mainImage = product.images ? product.images[0] : (product.image || '');
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const reviewCount = product.reviewCount || product.reviewsCount || 0;
  const dealLeft = product.onDeal && product.dealEndsAt ? timeLeft(product.dealEndsAt) : null;

  // One label at most, in order of importance.
  const label = soldOut ? { text: 'Out of stock', tone: 'muted' }
    : product.onDeal ? { text: 'Deal', tone: 'deal' }
    : product.justLanded ? { text: 'New', tone: 'new' }
    : null;

  const open = () => setSelectedProduct(product);

  return (
    <article className={`pcard ${soldOut ? 'is-soldout' : ''}`}>
      <div className="pcard-media">
        <button type="button" className="pcard-image-btn" onClick={open} aria-label={`View ${product.name}`}>
          <SmartImage
            src={sizedImage(mainImage, 480)}
            srcSet={imageSrcSet(mainImage, [320, 480, 720])}
            sizes="(max-width: 768px) 50vw, 260px"
            alt={product.name}
            fallbackLabel={product.name}
            className="pcard-image"
            loading="lazy"
            decoding="async"
          />
        </button>

        {label && <span className={`pcard-label pcard-label-${label.tone}`}>{label.text}</span>}

        <button
          type="button"
          className={`pcard-icon pcard-save ${saved ? 'is-on' : ''}`}
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? 'Remove from saved items' : 'Save item'}
          aria-pressed={saved}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>

        {!soldOut && (
          <button
            type="button"
            className={`pcard-icon pcard-add ${added ? 'is-added' : ''}`}
            onClick={() => { addToCart(product, 1); setAdded(true); }}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? <Check size={18} /> : <Plus size={18} />}
          </button>
        )}
      </div>

      <button type="button" className="pcard-body" onClick={open}>
        <h3 className="pcard-name">{product.name}</h3>

        <div className="pcard-price">
          <span className="pcard-now">{cedis(product.price)}</span>
          {discount && (
            <>
              <s className="pcard-was">{cedis(product.originalPrice)}</s>
              <span className="pcard-off">−{discount}%</span>
            </>
          )}
        </div>

        {dealLeft ? (
          <span className="pcard-meta pcard-deal-left">Ends in {dealLeft}</span>
        ) : product.rating > 0 && reviewCount > 0 ? (
          <span className="pcard-meta">
            <Star size={12} fill="#f59e0b" color="#f59e0b" /> {Number(product.rating).toFixed(1)} <span className="pcard-count">({reviewCount})</span>
          </span>
        ) : null}
      </button>
    </article>
  );
};
