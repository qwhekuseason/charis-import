import React, { lazy, Suspense, useEffect, useRef } from 'react';
import { MessageCircle, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';

// Everything below is downloaded only when first needed, so shoppers on mobile data
// don't pay for the admin panel, checkout or modals just to see the homepage.
// If a visitor had the site open during a redeploy, the old page files no longer exist —
// reload once to pick up the new version instead of showing an error.
const named = (loader, name) => lazy(() =>
  loader()
    .then((m) => {
      sessionStorage.removeItem('chari_chunk_reload');
      return { default: m[name] };
    })
    .catch((err) => {
      if (!sessionStorage.getItem('chari_chunk_reload')) {
        sessionStorage.setItem('chari_chunk_reload', '1');
        window.location.reload();
        return new Promise(() => {});
      }
      throw err;
    })
);

const ShopPage = named(() => import('./pages/ShopPage'), 'ShopPage');
const CategoriesPage = named(() => import('./pages/CategoriesPage'), 'CategoriesPage');
const ImportTipsPage = named(() => import('./pages/ImportTipsPage'), 'ImportTipsPage');
const AboutPage = named(() => import('./pages/AboutPage'), 'AboutPage');
const ContactPage = named(() => import('./pages/ContactPage'), 'ContactPage');
const TrackOrderPage = named(() => import('./pages/TrackOrderPage'), 'TrackOrderPage');
const CheckoutPage = named(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const AccountPage = named(() => import('./pages/AccountPage'), 'AccountPage');
const AdminPage = named(() => import('./pages/AdminPage'), 'AdminPage');
const ResetPasswordPage = named(() => import('./pages/ResetPasswordPage'), 'ResetPasswordPage');

const CartDrawer = named(() => import('./components/CartDrawer'), 'CartDrawer');
const ProductDetailModal = named(() => import('./components/ProductDetailModal'), 'ProductDetailModal');
const QuoteModal = named(() => import('./components/QuoteModal'), 'QuoteModal');
const ReferralModal = named(() => import('./components/ReferralModal'), 'ReferralModal');
const PreorderTermsModal = named(() => import('./components/PreorderTermsModal'), 'PreorderTermsModal');
const AuthModal = named(() => import('./components/AuthModal'), 'AuthModal');

// Lightweight placeholder while a page's code downloads.
const PageLoader = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '36px', height: '3px', borderRadius: '2px', background: 'var(--border-medium)', overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#8a6a22', borderRadius: '2px', animation: 'loadbar 1.2s ease-in-out infinite' }} />
    </div>
  </div>
);

// Full-screen auth loader — shown while JWT session is being validated
const AuthLoader = () => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '20px',
      background: 'var(--bg-base)',
      zIndex: 9999,
    }}
  >
    <div
      style={{
        width: '36px',
        height: '3px',
        borderRadius: '2px',
        background: 'var(--border-medium)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#8a6a22',
          borderRadius: '2px',
          animation: 'loadbar 1.2s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

export const App = () => {
  const {
    currentPage,
    toasts,
    preorderTermsOpen,
    setPreorderTermsOpen,
    authLoading,
    cartDrawerOpen,
    selectedProduct,
    quoteModalOpen,
    referralModalOpen,
    authModalOpen,
    WHATSAPP_NUMBER,
    setCartDrawerOpen,
    setSelectedProduct,
    setQuoteModalOpen,
    setReferralModalOpen,
    setAuthModalOpen,
    dismissToast,
  } = useStore();

  // Drawers and modals, topmost first — Escape closes the one on top.
  const overlays = [
    [authModalOpen, () => setAuthModalOpen(false)],
    [preorderTermsOpen, () => setPreorderTermsOpen(false)],
    [referralModalOpen, () => setReferralModalOpen(false)],
    [quoteModalOpen, () => setQuoteModalOpen(false)],
    [Boolean(selectedProduct), () => setSelectedProduct(null)],
    [cartDrawerOpen, () => setCartDrawerOpen(false)],
  ];
  const topOverlay = overlays.find(([open]) => open);
  const overlayOpen = Boolean(topOverlay);
  const closeTopRef = useRef(null);
  closeTopRef.current = topOverlay?.[1];

  // While something is open: keep the page behind it still, and let Escape close it.
  useEffect(() => {
    if (!overlayOpen) return undefined;
    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;
    const onKey = (e) => { if (e.key === 'Escape') closeTopRef.current?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      window.removeEventListener('keydown', onKey);
    };
  }, [overlayOpen]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':      return <HomePage />;
      case 'shop':      return <ShopPage />;
      case 'categories':return <CategoriesPage />;
      case 'import-tips': return <ImportTipsPage />;
      case 'about':     return <AboutPage />;
      case 'contact':   return <ContactPage />;
      case 'track-order': return <TrackOrderPage />;
      case 'checkout':  return <CheckoutPage />;
      case 'account':   return <AccountPage />;
      case 'admin':     return <AdminPage />;
      case 'reset-password': return <ResetPasswordPage />;
      default:          return <HomePage />;
    }
  };

  // Only signed-in pages wait for the saved session to be checked — the rest of the
  // store renders immediately even if the server is slow to wake up.
  if (authLoading && (currentPage === 'account' || currentPage === 'admin')) return <AuthLoader />;

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Announcement Bar + Navbar */}
        <AnnouncementBar />
        <Navbar />

        {/* Main Routed Page Content */}
        <main style={{ flex: 1 }}>
          <Suspense fallback={<PageLoader />}>{renderCurrentPage()}</Suspense>
        </main>

        {/* Global Modals & Drawers — each one's code loads the first time it opens */}
        <Suspense fallback={null}>
          {cartDrawerOpen && <CartDrawer />}
          {selectedProduct && <ProductDetailModal />}
          {quoteModalOpen && <QuoteModal />}
          {referralModalOpen && <ReferralModal />}
          {authModalOpen && <AuthModal />}
          {preorderTermsOpen && (
            <PreorderTermsModal
              isOpen={preorderTermsOpen}
              onClose={() => setPreorderTermsOpen(false)}
            />
          )}
        </Suspense>

        {/* Footer */}
        <Footer />

        {/* Mobile App Bottom Navigation */}
        <MobileBottomNav />

        {/* Global Toast Alerts */}
        <div className="toast-container" role="status" aria-live="polite">
          {toasts.map((toast) => {
            const tone = toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : toast.type === 'warning' ? 'warning' : 'info';
            const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle;
            return (
              <div key={toast.id} className={`toast ${tone}`}>
                <Icon size={18} className="toast-icon" aria-hidden="true" />
                <span className="toast-message">{toast.message}</span>
                {toast.action && (
                  <button
                    type="button"
                    className="toast-action"
                    onClick={() => { toast.action.onClick(); dismissToast(toast.id); }}
                  >
                    {toast.action.label}
                  </button>
                )}
                <button type="button" className="toast-close" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Floating WhatsApp Quick Action Button with live pulse */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I have a question about your products.')}`}
          target="_blank"
          rel="noreferrer"
          className={`floating-wa-btn ${overlayOpen ? 'is-hidden' : ''} ${currentPage === 'checkout' ? 'is-checkout' : ''}`}
          title="Chat with CHARI on WhatsApp"
          aria-label="Chat with CHARI on WhatsApp"
          aria-hidden={overlayOpen || undefined}
          tabIndex={overlayOpen ? -1 : undefined}
        >
          <MessageCircle size={20} />
          <span className="floating-wa-label">Chat with Us</span>
        </a>
      </div>
    </ErrorBoundary>
  );
};
