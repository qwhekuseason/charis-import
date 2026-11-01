import React from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { SmartImage } from '../components/SmartImage';
import { sizedImage } from '../utils/images';
import { productCategorySlug } from '../utils/categories';
import { ArrowRight, PackagePlus } from 'lucide-react';
import './InfoPages.css';

const money = (n) => `GH₵${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const CategoriesPage = () => {
  const { categories, products, catalogStatus, setSelectedCategory, navigate, openQuote } = useStore();

  const open = (slug) => {
    setSelectedCategory(slug);
    navigate('shop');
  };

  // What's in each category, so the cards can show real products and a starting price.
  const withStock = (categories || []).map((cat) => {
    const items = (products || []).filter((p) => productCategorySlug(p) === cat.slug);
    const prices = items.map((p) => p.price).filter((n) => n > 0);
    return { ...cat, items, from: prices.length ? Math.min(...prices) : null };
  });
  const ready = withStock.filter((c) => c.items.length > 0).sort((a, b) => b.items.length - a.items.length);
  const comingSoon = withStock.filter((c) => c.items.length === 0);
  const loading = catalogStatus === 'loading' && !(categories || []).length;

  return (
    <div className="section ip-page">
      <div className="container">
        <header className="ip-head">
          <h1>Shop by category <HiddenGem spot="categories-page" /></h1>
          <p>Everything we stock, grouped to help you find it faster. Delivery anywhere in Ghana.</p>
        </header>

        {loading ? (
          <div className="ip-cat-grid" aria-label="Loading categories">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="ip-cat-skeleton" aria-hidden="true" />)}
          </div>
        ) : (
          <>
            <div className="ip-cat-grid">
              {ready.map((cat) => (
                <button key={cat.id} type="button" className="ip-cat" onClick={() => open(cat.slug)}>
                  <span className="ip-cat-photo">
                    <SmartImage src={cat.image ? sizedImage(cat.image, 480) : ''} alt="" fallbackLabel={cat.name} loading="lazy" />
                    <span className="ip-cat-count">{cat.items.length} product{cat.items.length === 1 ? '' : 's'}</span>
                  </span>
                  <span className="ip-cat-body">
                    <span className="ip-cat-name">{cat.name}</span>
                    {cat.from !== null && <span className="ip-cat-from">From {money(cat.from)}</span>}
                    <span className="ip-cat-thumbs" aria-hidden="true">
                      {cat.items.slice(0, 4).map((p) => (
                        <SmartImage key={p.id} src={sizedImage(p.images?.[0] || p.image || '', 96)} alt="" className="ip-cat-thumb" />
                      ))}
                    </span>
                    <span className="ip-cat-go">Browse {cat.name} <ArrowRight size={16} /></span>
                  </span>
                </button>
              ))}
            </div>

            {comingSoon.length > 0 && (
              <section className="ip-soon" aria-label="Coming soon">
                <div className="ip-soon-text">
                  <h2>Coming soon</h2>
                  <p>We're adding stock to these. Need something now? Tell us what you want and we'll source it.</p>
                </div>
                <div className="ip-soon-list">
                  {comingSoon.map((cat) => (
                    <button key={cat.id} type="button" className="ip-soon-chip" onClick={() => openQuote()} title={`Request something from ${cat.name}`}>
                      <SmartImage src={cat.image ? sizedImage(cat.image, 96) : ''} alt="" className="ip-soon-img" />
                      {cat.name}
                    </button>
                  ))}
                </div>
                <button type="button" className="btn btn-primary" onClick={() => openQuote()}>
                  <PackagePlus size={16} /> Request an item
                </button>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
