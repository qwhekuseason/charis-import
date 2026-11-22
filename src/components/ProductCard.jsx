import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { productOptions, priceRange } from '../utils/options';
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

// Colour names the admin types ("Gold stand", "Navy blue") → a dot of that colour on the card.
const SWATCHES = {
  black: '#1d1b18', white: '#f8f6f1', cream: '#efe6d2', ivory: '#f4efe1', beige: '#d9c7a7', nude: '#e3bfa5', khaki: '#b7a77a',
  gold: '#c9a24a', silver: '#c4c4c4', grey: '#9a9a9a', gray: '#9a9a9a', brown: '#7a5134', coffee: '#6f4e37', chocolate: '#5a3a26',
  red: '#c0392b', wine: '#6d1f2f', maroon: '#6d1f2f', burgundy: '#6d1f2f', pink: '#e8a1b5', rose: '#d98c8c', peach: '#f2b48f',
  orange: '#e07b39', yellow: '#e2c044', mustard: '#c9a227', green: '#3f7a4f', olive: '#6b6b3a', mint: '#a8d8c0', teal: '#2f7f7f',
  blue: '#3b6fb6', navy: '#1f2f55', sky: '#8cc3e8', purple: '#7a4fa0', lilac: '#c3a6d8', lavender: '#b8a6d9',
};
const swatchOf = (name) => {
  const words = String(name).toLowerCase().match(/[a-z]+/g) || [];
  const hit = words.find((w) => SWATCHES[w]);
  return hit ? SWATCHES[hit] : null;
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
  const range = priceRange(product); // sizes with their own prices → "From GH₵…"
  const dealLeft = product.onDeal && product.dealEndsAt ? timeLeft(product.dealEndsAt) : null;

  // One label at most, in order of importance.
  const label = soldOut ? { text: 'Out of stock', tone: 'muted' }
    : product.onDeal ? { text: 'Deal', tone: 'deal' }
    : product.justLanded ? { text: 'New', tone: 'new' }
    : null;

  const open = () => setSelectedProduct(product);
  const needsChoice = productOptions(product).length > 0;
  const colours = (productOptions(product).find((o) => /colou?r/i.test(o.name))?.values || [])
    .map((v) => ({ name: v, color: swatchOf(v) }))
    .filter((c) => c.color);
  const addOrChoose = () => (needsChoice ? open() : (addToCart(product, 1), setAdded(true)));

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

      </div>

      <div className="pcard-info">
        {colours.length > 1 && (
          <span className="pcard-dots" aria-label={`Colours: ${colours.map((c) => c.name).join(', ')}`}>
            {colours.slice(0, 4).map((c) => <i key={c.name} style={{ background: c.color }} title={c.name} />)}
            {colours.length > 4 && <small>+{colours.length - 4}</small>}
          </span>
        )}
        <button type="button" className="pcard-body" onClick={open}>
          <h3 className="pcard-name">{product.name}</h3>
          {dealLeft ? (
            <span className="pcard-meta pcard-deal-left">Ends in {dealLeft}</span>
          ) : product.rating > 0 && reviewCount > 0 ? (
            <span className="pcard-meta">
              <Star size={12} fill="#f59e0b" color="#f59e0b" /> {Number(product.rating).toFixed(1)} <span className="pcard-count">({reviewCount})</span>
            </span>
          ) : null}
        </button>

        <div className="pcard-foot">
          <div className="pcard-price">
            <span className="pcard-now">{range.varies && <small className="pcard-from">From </small>}{cedis(range.varies ? range.min : product.price)}</span>
            {discount && !range.varies && (
              <>
                <s className="pcard-was">{cedis(product.originalPrice)}</s>
                <span className="pcard-off">−{discount}%</span>
              </>
            )}
          </div>
          {!soldOut && (
            <button
              type="button"
              className={`pcard-cart ${added ? 'is-added' : ''}`}
              // Products with sizes/colours open first so the buyer can choose.
              onClick={addOrChoose}
              aria-label={needsChoice ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
            >
              {added ? <Check size={15} /> : <Plus size={15} />}
              <span>{added ? 'Added' : needsChoice ? 'Choose' : 'Cart'}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
