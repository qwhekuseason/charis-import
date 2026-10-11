import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { trackOrder as apiTrackOrder } from '../services/api';
import {
  Package,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Calendar,
  MessageCircle,
  AlertCircle,
  Ship,
  Plane,
  Anchor,
  ShieldCheck,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Scale
} from 'lucide-react';

// Four plain-language steps that follow the order status set in Admin.
const STATUS_RANK = { PROCESSING: 0, PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3 };

const buildTrackingSteps = (order) => {
  const status = String(order.orderStatus || order.status || 'PROCESSING').toUpperCase();
  const rank = STATUS_RANK[status] ?? 0;
  const placed = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB') : order.date || '';
  const steps = [
    { title: 'Order received', note: 'We have your order and will contact you on WhatsApp.', time: placed },
    { title: 'Confirmed', note: 'Payment checked and your items ordered from the supplier.' },
    { title: 'Shipped', note: 'On the way to Ghana, then cleared through customs.' },
    { title: 'Delivered', note: 'Delivered to you or ready for pickup.' },
  ];
  return steps.map((step, i) => ({ ...step, done: i <= rank, current: i === rank + 1 && status !== 'DELIVERED' }));
};

// Turns an order from the server into what this page displays.
const toTrackedOrder = (liveOrder) => ({
  ...liveOrder,
  orderId: liveOrder.orderCode,
  status: String(liveOrder.orderStatus || 'PROCESSING').toLowerCase(),
  date: new Date(liveOrder.createdAt).toLocaleDateString('en-GB'),
  shippingMethod: liveOrder.deliveryMethod,
  destination: liveOrder.address ? `${liveOrder.address}, ${liveOrder.city}` : liveOrder.city,
  steps: buildTrackingSteps(liveOrder),
});

