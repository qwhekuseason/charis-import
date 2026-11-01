import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { ProductCard } from '../components/ProductCard';
import { productCategorySlug } from '../utils/categories';
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react';

// Quick price ranges; customers can also type their own.
const PRICE_BANDS = [
  ['Under GH₵100', '', '100'],
  ['GH₵100 – 300', '100', '300'],
  ['GH₵300 – 1,000', '300', '1000'],
  ['Over GH₵1,000', '1000', ''],
];
const SORTS = [
  ['featured', 'Recommended'],
  ['price-low', 'Price: low to high'],
  ['price-high', 'Price: high to low'],
  ['discount', 'Biggest discount'],
  ['newest', 'Newest'],
];
const PAGE_SIZE = 24;

// Search that forgives word order, capitals, accents and plurals: "red blenders" finds "Blender (Red)".
const normalise = (text) => String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const searchWords = (query) => normalise(query).split(/[^a-z0-9]+/).filter(Boolean).map((w) => (w.length > 3 ? w.replace(/(es|s)$/, '') : w));
const discountOf = (p) => (p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0);
const money = (n) => `GH₵${Number(n).toLocaleString()}`;

export const ShopPage = () => {
  const {
    products,
    catalogStatus,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    wishlist,
    pageParams,
    openQuote
  } = useStore();

  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false); // phones & tablets only
  const [visible, setVisible] = useState(PAGE_SIZE);

  // The filter sheet behaves like the other popups: page stays still, Escape closes it.
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setFiltersOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);
  const [onlyWishlist, setOnlyWishlist] = useState(pageParams?.filter === 'wishlist');
  const [onlyDeals, setOnlyDeals] = useState(pageParams?.filter === 'deals');

  // Navbar links like "Deals" or the wishlist heart can open this page while it's already showing.
  useEffect(() => {
    setOnlyDeals(pageParams?.filter === 'deals');
    setOnlyWishlist(pageParams?.filter === 'wishlist');
  }, [pageParams?.filter]);

  const countFor = (slug) => (products || []).filter((p) => productCategorySlug(p) === slug).length;
  const min = priceMin === '' ? null : Number(priceMin);
  const max = priceMax === '' ? null : Number(priceMax);
  const priceActive = min !== null || max !== null;
  const words = useMemo(() => searchWords(searchQuery), [searchQuery]);

  const filteredProducts = useMemo(() => {
    const matches = (product) => {
      if (selectedCategory !== 'all' && productCategorySlug(product) !== selectedCategory) return false;
      if (onlyWishlist && !wishlist.some((w) => w.id === product.id)) return false;
      if (onlyDeals && !(product.originalPrice > product.price)) return false;
      if (onlyInStock && product.inStock === false) return false;
      // Price limits only apply when the shopper sets them — expensive items are never hidden by default.
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      if (words.length) {
        const haystack = normalise(`${product.name} ${product.category} ${product.description} ${(product.tags || []).join(' ')}`);
        if (!words.every((w) => haystack.includes(w))) return false;
      }
      return true;
    };
    // While searching, products whose name matches come before ones that only mention it in the description.
    const nameScore = (p) => (words.length && words.every((w) => normalise(p.name).includes(w)) ? 0 : 1);
    return (products || []).filter(matches).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'discount') return discountOf(b) - discountOf(a);
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      // Recommended: best search matches first, then anything that can't be ordered right now goes last.
      return nameScore(a) - nameScore(b) || Number(a.inStock === false) - Number(b.inStock === false);
    });
  }, [products, selectedCategory, min, max, sortBy, words, onlyWishlist, onlyDeals, onlyInStock, wishlist]);

  // New filters start from the top of the list again.
  useEffect(() => { setVisible(PAGE_SIZE); }, [selectedCategory, priceMin, priceMax, sortBy, searchQuery, onlyWishlist, onlyDeals, onlyInStock]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setPriceMin('');
    setPriceMax('');
    setSearchQuery('');
    setOnlyWishlist(false);
    setOnlyDeals(false);
    setOnlyInStock(false);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (priceActive ? 1 : 0) +
    (onlyWishlist ? 1 : 0) +
    (onlyDeals ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  const selectedCategoryName = (categories || []).find((c) => c.slug === selectedCategory)?.name;

  const chooseCategory = (slug) => {
    setSelectedCategory(slug);
    setFiltersOpen(false); // on phones, close the panel so the products are visible right away
  };

  const setBand = ([, lo, hi]) => {
    const same = priceMin === lo && priceMax === hi;
    setPriceMin(same ? '' : lo);
    setPriceMax(same ? '' : hi);
  };

  const priceLabel = min !== null && max !== null ? `${money(min)} – ${money(max)}` : min !== null ? `Over ${money(min)}` : `Up to ${money(max)}`;
  const shown = filteredProducts.slice(0, visible);
  const query = searchQuery.trim();
  // Categories whose name matches the search — offered when nothing is found.
  const categoryHints = query ? (categories || []).filter((c) => words.some((w) => normalise(c.name).includes(w))).slice(0, 3) : [];

  const pageTitle = onlyWishlist
    ? 'Saved items'
    : onlyDeals
    ? 'Deals'
    : selectedCategory === 'all'
    ? 'All products'
    : selectedCategoryName || 'Products';

  return (
    <div className="section shop-page">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <h1 className="shop-title">{pageTitle} <HiddenGem spot="shop-header" /></h1>
          <p className="shop-subtitle">
            Order from overseas suppliers and we deliver to you anywhere in Ghana.
          </p>

          <form className="shop-search" role="search" onSubmit={(e) => { e.preventDefault(); e.currentTarget.querySelector('input')?.blur(); }}>
            <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="search"
              enterKeyHint="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search air fryers, dresses, mannequins…"
              aria-label="Search products"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="shop-search-clear">
                <X size={16} />
              </button>
            )}
          </form>
        </div>

        <div className="shop-layout">
          {filtersOpen && <div className="shop-filters-backdrop" onClick={() => setFiltersOpen(false)} aria-hidden="true" />}
          {/* Filters — sidebar on desktop, slide-up sheet on phones & tablets */}
          <aside className={`shop-filters ${filtersOpen ? 'is-open' : ''}`} aria-label="Filters">
            <div className="shop-filters-head">
              <span className="shop-filters-title">
                <SlidersHorizontal size={17} /> Filters
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeFilterCount > 0 && (
                  <button type="button" className="shop-link-btn" onClick={resetFilters}>
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  className="shop-filters-close"
                  onClick={() => setFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="shop-filter-group">
              <label className="shop-check">
                <input type="checkbox" checked={onlyDeals} onChange={(e) => setOnlyDeals(e.target.checked)} />
                On sale only
              </label>
              <label className="shop-check">
                <input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} />
                In stock only
              </label>
              <label className="shop-check">
                <input type="checkbox" checked={onlyWishlist} onChange={(e) => setOnlyWishlist(e.target.checked)} />
                Saved items ({wishlist.length})
              </label>
            </div>

            <div className="shop-filter-group">
              <h4 className="shop-filter-label">Category</h4>
              <div className="shop-category-list">
                <button
                  type="button"
                  className={`shop-category ${selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={() => chooseCategory('all')}
                >
                  <span>All products</span>
                  <span className="shop-category-count">{products.length}</span>
                </button>
                {(categories || []).map((cat) => {
                  const count = countFor(cat.slug);
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      className={`shop-category ${selectedCategory === cat.slug ? 'active' : ''} ${count === 0 ? 'is-empty' : ''}`}
                      onClick={() => chooseCategory(cat.slug)}
                    >
                      <span>{cat.name}</span>
                      <span className="shop-category-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="shop-filter-group">
              <h4 className="shop-filter-label">Price</h4>
              <div className="shop-price-bands">
                {PRICE_BANDS.map((band) => (
                  <button
                    key={band[0]}
                    type="button"
                    className={`shop-band ${priceMin === band[1] && priceMax === band[2] ? 'is-active' : ''}`}
                    aria-pressed={priceMin === band[1] && priceMax === band[2]}
                    onClick={() => setBand(band)}
                  >
                    {band[0]}
                  </button>
                ))}
              </div>
              <div className="shop-price-inputs">
                <label>
                  <span>Min</span>
                  <input type="number" inputMode="numeric" min="0" placeholder="0" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} aria-label="Lowest price" />
                </label>
                <span aria-hidden="true">–</span>
                <label>
                  <span>Max</span>
                  <input type="number" inputMode="numeric" min="0" placeholder="Any" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} aria-label="Highest price" />
                </label>
              </div>
            </div>

            <div className="shop-filter-group shop-filter-sort">
              <h4 className="shop-filter-label">Sort by</h4>
              <div className="shop-price-bands">
                {SORTS.map(([id, text]) => (
                  <button key={id} type="button" className={`shop-band ${sortBy === id ? 'is-active' : ''}`} aria-pressed={sortBy === id} onClick={() => setSortBy(id)}>
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <button type="button" className="btn btn-primary shop-filters-done" onClick={() => setFiltersOpen(false)}>
              Show {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
            </button>
          </aside>

          {/* Products */}
          <div className="shop-results">
            <div className="shop-toolbar">
              <button
                type="button"
                className="shop-filters-toggle"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
              >
                <SlidersHorizontal size={16} />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                <ChevronDown size={15} style={{ transform: filtersOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <span className="shop-count" aria-live="polite">
                {query
                  ? <>{filteredProducts.length} result{filteredProducts.length === 1 ? '' : 's'} for “{query}”</>
                  : <>{filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}</>}
              </span>

              <label className="shop-sort">
                <span>Sort</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORTS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                </select>
              </label>
            </div>

            {(activeFilterCount > 0 || query) && (
              <div className="shop-chips">
                {query && (
                  <button type="button" className="shop-chip" onClick={() => setSearchQuery('')}>
                    “{query}” <X size={13} />
                  </button>
                )}
                {selectedCategory !== 'all' && (
                  <button type="button" className="shop-chip" onClick={() => setSelectedCategory('all')}>
                    {selectedCategoryName || selectedCategory} <X size={13} />
                  </button>
                )}
                {onlyDeals && (
                  <button type="button" className="shop-chip" onClick={() => setOnlyDeals(false)}>
                    On sale <X size={13} />
                  </button>
                )}
                {onlyInStock && (
                  <button type="button" className="shop-chip" onClick={() => setOnlyInStock(false)}>
                    In stock <X size={13} />
                  </button>
                )}
                {onlyWishlist && (
                  <button type="button" className="shop-chip" onClick={() => setOnlyWishlist(false)}>
                    Saved items <X size={13} />
                  </button>
                )}
                {priceActive && (
                  <button type="button" className="shop-chip" onClick={() => { setPriceMin(''); setPriceMax(''); }}>
                    {priceLabel} <X size={13} />
                  </button>
                )}
                {activeFilterCount + (query ? 1 : 0) > 1 && (
                  <button type="button" className="shop-link-btn" onClick={resetFilters}>Clear all</button>
                )}
              </div>
            )}

            {catalogStatus === 'loading' && products.length === 0 ? (
              <div className="products-grid" aria-label="Loading products">
                {[...Array(8)].map((_, i) => <div key={i} className="pcard-skeleton" aria-hidden="true" />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="shop-empty">
                <h3>
                  {query
                    ? `No results for “${query}”`
                    : selectedCategory !== 'all' && countFor(selectedCategory) === 0
                    ? `${selectedCategoryName || 'This category'} is coming soon`
                    : 'No products match these filters'}
                </h3>
                <p>
                  {query
                    ? 'We can probably still get it for you. Send us the name, a link or a photo and we’ll reply with a price.'
                    : selectedCategory !== 'all' && countFor(selectedCategory) === 0
                    ? "We're adding new stock here. Tell us what you're looking for and we'll source it for you."
                    : 'Try removing a filter, or clear them all.'}
                </p>
                {categoryHints.length > 0 && (
                  <div className="shop-hints">
                    <span>Try a category:</span>
                    {categoryHints.map((c) => (
                      <button key={c.id} type="button" className="shop-chip" onClick={() => { setSearchQuery(''); setSelectedCategory(c.slug); }}>{c.name}</button>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-outline" onClick={resetFilters}>See all products</button>
                  <button type="button" className="btn btn-primary" onClick={() => openQuote(query ? { productName: query } : null)}>
                    {query ? `Ask us to find “${query.length > 24 ? `${query.slice(0, 24)}…` : query}”` : 'Request an item'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="products-grid">
                  {shown.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {filteredProducts.length > shown.length && (
                  <div className="shop-more">
                    <span>Showing {shown.length} of {filteredProducts.length}</span>
                    <button type="button" className="btn btn-outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                      Show {Math.min(PAGE_SIZE, filteredProducts.length - shown.length)} more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
