import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useStore } from './context/StoreContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { AnnouncementBar } from './components/AnnouncementBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuoteModal } from './components/QuoteModal';
import { ReferralModal } from './components/ReferralModal';
import { PreorderTermsModal } from './components/PreorderTermsModal';

import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { ImportTipsPage } from './pages/ImportTipsPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { TrackOrderPage } from './pages/TrackOrderPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';
import { AuthModal } from './components/AuthModal';

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
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(37,99,235,0.06))',
        border: '2px solid rgba(37,99,235,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.6rem',
        animation: 'pulse 1.6s ease-in-out infinite',
      }}
    >
      🛍
    </div>
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
          background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
          borderRadius: '2px',
          animation: 'loadbar 1.2s ease-in-out infinite',
        }}
      />
    </div>
  </div>
);

export const App = () => {
  const { currentPage, toasts, preorderTermsOpen, setPreorderTermsOpen, authLoading } = useStore();

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
      default:          return <HomePage />;
    }
  };

  // Show minimal loader while restoring auth session from JWT
  if (authLoading) return <AuthLoader />;

  return (
    <ErrorBoundary>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Announcement Bar + Navbar */}
        <AnnouncementBar />
        <Navbar />

        {/* Main Routed Page Content */}
        <main style={{ flex: 1 }}>{renderCurrentPage()}</main>

        {/* Global Modals & Drawers */}
        <CartDrawer />
        <ProductDetailModal />
        <QuoteModal />
        <ReferralModal />
        <AuthModal />
        <PreorderTermsModal
          isOpen={preorderTermsOpen}
          onClose={() => setPreorderTermsOpen(false)}
        />

        {/* Footer */}
        <Footer />

        {/* Mobile App Bottom Navigation */}
        <MobileBottomNav />

        {/* Global Toast Alerts */}
        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : ''}`}
            >
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        {/* Floating WhatsApp Quick Action Button with live pulse */}
        <a
          href="https://wa.me/233591440934?text=Hello%20CHARI%20Team%2C%20I%20have%20an%20inquiry%20about%20your%20products."
          target="_blank"
          rel="noreferrer"
          className="floating-wa-btn"
          title="Chat with CHARI on WhatsApp"
        >
          <MessageCircle size={20} />
          <span>Chat with Us</span>
        </a>
      </div>
    </ErrorBoundary>
  );
};