export const TrackOrderPage = () => {
  const { orders, WHATSAPP_NUMBER, pageParams } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [phoneInput, setPhoneInput] = useState(pageParams?.prefillPhone || '');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const lookUp = async (code, phone) => {
    setLoading(true);
    try {
      const liveOrder = await apiTrackOrder(code, phone);
      setSearchedOrder(liveOrder ? toTrackedOrder(liveOrder) : null);
    } catch {
      // Fall back to an order placed from this browser (shown even if the server is asleep).
      const local = orders[code];
      setSearchedOrder(local ? { ...local, steps: buildTrackingSteps(local) } : null);
    } finally {
      setHasSearched(true);
      setLoading(false);
    }
  };

  // Opened from the account page or right after checkout
  React.useEffect(() => {
    if (!pageParams?.prefillCode) return;
    const code = pageParams.prefillCode.trim().toUpperCase();
    setSearchInput(code);
    lookUp(code, pageParams.prefillPhone || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams?.prefillCode]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const code = searchInput.trim().toUpperCase();
    if (code) lookUp(code, phoneInput);
  };
  const copyTrackingNumber = () => {
    if (searchedOrder?.orderId) {
      navigator.clipboard?.writeText(searchedOrder.orderId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Determine stage progression (0 to 5)
  const steps = searchedOrder?.steps || [];
  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = Math.min(100, Math.round((completedCount / Math.max(1, steps.length)) * 100));


  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '32px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Search */}
        <div className="glass-panel" style={{ padding: 'clamp(22px, 5vw, 36px) clamp(16px, 4vw, 28px)', marginBottom: '28px', textAlign: 'center' }}>
          
          {/* Header Icon */}
          

          <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Track your order
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Enter your order code and phone number to see where your order is.
          </p>

          {/* Search Bar with Glass Glow */}
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              maxWidth: '640px',
              margin: '0 auto',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 220px',
                backgroundColor: 'var(--bg-card)',
                border: '1.5px solid var(--border-medium)',
                borderRadius: '14px',
                padding: '10px 16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Search size={19} color="var(--text-muted)" />
              <input
                type="text"
                aria-label="Order code"
                placeholder="Order code (e.g. CHR-SEA-7KQ2MX9P)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  marginLeft: '10px',
                  fontSize: '0.94rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  padding: 0
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: '1 1 180px',
                backgroundColor: 'var(--bg-card)',
                border: '1.5px solid var(--border-medium)',
                borderRadius: '14px',
                padding: '10px 16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Phone number used at checkout"
                placeholder="Phone used at checkout"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  width: '100%',
                  fontSize: '0.94rem',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  padding: 0
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ borderRadius: '14px', padding: '12px 22px', fontSize: '0.92rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Tracking...</span>
                </>
              ) : (
                <>
                  <span>Track</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Tracking Guidance */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '22px',
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap'
            }}
          >
            <span>💡 Enter the order code from your WhatsApp receipt together with the phone number you checked out with. Signed in? Your own orders don't need the phone number.</span>
          </div>
        </div>

        {/* Results Console */}
        {hasSearched && searchedOrder ? (
          <div className="glass-panel-elevated" style={{ padding: 'clamp(18px, 4vw, 32px)', marginBottom: '32px' }}>
            
            {/* Top Meta Header */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '24px',
                borderBottom: '1px solid var(--border-light)',
                marginBottom: '28px',
                gap: '16px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--accent)'
                    }}
                  >
                    Order
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                    #{searchedOrder.orderId}
                  </h2>
                  <button
                    onClick={copyTrackingNumber}
                    className="theme-toggle-btn"
                    style={{ width: '32px', height: '32px' }}
                    title="Copy tracking code"
                  >
                    {copiedId ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </div>

                <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span>Customer: <strong style={{ color: 'var(--text-primary)' }}>{searchedOrder.customerName}</strong></span>
                  <span>•</span>
                  <span>Date: <strong style={{ color: 'var(--text-primary)' }}>{searchedOrder.date}</strong></span>
                  {searchedOrder.etaDate && (
                    <>
                      <span>•</span>
                      <span>Expected: <strong style={{ color: '#10b981' }}>{searchedOrder.etaDate}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor:
                      searchedOrder.status === 'on_high_seas'
                        ? 'rgba(6, 182, 212, 0.15)'
                        : searchedOrder.status === 'customs_clearance'
                        ? 'rgba(37, 99, 235, 0.15)'
                        : searchedOrder.status === 'delivered'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color:
                      searchedOrder.status === 'on_high_seas'
                        ? '#0284c7'
                        : searchedOrder.status === 'customs_clearance'
                        ? '#ea580c'
                        : searchedOrder.status === 'delivered'
                        ? '#059669'
                        : '#2563eb',
                    border: '1px solid currentColor'
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'currentColor'
                    }}
                  />
                  {searchedOrder.status?.replace(/_/g, ' ')}
                </span>

                {searchedOrder.waybillNumber && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Waybill: <strong style={{ color: 'var(--text-primary)' }}>{searchedOrder.waybillNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Progress */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Order progress
                </h3>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {completedCount} of {steps.length} steps
                </span>
              </div>

              {/* Desktop Horizontal Milestone Track */}
              <div className="timeline-progress-track">
                <div
                  className="timeline-progress-fill"
                  style={{ width: `calc(${progressPercent}% - 30px)` }}
                />
                
                {steps.map((st, i) => {
                  const isDone = st.done;
                  const isCurrent = st.current;
                  return (
                    <div
                      key={i}
                      className={`timeline-milestone ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="timeline-milestone-bubble">
                        {isDone ? <Check size={16} /> : <span>{i + 1}</span>}
                      </div>
                      <span className="timeline-milestone-label">
                        {st.title.split('&')[0].trim()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Vertical Detailed Step Breakdown */}
              <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {steps.map((st, idx) => {
                  const isDone = st.done;
                  const isCurrent = st.current;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        borderRadius: '14px',
                        backgroundColor: isCurrent ? 'var(--accent-subtle)' : isDone ? 'var(--bg-subtle)' : 'transparent',
                        border: isCurrent
                          ? '1.5px solid var(--accent-border)'
                          : isDone
                          ? '1px solid var(--border-light)'
                          : '1px dashed var(--border-light)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {/* Node Icon */}
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: isDone ? '#10b981' : isCurrent ? 'var(--accent)' : 'var(--bg-card)',
                          color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted)',
                          border: isDone || isCurrent ? 'none' : '2px solid var(--border-medium)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: isCurrent ? '0 0 14px var(--accent-glow)' : 'none'
                        }}
                      >
                        {isDone ? <Check size={18} /> : <span>{idx + 1}</span>}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.96rem',
                              fontWeight: isCurrent ? 800 : 700,
                              color: isDone || isCurrent ? 'var(--text-primary)' : 'var(--text-muted)'
                            }}
                          >
                            {st.title}
                          </span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }}>
                            {st.time}
                          </span>
                        </div>

                        {st.location && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                             {st.location}
                          </div>
                        )}

                        {st.note && (
                          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                            {st.note}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination & Ordered Items Breakdown */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
                padding: '22px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Delivery Destination
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  
                  <span>{searchedOrder.destination || 'Pickup in Accra'}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Fulfillment: {searchedOrder.shippingMethod || 'Standard Importation Logistics'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Order Financial Snapshot
                </span>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                  <span className="currency-ghc">GH₵</span>
                  {searchedOrder.total?.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                   Mobile Money / Card Verified
                </div>
                {(searchedOrder.deliveryFee || searchedOrder.shippingCost) && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Includes GH₵{(searchedOrder.deliveryFee || searchedOrder.shippingCost).toFixed(2)} logistics fee
                  </div>
                )}
              </div>
            </div>

            {/* Consignment Items Breakdown */}
            {searchedOrder.items && Array.isArray(searchedOrder.items) && searchedOrder.items.length > 0 && (
              <div
                style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '14px', letterSpacing: '0.05em' }}>
                  Consignment Items ({searchedOrder.items.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searchedOrder.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {it.image && (
                          <img
                            src={sizedImage(it.image, 160)}
                            alt={it.name}
                            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '8px' }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {it.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Qty: {it.qty || it.quantity || 1} • GH₵{(it.price || 0).toFixed(2)} each
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        GH₵{((it.qty || it.quantity || 1) * (it.price || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concierge & Support Footer */}
            <div
              style={{
                marginTop: '28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Need customs clearance or delivery assistance?
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Our Spintex Rd importation logistics team responds immediately on WhatsApp.
                </div>
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `Hello CHARI Logistics Team, I am requesting an update regarding shipment #${searchedOrder.orderId}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
                style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '0.88rem' }}
              >
                <MessageCircle size={17} />
                <span>WhatsApp Logistics Dispatch</span>
              </a>
            </div>
          </div>
        ) : hasSearched ? (
          <div
            className="glass-panel"
            style={{
              padding: '48px 24px',
              textAlign: 'center'
            }}
          >
            
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No order found for "{searchInput}"
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '22px', maxWidth: '480px', margin: '0 auto 22px' }}>
              Check the order code and make sure the phone number is the one you used at checkout.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline"
                onClick={() => { setSearchInput(''); setHasSearched(false); }}
              >
                Clear Search
              </button>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello CHARI Logistics, I need help tracking my order with query: "${searchInput}"`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={18} />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
