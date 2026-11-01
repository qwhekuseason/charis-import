import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  PackagePlus,
  Search,
  LogOut,
  Package
} from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  { label: 'Deals', page: 'shop', filter: 'deals' },
  { label: 'Categories', page: 'categories' },
  { label: 'Import Tips', page: 'import-tips' },
  { label: 'About Us', page: 'about' },
  { label: 'Contact', page: 'contact' },
];

export const Navbar = () => {
  const {
    currentPage,
    pageParams,
    navigate,
    cartCount,
    cartBump,
    wishlist,
    setCartDrawerOpen,
    setSearchQuery,
    setSelectedCategory,
    user,
    openAuth,
    logout,
    setQuoteModalOpen,
    setReferralModalOpen,
    WHATSAPP_NUMBER
  } = useStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuSearch, setMenuSearch] = useState('');
  const menuRef = useRef(null);
  const toggleRef = useRef(null);

  // A soft shadow once the page scrolls, so the header stands apart from the content.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Phone menu: page stays still behind it, Escape closes it, focus goes in and comes back out.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    menuRef.current?.querySelector('input, button')?.focus({ preventScroll: true });
    const toggle = toggleRef.current;
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
      toggle?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  // Changing page from anywhere (bottom bar, back button) closes the menu.
  useEffect(() => { setMenuOpen(false); }, [currentPage, pageParams]);

  const isActive = (link) => {
    if (link.page !== currentPage) return false;
    if (link.filter) return pageParams?.filter === link.filter;
    // "Shop" isn't also highlighted while the Deals view is showing.
    return link.page !== 'shop' || pageParams?.filter !== 'deals';
  };

  const go = (link) => {
    if (link.filter) navigate('shop', { filter: link.filter });
    else navigate(link.page);
    setMenuOpen(false);
  };

  // Header search icon: go to the Shop and put the cursor in its search box.
  const openSearch = () => {
    navigate('shop');
    setTimeout(() => document.querySelector('.shop-search input')?.focus(), 250);
  };

  const submitMenuSearch = (e) => {
    e.preventDefault();
    setSearchQuery(menuSearch.trim());
    setSelectedCategory('all');
    setMenuSearch('');
    navigate('shop');
  };

  const firstName = user?.name?.split(' ')[0];

  return (
    <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Brand */}
        <a
          href="#/home"
          onClick={(e) => { e.preventDefault(); navigate('home'); }}
          className="brand-logo"
          aria-label="CHARI home"
        >
          <img src="/chari-mark.jpg" alt="" className="brand-mark" width="42" height="42" />
          <span className="brand-words">
            <span className="brand-title">CHARI<span className="brand-dot">.</span></span>
            <span className="brand-sub">Direct Imports</span>
          </span>
        </a>

        {/* Desktop links */}
        <nav className="desktop-nav" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => go(link)}
              className={`nav-link ${isActive(link) ? 'active' : ''} ${link.filter === 'deals' ? 'nav-link-deals' : ''}`}
              aria-current={isActive(link) ? 'page' : undefined}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right-hand actions */}
        <div className="header-actions">
          <button type="button" onClick={() => setQuoteModalOpen(true)} className="navbar-cta-btn nav-cta-request" title="Request an item that isn't in the shop" aria-label="Request an item">
            <PackagePlus size={15} />
            <span className="nav-cta-text">Request Item</span>
          </button>
          <button type="button" onClick={() => setReferralModalOpen(true)} className="navbar-cta-btn nav-cta-earn" title="Give GH₵25, get GH₵25" aria-label="Invite a friend and earn GH₵25">
            <Gift size={15} />
            <span className="nav-cta-text">Earn GH₵25</span>
          </button>

          {user ? (
            <>
              {user.role === 'ADMIN' && (
                <button type="button" onClick={() => navigate('admin')} className={`navbar-text-btn nav-admin ${currentPage === 'admin' ? 'is-active' : ''}`}>
                  <Shield size={14} /> Admin
                </button>
              )}
              <button type="button" onClick={() => navigate('account')} className={`navbar-text-btn nav-account ${currentPage === 'account' ? 'is-active' : ''}`} title="Your account">
                <User size={14} />
                <span>{firstName}</span>
              </button>
            </>
          ) : (
            <button type="button" onClick={() => openAuth('login')} className="navbar-text-btn nav-account">
              <User size={14} /> Sign In
            </button>
          )}

          <button type="button" onClick={openSearch} className="action-btn nav-search-btn" aria-label="Search products" title="Search">
            <Search size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate('shop', { filter: 'wishlist' })}
            className="action-btn"
            aria-label={`Saved items${wishlist.length ? `, ${wishlist.length}` : ''}`}
            title="Saved items"
          >
            <Heart size={18} />
            {wishlist.length > 0 && <span className="badge-counter">{wishlist.length}</span>}
          </button>

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            key={`cart-${cartBump}`}
            className={`action-btn nav-cart ${cartBump ? 'cart-bump' : ''}`}
            title="Cart"
            aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
          >
            <ShoppingBag size={18} />
            {cartCount > 0 && <span className="badge-counter nav-cart-count">{cartCount}</span>}
          </button>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="action-btn mobile-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="nav-drawer"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Phone & tablet menu — slides in from the side. Rendered on <body>: the header's
          frosted-glass effect would otherwise squeeze anything fixed-position into the header bar. */}
      {createPortal(<>
      {menuOpen && <div className="nav-drawer-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
      <aside
        id="nav-drawer"
        ref={menuRef}
        className={`nav-drawer ${menuOpen ? 'is-open' : ''}`}
        aria-label="Menu"
        aria-hidden={!menuOpen}
        inert={menuOpen ? undefined : ''}
      >
        <div className="nav-drawer-head">
          <span className="nav-drawer-title">Menu</span>
          <button type="button" className="nav-drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <form className="nav-drawer-search" role="search" onSubmit={submitMenuSearch}>
          <Search size={17} aria-hidden="true" />
          <input type="search" enterKeyHint="search" placeholder="Search products" aria-label="Search products" value={menuSearch} onChange={(e) => setMenuSearch(e.target.value)} />
        </form>

        {/* Account */}
        <div className="nav-drawer-account">
          {user ? (
            <>
              <div className="nav-drawer-hello">
                <span className="nav-drawer-avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
                <span><strong>Hi, {firstName}</strong><small>{user.email}</small></span>
              </div>
              <div className="nav-drawer-account-links">
                <button type="button" onClick={() => navigate('account')}><Package size={16} /> My orders & account</button>
                {user.role === 'ADMIN' && <button type="button" onClick={() => navigate('admin')}><Shield size={16} /> Admin dashboard</button>}
              </div>
            </>
          ) : (
            <div className="nav-drawer-auth">
              <button type="button" className="btn btn-primary" onClick={() => { setMenuOpen(false); openAuth('login'); }}>Sign in</button>
              <button type="button" className="btn btn-outline" onClick={() => { setMenuOpen(false); openAuth('register'); }}>Create account</button>
            </div>
          )}
        </div>

        <nav className="nav-drawer-links" aria-label="Pages">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => go(link)}
              className={`${isActive(link) ? 'is-active' : ''} ${link.filter === 'deals' ? 'is-deals' : ''}`}
              aria-current={isActive(link) ? 'page' : undefined}
            >
              {link.label}
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          ))}
          <button type="button" onClick={() => go({ page: 'shop', filter: 'wishlist' })} className={isActive({ page: 'shop', filter: 'wishlist' }) ? 'is-active' : ''}>
            <span>Saved items {wishlist.length > 0 && <span className="nav-drawer-count">{wishlist.length}</span>}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <button type="button" onClick={() => go({ page: 'track-order' })} className={isActive({ page: 'track-order' }) ? 'is-active' : ''}>
            Track an order
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>

        <div className="nav-drawer-ctas">
          <button type="button" className="nav-drawer-cta is-request" onClick={() => { setMenuOpen(false); setQuoteModalOpen(true); }}>
            <PackagePlus size={18} />
            <span><strong>Request an item</strong><small>Send a link or photo</small></span>
          </button>
          <button type="button" className="nav-drawer-cta is-earn" onClick={() => { setMenuOpen(false); setReferralModalOpen(true); }}>
            <Gift size={18} />
            <span><strong>Earn GH₵25</strong><small>Invite a friend</small></span>
          </button>
        </div>

        <a className="btn btn-whatsapp btn-block nav-drawer-wa" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
          <MessageCircle size={17} /> Chat on WhatsApp
        </a>
        {user && (
          <button type="button" className="nav-drawer-signout" onClick={() => { setMenuOpen(false); logout(); }}>
            <LogOut size={15} /> Sign out
          </button>
        )}
      </aside>
      </>, document.body)}
    </header>
  );
};
