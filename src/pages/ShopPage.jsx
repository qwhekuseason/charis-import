import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { productCategorySlug } from '../utils/categories';
import { SlidersHorizontal, X, Search, ChevronDown } from 'lucide-react';

const PRICE_MAX = 5000;

export const ShopPage = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    wishlist,
    pageParams,
    setQuoteModalOpen
  } = useStore();

  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false); // phones & tablets only
  const [onlyWishlist, setOnlyWishlist] = useState(pageParams?.filter === 'wishlist');
  const [onlyDeals, setOnlyDeals] = useState(pageParams?.filter === 'deals');

  // Navbar links like "Deals" or the wishlist heart can open this page while it's already showing.
  useEffect(() => {
    setOnlyDeals(pageParams?.filter === 'deals');
    setOnlyWishlist(pageParams?.filter === 'wishlist');
  }, [pageParams?.filter]);

  const countFor =(slug) => (products || []).filter((p) => productCategorySlug(p) === slug).length;

  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      if (selectedCategory !== 'all' && productCategorySlug(product) !== selectedCategory) return false;
      if (onlyWishlist && !wishlist.some((w) => w.id === product.id)) return false;
      if (onlyDeals && !(product.originalPrice > product.price)) return false;
      if (product.price > maxPrice) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      return 0;
    });
  }, [products, selectedCategory, maxPrice, sortBy, searchQuery, onlyWishlist, onlyDeals, wishlist]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setMaxPrice(PRICE_MAX);
    setSearchQuery('');
    setOnlyWishlist(false);
    setOnlyDeals(false);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (maxPrice < PRICE_MAX ? 1 : 0) +
    (onlyWishlist ? 1 : 0) +
    (onlyDeals ? 1 : 0);

  const selectedCategoryName = (categories || []).find((c) => c.slug === selectedCategory)?.name;

  const chooseCategory = (slug) => {
    setSelectedCategory(slug);
    setFiltersOpen(false); // on phones, close the panel so the products are visible right away
  };

  const pageTitle = onlyWishlist
    ? 'Saved Items'
    : onlyDeals
    ? 'Deals'
    : selectedCategory === 'all'
    ? 'All Products'
    : selectedCategoryName || 'Products';

  return (
    <div className="section shop-page">
      <div className="container">
        {/* Header */}
        <div className="shop-header">
          <h1 className="shop-title">{pageTitle}</h1>
          <p className="shop-subtitle">
            Order from overseas suppliers and we deliver to you anywhere in Ghana.
          </p>

          <div className="shop-search">
            <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search" className="shop-search-clear">
                <X size={16} />
              </button>
            )}
          </div>
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
                {(categories || []).map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    className={`shop-category ${selectedCategory === cat.slug ? 'active' : ''}`}
                    onClick={() => chooseCategory(cat.slug)}
                  >
                    <span>{cat.name}</span>
                    <span className="shop-category-count">{countFor(cat.slug)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="shop-filter-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 className="shop-filter-label" style={{ margin: 0 }}>Max price</h4>
                <strong style={{ fontSize: '0.92rem' }}>GH₵{maxPrice.toLocaleString()}</strong>
              </div>
              <input
                type="range"
                min="20"
                max={PRICE_MAX}
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Maximum price"
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
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

              <span className="shop-count">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>

              <label className="shop-sort">
                <span>Sort</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="featured">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>

            {activeFilterCount > 0 && (
              <div className="shop-chips">
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
                {onlyWishlist && (
                  <button type="button" className="shop-chip" onClick={() => setOnlyWishlist(false)}>
                    Saved items <X size={13} />
                  </button>
                )}
                {maxPrice < PRICE_MAX && (
                  <button type="button" className="shop-chip" onClick={() => setMaxPrice(PRICE_MAX)}>
                    Up to GH₵{maxPrice.toLocaleString()} <X size={13} />
                  </button>
                )}
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="shop-empty">
                <h3>
                  {selectedCategory !== 'all' && countFor(selectedCategory) === 0
                    ? `${selectedCategoryName || 'This category'} is coming soon`
                    : 'No products found'}
                </h3>
                <p>
                  {selectedCategory !== 'all' && countFor(selectedCategory) === 0
                    ? "We're adding new stock here. Tell us what you're looking for and we'll source it for you."
                    : 'Try a different search or clear your filters.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-outline" onClick={resetFilters}>See all products</button>
                  <button className="btn btn-primary" onClick={() => setQuoteModalOpen(true)}>Request an item</button>
                </div>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
