import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingBag,
  Heart,
  MessageCircle,
  Menu,
  X,
  ChevronRight,
  User,
  Shield,
  Gift,
  Flame,
  PackagePlus
} from 'lucide-react';

export const Navbar = () => {
  const {
    fxRates,
    currentPage,
    pageParams,
    navigate,
    cartCount,
    wishlist,
    setCartDrawerOpen,
    setSelectedProduct,
    setSelectedCategory,
    products,
    user,
    openAuth,
    setQuoteModalOpen,
    setReferralModalOpen
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryNav = (catSlug) => {
    setSelectedCategory(catSlug);
    navigate('shop');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Home', page: 'home' },
    { label: 'Shop', page: 'shop' },
    { label: 'Deals', page: 'shop', filter: 'deals' },
    { label: 'Categories', page: 'categories' },
    { label: 'Import Tips', page: 'import-tips' },
    { label: 'About Us', page: 'about' },
    { label: 'Contact', page: 'contact' },
  ];

  return (
    <header className="site-header">
      {/* Main Navbar */}
      <div className="container navbar-container">

        {/* Brand Logo */}
        <div
          onClick={() => navigate('home')}
          className="brand-logo"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img
            src="/charis-logo.jpeg"
            alt="CHARI"
            style={{
              width: '42px',
              height: '42px',
              objectFit: 'contain',
              borderRadius: '8px',
              display: 'block'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-title" style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}>
              CHARI<span style={{ color: 'var(--accent)' }}>.</span>
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Direct Imports
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navLinks.map((link) => {
            const isActive = currentPage === link.page && (!link.filter || pageParams?.filter === link.filter);
            return (
              <button
                key={link.label}
                onClick={() => {
                  if (link.filter) {
                    navigate('shop', { filter: link.filter });
                  } else {
                    navigate(link.page);
                  }
                }}
                className={`nav-link ${isActive ? 'active' : ''}`}
                style={link.filter === 'deals' ? { color: '#ea580c', fontWeight: 700 } : {}}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* Request Item Button */}
          <button
            onClick={() => setQuoteModalOpen(true)}
            className="navbar-cta-btn"
            style={{
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              backgroundColor: 'var(--accent-subtle)',
              border: '1.5px solid var(--accent-border)',
              color: 'var(--accent)',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            title="Request an item not listed on the store"
          >
            <PackagePlus size={15} color="var(--accent)" />
            <span>Request Item</span>
          </button>

          {/* Referral / Earn Button */}
          <button
            onClick={() => setReferralModalOpen(true)}
            className="navbar-cta-btn"
            style={{
              alignItems: 'center',
              gap: '5px',
              padding: '7px 12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1.5px solid rgba(16, 185, 129, 0.28)',
              color: '#10b981',
              borderRadius: '10px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
            title="Give GH₵25, Get GH₵25"
          >
            <Gift size={14} color="#10b981" />
            <span>Earn GH₵25</span>
          </button>

          {/* User / Account */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {user.role === 'ADMIN' && (
                <button
                  onClick={() => navigate('admin')}
                  className="navbar-text-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    border: '1.5px solid var(--accent-border)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <Shield size={13} />
                  Admin
                </button>
              )}
              <button
                onClick={() => navigate('account')}
                className="navbar-text-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  maxWidth: '120px',
                  overflow: 'hidden'
                }}
              >
                <User size={14} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name.split(' ')[0]}
                </span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuth('login')}
              className="navbar-text-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <User size={14} />
              Sign In
            </button>
          )}

          {/* Wishlist */}
          <button
            onClick={() => navigate('shop', { filter: 'wishlist' })}
            className="action-btn"
            title="Wishlist"
            style={{ borderRadius: '10px' }}
          >
            <Heart size={18} />
            {wishlist.length > 0 && (
              <span className="badge-counter">{wishlist.length}</span>
            )}
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartDrawerOpen(true)}
            className="action-btn"
            title="Cart"
            style={{ background: '#2563eb', color: '#ffffff', borderRadius: '10px', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="badge-counter" style={{ background: '#f97316', color: '#ffffff' }}>{cartCount}</span>
            )}
          </button>

          {/* Mobile Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="action-btn mobile-menu-toggle"
            aria-label="Toggle menu"
            style={{ borderRadius: '10px' }}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderTop: '1px solid var(--border-light)',
            padding: '14px 20px 24px',
          }}
        >

          {/* Mobile Nav Links */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {navLinks.map((link, i) => (
              <button
                key={link.label}
                onClick={() => {
                  if (link.filter) {
                    navigate('shop', { filter: link.filter });
                  } else {
                    navigate(link.page);
                  }
                  setMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  fontSize: '0.95rem',
                  fontWeight: currentPage === link.page ? 700 : 500,
                  color: currentPage === link.page ? 'var(--accent)' : 'var(--text-primary)',
                  borderBottom: i < navLinks.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: 'transparent'
                }}
              >
                {link.label}
                <ChevronRight size={15} color="var(--text-muted)" />
              </button>
            ))}
          </div>

          {/* Quick Mobile Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setQuoteModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 12px',
                backgroundColor: 'var(--accent-subtle)',
                border: '1.5px solid var(--accent-border)',
                color: 'var(--accent)',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <PackagePlus size={16} color="var(--accent)" />
              Request Item
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setReferralModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px 12px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1.5px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                borderRadius: '10px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Gift size={16} color="#10b981" />
              Earn GH₵25
            </button>
          </div>

          {/* Mobile WhatsApp */}
          <div style={{ marginTop: '16px' }}>
            <a
              href="https://wa.me/233591440934"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                padding: '11px 20px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                width: '100%'
              }}
            >
              <MessageCircle size={17} /> Chat on WhatsApp
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
