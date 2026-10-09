import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import {
  ArrowRight,
  ChevronRight,
  MessageCircle,
  Star,
  Ship,
  Package,
  Search,
  ShieldCheck,
  Info,
  Gift,
  Clock,
  Flame,
  CheckCircle2,
  Truck,
  Zap,
} from 'lucide-react';

const floatKeyframes = `
  @keyframes floatA { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
  @keyframes floatB { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-9px); } }
  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(212,175,55,0.4); }
    70%  { box-shadow: 0 0 0 10px rgba(212,175,55,0); }
    100% { box-shadow: 0 0 0 0 rgba(212,175,55,0); }
  }
`;

export const HomePage = () => {
  const {
    navigate,
    setSelectedCategory,
    products,
    categories,
    WHATSAPP_NUMBER,
    setPreorderTermsOpen,
    setQuoteModalOpen,
    setReferralModalOpen,
    referralCode
  } = useStore();
  const [freshStockFilter, setFreshStockFilter] = useState('all');

  const handleCategoryClick = (catSlug) => {
    setSelectedCategory(catSlug);
    navigate('shop');
  };

  const freshStockProducts = products.filter((p) => {
    if (freshStockFilter === 'all') return p.badge === 'New' || p.badge === 'Trending' || p.inStock;
    if (freshStockFilter === 'fashion') {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('wear') || cat.includes('fashion') || cat.includes('dress') || cat.includes('underwear');
    }
    if (freshStockFilter === 'appliances') {
      const cat = (p.category || '').toLowerCase();
      return cat.includes('appliance') || cat.includes('kitchen');
    }
    if (freshStockFilter === 'deals') {
      return p.originalPrice && (p.originalPrice - p.price) / p.originalPrice >= 0.2;
    }
    return true;
  }).slice(0, 10);

  const trendingProducts = products.slice(0, 5);
  const dealProducts = products.filter((p) => p.originalPrice && p.originalPrice > p.price).slice(0, 5);

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', color: 'var(--text-primary)', minHeight: '100vh', transition: 'background-color 0.3s ease' }}>
      <style>{floatKeyframes}</style>

      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 60%, #eff6ff 100%)',
          color: 'var(--text-primary)',
          padding: '88px 0 104px',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {/* Background radial glows */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(ellipse 60% 50% at 80% 50%, rgba(37,99,235,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 60% at 10% 80%, rgba(16,185,129,0.04) 0%, transparent 60%)',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '56px',
              alignItems: 'center',
            }}
          >
            {/* Hero Copy */}
            <div>
              <p
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#0284c7',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ width: '24px', height: '2px', background: '#0284c7', borderRadius: '2px', display: 'inline-block' }} />
                Ghana's Direct Importation Platform
              </p>

              <h1
                style={{
                  fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.03em',
                  color: '#0f172a',
                  marginBottom: '22px',
                  fontFamily: 'var(--font-display)',
                }}
              >
                See it. Send it.<br />
                <span style={{ color: '#2563eb' }}>We'll source it.</span>
              </h1>

              <p
                style={{
                  fontSize: '1rem',
                  color: '#475569',
                  lineHeight: 1.75,
                  maxWidth: '480px',
                  marginBottom: '36px',
                }}
              >
                Apparel, kitchen appliances, mannequins and lifestyle goods — ordered directly from overseas factories and shipped straight to your doorstep anywhere in Ghana.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '38px' }}>
                <button
                  id="hero-browse-preorders"
                  onClick={() => navigate('shop')}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    padding: '14px 30px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                    border: 'none',
                    transition: 'all 0.22s ease',
                    animation: 'pulseRing 2.5s ease infinite',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(37,99,235,0.45)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.35)'; }}
                >
                  Browse Preorders <ArrowRight size={17} />
                </button>

                <button
                  id="hero-custom-sourcing"
                  onClick={() => setQuoteModalOpen(true)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: '#0f172a',
                    padding: '14px 28px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.22s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <Search size={16} /> Custom Sourcing
                </button>
              </div>

              {/* Active Pre-Order Batch Capacity Progress Bar */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '26px',
                  maxWidth: '500px',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Ship size={17} color="#2563eb" />
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                      Container Batch CN-GH-2026-FCL04
                    </span>
                  </div>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb' }}>
                    82% Filled • Departs in 3 Days
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: '82%', height: '100%', background: 'linear-gradient(90deg, #0284c7 0%, #2563eb 100%)', borderRadius: '9999px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginTop: '8px' }}>
                  <span>Guangzhou → Port of Tema (MPS Terminal 3)</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Single Window ICUMS Verified</span>
                </div>
              </div>

              {/* Trust strip */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '18px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                {[
                  { icon: CheckCircle2, text: 'Direct factory procurement' },
                  { icon: CheckCircle2, text: 'MTN MoMo & bank transfer' },
                  { icon: CheckCircle2, text: 'Nationwide dispatch · VIP waybill' },
                ].map((item) => (
                  <span key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                    <item.icon size={13} color="#10b981" />
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero Image */}
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  borderRadius: '20px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 20px 48px rgba(15,23,42,0.12)',
                  position: 'relative',
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&auto=format&fit=crop&q=80"
                  alt="CHARI — quality products"
                  style={{ width: '100%', height: '440px', objectFit: 'cover', display: 'block' }}
                />
                {/* Image overlay gradient */}
                <div
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(15,23,42,0.2) 0%, transparent 60%)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Floating stat card — bottom left */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '28px',
                  left: '-28px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '13px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
                  animation: 'floatA 4s ease-in-out infinite',
                }}
              >
                <div
                  style={{
                    width: '36px', height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(37,99,235,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Ship size={18} color="#2563eb" />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a' }}>500+ Orders</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Shipped this month</div>
                </div>
              </div>

              {/* Floating stat card — top right */}
              <div
                style={{
                  position: 'absolute',
                  top: '22px',
                  right: '-22px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '13px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 12px 32px rgba(15,23,42,0.12)',
                  animation: 'floatB 4s ease-in-out infinite 1.6s',
                }}
              >
                <div
                  style={{
                    width: '38px', height: '38px',
                    borderRadius: '11px',
                    background: 'rgba(16,185,129,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={19} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a' }}>100% Verified</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Quality assured</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value Strip ── */}
      <section style={{ backgroundColor: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', padding: '0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { icon: Ship,          title: 'Direct Factory Import', desc: 'China, Turkey & Dubai suppliers' },
              { icon: Package,       title: 'Sea & Air Freight',      desc: 'Sea: 30–50 days · Air: 7–12 days' },
              { icon: ShieldCheck,   title: 'Tema Port Cleared',      desc: '3–7 day customs clearance' },
              { icon: MessageCircle, title: 'WhatsApp Support',       desc: '+233 59 144 0934' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  style={{ padding: '22px 26px', borderRight: i < 3 ? '1px solid var(--border-light)' : 'none', display: 'flex', alignItems: 'center', gap: '15px', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0, border: '1px solid rgba(37,99,235,0.18)' }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Preorder Notice Banner ── */}
      <section style={{ padding: '24px 0 0' }}>
        <div className="container">
          <div
            id="preorder-notice-banner"
            onClick={() => setPreorderTermsOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', borderLeft: '4px solid #2563eb', padding: '18px 22px', cursor: 'pointer', transition: 'box-shadow 0.2s ease, border-color 0.2s ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.15)'; e.currentTarget.style.borderLeftColor = '#1d4ed8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderLeftColor = '#2563eb'; }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '11px', backgroundColor: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>What to Know Before Ordering</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Preorders are paid in full · Sea freight 30–50 days · Shipping fees paid separately on arrival · Orders locked once placed with supplier.
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#2563eb', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              Read Terms <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Promotional Banner Grid ── */}
      <section style={{ padding: '28px 0 8px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>

            {/* Big Left Banner */}
            <div
              id="promo-banner-main"
              onClick={() => navigate('shop')}
              style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #3b82f6 100%)', borderRadius: '14px', padding: '38px 34px', color: '#ffffff', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '230px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 10px 28px rgba(37,99,235,0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(37,99,235,0.38)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(37,99,235,0.25)'; }}
            >
              <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div>
                <span style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 11px', borderRadius: '5px', marginBottom: '14px', border: '1px solid rgba(255,255,255,0.35)' }}>
                  New Preorder Batch Open
                </span>
                <h3 style={{ fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.2, margin: '0 0 10px', color: '#ffffff' }}>
                  Order Now · Ships Direct from Factory
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', margin: 0, maxWidth: '400px', lineHeight: 1.6 }}>
                  Apparel, appliances, mannequins & lifestyle goods — sourced from overseas manufacturers and cleared through Tema Port to your door.
                </p>
              </div>
              <div style={{ marginTop: '24px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ffffff', color: '#1d4ed8', padding: '10px 20px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}>
                  Browse Preorders <ArrowRight size={15} />
                </span>
              </div>
            </div>

            {/* Right Stacked 2 Banners */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '16px' }}>
              <div
                id="promo-banner-flash"
                onClick={() => navigate('shop')}
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', borderRadius: '14px', padding: '24px 26px', color: '#ffffff', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 6px 20px rgba(249,115,22,0.25)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(249,115,22,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(249,115,22,0.25)'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.9, marginBottom: '4px' }}>
                    <Zap size={13} /> Today's Flash Deals
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>Up to 40% Off</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.88, marginTop: '3px' }}>Discounted retail prices while stock lasts</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={18} color="#ffffff" />
                </div>
              </div>

              <div
                id="promo-banner-momo"
                onClick={() => navigate('shop')}
                style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '14px', padding: '24px 26px', color: '#0f172a', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(15,23,42,0.05)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 26px rgba(15,23,42,0.08)'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.05)'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px', color: '#0284c7' }}>
                    <Truck size={13} /> Payment & Wholesale
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>MoMo & Bulk Pricing</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '3px' }}>Pay via MTN / Telecel MoMo or COD in Accra</div>
                </div>
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ArrowRight size={18} color="#2563eb" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      <section style={{ padding: '36px 0 20px' }}>
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading-title">Shop by Category</h2>
            <button
              className="section-heading-link"
              onClick={() => navigate('categories')}
            >
              See all <ChevronRight size={15} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '12px',
              paddingTop: '4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  width: '108px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: 'var(--shadow-xs)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(212,175,55,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                }}
              >
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    maxHeight: '2.5em'
                  }}
                >
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Custom Sourcing CTA ── */}
      <section style={{ padding: '30px 0 10px' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 60%, #eff6ff 100%)',
              borderRadius: '18px',
              padding: '40px 44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '28px',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #bfdbfe',
              boxShadow: '0 8px 30px rgba(37,99,235,0.08)'
            }}
          >
            {/* Decorative background circle */}
            <div
              style={{
                position: 'absolute',
                right: '-60px',
                top: '-60px',
                width: '220px',
                height: '220px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(37,99,235,0.1) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(37,99,235,0.12)',
                  border: '1px solid rgba(37,99,235,0.25)',
                  color: '#1d4ed8',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  marginBottom: '12px'
                }}
              >
                Direct Factory Sourcing
              </div>
              <h2
                style={{
                  fontSize: 'clamp(1.4rem, 3vw, 2rem)',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em',
                  margin: '0 0 10px'
                }}
              >
                SEE IT. SEND IT.<br />
                <span style={{ color: '#2563eb' }}>WE'LL SOURCE IT.</span>
              </h2>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, maxWidth: '480px', lineHeight: 1.6 }}>
                Spotted something on 1688, Taobao, Shein or Instagram? Send us the link or photo and we will procure it directly from the factory, clear it through Tema Port, and deliver it to you anywhere in Ghana.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
              <button
                id="sourcing-start-request"
                onClick={() => setQuoteModalOpen(true)}
                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#ffffff', padding: '15px 30px', borderRadius: '11px', border: 'none', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(37,99,235,0.3)', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(37,99,235,0.45)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.3)'; }}
              >
                <Search size={17} /> Start Sourcing Request
              </button>
              <a
                href="https://wa.me/233591440934?text=Hello%20CHARI%20Team%2C%20I%20want%20to%20request%20a%20custom%20sourcing%20quote."
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: '#25D366', color: '#ffffff', border: 'none', padding: '13px 30px', borderRadius: '11px', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(37,211,102,0.25)', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,211,102,0.35)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.25)'; }}
              >
                <MessageCircle size={16} /> WhatsApp Directly
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Today's Deals (Jumia-Style Flash Deals Band) ── */}
      {dealProducts.length > 0 && (
        <section style={{ padding: '16px 0 32px' }}>
          <div className="container">
            {/* Header Strip */}
            <div
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                borderRadius: '12px 12px 0 0',
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1.2rem',
                    letterSpacing: '-0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Flame size={20} color="#fff" className="flame-animated" /> Today's Flash Deals
                </span>
                <span
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: '#c2410c',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Up to 40% Off
                </span>

                {/* Countdown Timer Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    backgroundColor: 'rgba(0,0,0,0.22)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  <Clock size={13} />
                  <span>Ends in: <strong>11h : 42m : 18s</strong></span>
                </div>
              </div>
              <button
                onClick={() => navigate('shop', { filter: 'deals' })}
                style={{
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer'
                }}
              >
                See All Deals <ChevronRight size={15} />
              </button>
            </div>

            {/* Deals Product Grid Container */}
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '0 0 14px 14px', padding: '22px', border: '1px solid var(--border-light)', borderTop: 'none', boxShadow: 'var(--shadow-sm)' }}>
              <div className="products-grid">
                {dealProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Referral Program Showcase Banner ── */}
      <section style={{ padding: '0 0 32px' }}>
        <div className="container">
          <div
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '28px 32px',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '20px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 4px 20px rgba(15,23,42,0.05)'
            }}
          >
            <div style={{ maxWidth: '580px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'rgba(249,115,22,0.1)',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#ea580c',
                  border: '1px solid rgba(249,115,22,0.25)',
                  marginBottom: '10px'
                }}
              >
                <Gift size={14} color="#ea580c" /> CHARI Referral Rewards
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                Give GH₵25, Get GH₵25 For Every Friend You Invite!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Share your personal code <strong style={{ color: '#0f172a' }}>{referralCode}</strong>. Friends get GH₵25 OFF their first imported order, and you get GH₵25 store credit directly into your wallet.
              </p>
            </div>

            <button
              onClick={() => setReferralModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '13px 26px',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              <Gift size={18} color="#ffffff" />
              Invite & Earn Credits
            </button>
          </div>
        </div>
      </section>

      {/* ── Trending Products ── */}
      <section style={{ backgroundColor: 'var(--bg-card)', padding: '52px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="section-heading">
            <h2 className="section-heading-title">Trending Now</h2>
            <button
              className="section-heading-link"
              onClick={() => navigate('shop')}
            >
              See all <ChevronRight size={15} />
            </button>
          </div>

          <div className="products-grid">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Fresh Stock & Deals ── */}
      <section style={{ padding: '52px 0' }}>
        <div className="container">
          <div
            className="section-heading"
            style={{
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <h2 className="section-heading-title">Fresh Stock &amp; Deals</h2>

            {/* Tab Switcher */}
            <div style={{ display: 'flex', backgroundColor: 'var(--bg-subtle)', padding: '3px', borderRadius: '9px', gap: '2px', border: '1px solid var(--border-light)' }}>
              {[
                { id: 'all',        label: 'All'        },
                { id: 'fashion',    label: 'Fashion'    },
                { id: 'appliances', label: 'Appliances' },
                { id: 'deals',      label: 'Best Deals' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFreshStockFilter(tab.id)}
                  style={{ padding: '7px 16px', borderRadius: '7px', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: freshStockFilter === tab.id ? 'var(--bg-card)' : 'transparent', color: freshStockFilter === tab.id ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: freshStockFilter === tab.id ? 'var(--shadow-sm)' : 'none', transition: 'all 0.15s ease' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="products-grid">
            {freshStockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Customer Reviews ── */}
      <section style={{ backgroundColor: 'var(--bg-card)', padding: '60px 0', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div className="section-heading" style={{ marginBottom: '32px' }}>
            <div>
              <h2 className="section-heading-title">What Customers Say</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 0 14px' }}>
                From Accra, Kumasi, Takoradi &amp; beyond.
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
            }}
          >
            {[
              { stars: 5, quote: 'Ordered a commercial blender and kids sets to Kumasi. Packaged well and arrived at VIP station within 24 hours.', name: 'Nana Ama S.', location: 'Adum, Kumasi', initials: 'NA', accentColor: '#2563eb', accentBg: 'rgba(37,99,235,0.1)' },
              { stars: 5, quote: 'Same-day delivery to East Legon. The ladies dresses fit true to size and were exactly as shown.', name: 'Esi Mensah', location: 'East Legon, Accra', initials: 'EM', accentColor: '#2563eb', accentBg: 'rgba(37,99,235,0.1)' },
              { stars: 4, quote: 'They replied on WhatsApp within minutes when I had questions about the mannequin sizes. MoMo payment was smooth.', name: 'Kofi B.', location: 'Takoradi', initials: 'KB', accentColor: '#10b981', accentBg: 'rgba(16,185,129,0.12)' },
            ].map((r, i) => (
              <div
                key={i}
                className="review-card"
                style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px', backgroundColor: 'var(--bg-canvas)', borderRadius: '16px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={14} fill={s <= r.stars ? '#f59e0b' : 'none'} color={s <= r.stars ? '#f59e0b' : 'var(--border-light)'} />
                  ))}
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '5px', fontWeight: 600 }}>Verified</span>
                </div>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.72, margin: 0, flex: 1 }}>
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: r.accentBg, color: r.accentColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>
                    {r.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{r.location} · <span style={{ color: '#10b981' }}>Verified</span></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WhatsApp Contact Strip ── */}
      <section style={{ padding: '60px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '28px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', borderRadius: '18px', padding: '44px 44px', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(15,23,42,0.06)' }}>
            <div>
              <h3 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.2 }}>
                Have a question? Talk to us directly.
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0 }}>
                Sizing, bulk orders, custom sourcing — we're on WhatsApp daily.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%20CHARI%20Team,%20I%20have%20an%20inquiry.`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#25D366', color: '#ffffff', padding: '13px 24px', borderRadius: '10px', fontWeight: 700, fontSize: '0.92rem', boxShadow: '0 4px 14px rgba(37,211,102,0.25)', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(37,211,102,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.25)'; }}
              >
                <MessageCircle size={17} /> WhatsApp Us
              </a>
              <button
                id="contact-page-btn"
                onClick={() => navigate('contact')}
                style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', padding: '13px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.03)', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#ffffff'; }}
              >
                Contact Page
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
