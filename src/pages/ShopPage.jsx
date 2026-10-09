import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Search,
  Grid,
  List,
  Check
} from 'lucide-react';

export const ShopPage = () => {
  const {
    products,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    wishlist,
    pageParams
  } = useStore();

  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState('featured');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [onlyWishlist, setOnlyWishlist] = useState(pageParams?.filter === 'wishlist');

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return (products || []).filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.categorySlug !== selectedCategory) {
        return false;
      }

      // Wishlist filter
      if (onlyWishlist && !wishlist.some((w) => w.id === product.id)) {
        return false;
      }

      // Fresh stock filter
      if (pageParams?.filter === 'justLanded' && !product.justLanded) {
        return false;
      }

      // Max price filter
      if (product.price > maxPrice) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = product.name?.toLowerCase().includes(q);
        const matchCat = product.category?.toLowerCase().includes(q);
        const matchDesc = product.description?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'newest') return (b.id > a.id ? 1 : -1);
      return 0;
    });
  }, [products, selectedCategory, maxPrice, sortBy, searchQuery, onlyWishlist, wishlist, pageParams]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setMaxPrice(5000);
    setSearchQuery('');
    setOnlyWishlist(false);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    maxPrice < 5000 ||
    searchQuery.trim() !== '' ||
    onlyWishlist;

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        {/* Page Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '32px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px'
            }}
          >
            CHARI Collection
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {onlyWishlist
              ? 'Your Saved Wishlist'
              : selectedCategory === 'all'
              ? 'Shop All Products'
              : (categories || []).find((c) => c.slug === selectedCategory)?.name || 'Category'}
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', maxWidth: '700px' }}>
            Explore our curated collection of premium quality products — kitchen essentials, electronics, mannequins, dresses, and more at unbeatable prices.
          </p>

          {/* Dedicated Shop Search Bar */}
          <div style={{ marginTop: '22px', maxWidth: '640px' }}>
            <div
              className="shop-search-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)',
                border: '1.5px solid var(--border-medium)',
                borderRadius: '14px',
                padding: '4px 6px 4px 16px',
                boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                transition: 'all 0.2s ease',
                gap: '10px'
              }}
            >
              <Search size={19} color="var(--accent)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, category, or description..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  color: 'var(--text-primary)',
                  backgroundColor: 'transparent',
                  padding: '10px 0'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '6px'
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
              <div
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  border: '1px solid var(--border-light)'
                }}
              >
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </div>
            </div>

            {/* Quick Filter Tag Suggestions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                Popular:
              </span>
              {[
                { label: 'Kitchen & Home', slug: 'kitchen-home' },
                { label: 'Electronics', slug: 'electronics' },
                { label: 'Display & Store', slug: 'display-props' },
                { label: 'Fashion & Wear', slug: 'fashion-wear' }
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(pill.slug);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '4px 11px',
                    fontSize: '0.78rem',
                    fontWeight: selectedCategory === pill.slug ? 700 : 500,
                    borderRadius: '20px',
                    backgroundColor: selectedCategory === pill.slug ? 'var(--accent)' : 'var(--bg-card)',
                    color: selectedCategory === pill.slug ? '#ffffff' : 'var(--text-secondary)',
                    border: `1px solid ${selectedCategory === pill.slug ? 'var(--accent)' : 'var(--border-light)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  className="quick-filter-chip"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layout Grid: Sidebar Filters + Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '270px 1fr',
            gap: '32px',
            alignItems: 'start'
          }}
        >
          {/* Desktop Filter Sidebar */}
          <aside
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              padding: '24px',
              border: '1px solid var(--border-light)',
              position: 'sticky',
              top: '100px'
            }}
            className="filter-sidebar"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <SlidersHorizontal size={18} color="var(--accent)" />
                <span>Filter Catalogue</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Wishlist toggle */}
            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: onlyWishlist ? '#ef4444' : 'var(--text-secondary)'
                }}
              >
                <input
                  type="checkbox"
                  checked={onlyWishlist}
                  onChange={(e) => setOnlyWishlist(e.target.checked)}
                />
                Show Saved Wishlist Items ({wishlist.length})
              </label>
            </div>

            {/* Categories */}
            <div style={{ marginBottom: '24px' }}>
              <h4
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: '12px',
                  letterSpacing: '0.05em'
                }}
              >
                Categories
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => setSelectedCategory('all')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.88rem',
                    fontWeight: selectedCategory === 'all' ? 700 : 500,
                    backgroundColor:
                      selectedCategory === 'all' ? 'var(--accent-subtle)' : 'transparent',
                    color: selectedCategory === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
                    textAlign: 'left'
                  }}
                >
                  <span>All Products</span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {products.length}
                  </span>
                </button>

                {(categories || []).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.88rem',
                      fontWeight: selectedCategory === cat.slug ? 700 : 500,
                      backgroundColor:
                        selectedCategory === cat.slug ? 'var(--accent-subtle)' : 'transparent',
                      color:
                        selectedCategory === cat.slug ? 'var(--accent)' : 'var(--text-secondary)',
                      textAlign: 'left'
                    }}
                  >
                    <span>{cat.name}</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {cat.itemCount || products.filter(p => p.categorySlug === cat.slug).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <h4
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    letterSpacing: '0.05em'
                  }}
                >
                  Max Price:
                </h4>
                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  GH₵{maxPrice.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="5000"
                step="20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginTop: '4px'
                }}
              >
                <span>GH₵20</span>
                <span>GH₵5,000</span>
              </div>
            </div>
          </aside>

          {/* Product Listing Main Column */}
          <div>
            {/* Top Toolbar */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '24px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Showing{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{filteredProducts.length}</strong>{' '}
                of {products.length} products
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ArrowUpDown size={16} color="#64748b" />
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                    Sort by:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '20px'
                }}
              >
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                  Active Filters:
                </span>
                {selectedCategory !== 'all' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    Category: {(categories || []).find((c) => c.slug === selectedCategory)?.name || selectedCategory}
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCategory('all')}
                    />
                  </span>
                )}
                {maxPrice < 5000 && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    Max: GH₵{maxPrice}
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMaxPrice(5000)}
                    />
                  </span>
                )}
                {searchQuery && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    Search: "{searchQuery}"
                    <X
                      size={13}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSearchQuery('')}
                    />
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  style={{
                    fontSize: '0.78rem',
                    color: '#ef4444',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    marginLeft: '4px'
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '16px',
                  padding: '60px 20px',
                  textAlign: 'center',
                  border: '1px solid var(--border-light)'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  No matching products found
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
                  Try adjusting your price range or clearing your search term.
                </p>
                <button className="btn btn-primary" onClick={resetFilters}>
                  Clear All Filters
                </button>
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
