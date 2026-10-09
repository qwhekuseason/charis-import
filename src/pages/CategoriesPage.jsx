import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowRight, Layers } from 'lucide-react';

export const CategoriesPage = () => {
  const { categories, products, setSelectedCategory, navigate } = useStore();

  const handleSelectCategory = (catSlug) => {
    setSelectedCategory(catSlug);
    navigate('shop');
  };

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '36px',
            marginBottom: '40px',
            border: '1px solid var(--border-light)',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '0 auto 40px'
          }}
        >
          <span className="section-pretitle">All Product Collections</span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Browse Product Categories
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            Explore all categories — kitchen essentials, electronics, fashion, lifestyle, and home goods with reliable delivery anywhere in Ghana.
          </p>
        </div>

        {/* Categories Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {(categories || []).map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.slug)}
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 32px rgba(15,23,42,0.14)';
                e.currentTarget.style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = 'var(--border-light)';
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '190px' }}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '9999px'
                  }}
                >
                  {cat.itemCount} Products
                </div>
              </div>

              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '6px'
                  }}
                >
                  {cat.name}
                </h3>
                <p
                  style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '18px',
                    flex: 1
                  }}
                >
                  {cat.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-light)',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    color: 'var(--accent)'
                  }}
                >
                  <span>Explore Items</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
