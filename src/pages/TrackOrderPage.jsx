import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { SmartImage } from '../components/SmartImage';
import { sizedImage } from '../utils/images';
import { trackOrder as apiTrackOrder } from '../services/api';
import './TrackOrderPage.css';
import {
  Search,
  MessageCircle,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Package,
  X,
  Clock
} from 'lucide-react';

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
// "25 Oct 2026" from a server timestamp or a date saved on this phone.
const niceDate = (value) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// Four plain-language steps that follow the order status set in Admin.
const STATUS_RANK = { PROCESSING: 0, PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3 };

const STATUS_LABEL = {
  PROCESSING: { text: 'Received', tone: 'info' },
  PENDING: { text: 'Received', tone: 'info' },
  CONFIRMED: { text: 'Confirmed', tone: 'info' },
  SHIPPED: { text: 'On the way', tone: 'info' },
  DELIVERED: { text: 'Delivered', tone: 'success' },
  CANCELLED: { text: 'Cancelled', tone: 'danger' },
};

// What the customer needs to know about their money.
const PAYMENT_LABEL = {
  PENDING: { text: 'Payment not received yet', tone: 'warning' },
  VERIFYING: { text: "We're checking your payment", tone: 'warning' },
  PAID: { text: 'Paid', tone: 'success' },
  REFUNDED: { text: 'Refunded', tone: 'muted' },
};

const buildTrackingSteps = (order) => {
  const status = String(order.orderStatus || order.status || 'PROCESSING').toUpperCase();
  const rank = STATUS_RANK[status] ?? 0;
  const placed = niceDate(order.createdAt || order.date);
  // A cancelled order must not look like it is still on its way.
  if (status === 'CANCELLED') {
    return [
      { title: 'Order received', note: 'We received your order.', time: placed, done: true },
      { title: 'Cancelled', note: 'This order was cancelled. If you paid, we will contact you about your refund.', done: true, cancelled: true },
    ];
  }
  const steps = [
    { title: 'Order received', note: 'We have your order and will contact you on WhatsApp.', time: placed },
    { title: 'Confirmed', note: 'Payment checked and your items ordered from the supplier.' },
    { title: 'Shipped', note: 'On the way to Ghana, then cleared through customs.' },
    { title: 'Delivered', note: 'Delivered to you or ready for pickup.' },
  ];
  return steps.map((step, i) => ({ ...step, done: i <= rank, current: i === rank + 1 && status !== 'DELIVERED' }));
};

// Turns an order from the server (or one saved on this phone) into what this page displays.
const toTrackedOrder = (order) => ({
  ...order,
  orderId: order.orderCode || order.orderId,
  statusKey: String(order.orderStatus || order.status || 'PROCESSING').toUpperCase(),
  date: niceDate(order.createdAt || order.date),
  shippingMethod: order.deliveryMethod || order.shippingMethod,
  destination: order.address ? [order.address, order.city].filter(Boolean).join(', ') : order.destination || order.city,
  steps: buildTrackingSteps(order),
});

export const TrackOrderPage = () => {
  const { orders, WHATSAPP_NUMBER, pageParams, showToast } = useStore();
  const [searchInput, setSearchInput] = useState(pageParams?.prefillCode || '');
  const [phoneInput, setPhoneInput] = useState(pageParams?.prefillPhone || '');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searchedCode, setSearchedCode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [fromDevice, setFromDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  // Orders placed from this phone, newest first — one tap to track them.
  const recentOrders = Object.values(orders || {})
    .filter((o) => o && (o.orderCode || o.orderId))
    .sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')))
    .slice(0, 4);

  const lookUp = async (code, phone) => {
    setLoading(true);
    setSearchedCode(code);
    try {
      const liveOrder = await apiTrackOrder(code, phone);
      setSearchedOrder(liveOrder ? toTrackedOrder(liveOrder) : null);
      setFromDevice(false);
    } catch {
      // Fall back to an order placed from this browser (shown even if the server is asleep).
      const local = orders[code];
      setSearchedOrder(local ? toTrackedOrder(local) : null);
      setFromDevice(Boolean(local));
    } finally {
      setHasSearched(true);
      setLoading(false);
      // On phones the result is below the form — bring it into view.
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
  };

  // Opened from the account page or right after checkout
  useEffect(() => {
    if (!pageParams?.prefillCode) return;
    const code = pageParams.prefillCode.trim().toUpperCase();
    setSearchInput(code);
    lookUp(code, pageParams.prefillPhone || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams?.prefillCode]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const code = searchInput.trim().toUpperCase();
    if (!code) {
      setCodeError('Enter the order code from your receipt or WhatsApp message.');
      return;
    }
    setCodeError('');
    lookUp(code, phoneInput);
  };

  const trackRecent = (order) => {
    const code = order.orderCode || order.orderId;
    setSearchInput(code);
    setPhoneInput(order.phone || '');
    setCodeError('');
    lookUp(code, order.phone || '');
  };

  const copyCode = () => {
    if (!searchedOrder?.orderId) return;
    navigator.clipboard?.writeText(searchedOrder.orderId);
    setCopied(true);
    showToast('Order code copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const clearSearch = () => {
    setSearchInput('');
    setHasSearched(false);
    setSearchedOrder(null);
  };

  const steps = searchedOrder?.steps || [];
  const doneCount = steps.filter((s) => s.done).length;
  const status = searchedOrder ? (STATUS_LABEL[searchedOrder.statusKey] || STATUS_LABEL.PROCESSING) : null;
  const payment = searchedOrder?.paymentStatus ? PAYMENT_LABEL[searchedOrder.paymentStatus] : null;
  const items = Array.isArray(searchedOrder?.items) ? searchedOrder.items : [];
  const helpLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <div className="section tr-page">
      <div className="container tr-container">
        {/* Search */}
        <div className="tr-search-card">
          <div className="tr-search-icon" aria-hidden="true"><Package size={24} /></div>
          <h1>Track your order <HiddenGem spot="track-page" /></h1>
          <p className="tr-sub">Enter your order code and the phone number you used at checkout.</p>

          <form onSubmit={handleSearch} className="tr-form" noValidate>
            <div className={`tr-field ${codeError ? 'has-error' : ''}`}>
              <label htmlFor="tr-code">Order code</label>
              <div className="tr-input">
                <Search size={17} aria-hidden="true" />
                <input
                  id="tr-code"
                  type="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="CHR-SEA-7KQ2MX9P"
                  value={searchInput}
                  onChange={(e) => { setSearchInput(e.target.value.toUpperCase()); setCodeError(''); }}
                  aria-invalid={Boolean(codeError)}
                  aria-describedby={codeError ? 'tr-code-error' : undefined}
                />
                {searchInput && (
                  <button type="button" className="tr-clear" onClick={clearSearch} aria-label="Clear order code">
                    <X size={15} />
                  </button>
                )}
              </div>
              {codeError && <span className="tr-error" id="tr-code-error" role="alert"><AlertCircle size={13} /> {codeError}</span>}
            </div>

            <div className="tr-field">
              <label htmlFor="tr-phone">Phone number</label>
              <div className="tr-input">
                <input
                  id="tr-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="024 412 3456"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className={`btn btn-primary tr-submit ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
              Track order <ArrowRight size={16} />
            </button>
          </form>
          <p className="tr-tip">Signed in? Your own orders don't need the phone number.</p>

          {recentOrders.length > 0 && (
            <div className="tr-recent">
              <span className="tr-recent-label">Ordered on this phone</span>
              <div className="tr-recent-list">
                {recentOrders.map((o) => {
                  const code = o.orderCode || o.orderId;
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`tr-recent-chip ${searchedCode === code ? 'is-active' : ''}`}
                      onClick={() => trackRecent(o)}
                    >
                      <Package size={14} aria-hidden="true" />
                      <span>{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div ref={resultRef} className="tr-result-anchor" />

        {/* Result */}
        {loading && !searchedOrder && (
          <div className="tr-card tr-skeleton" aria-hidden="true">
            <span /><span /><span />
          </div>
        )}

        {hasSearched && searchedOrder && (
          <div className={`tr-card ${loading ? 'is-refreshing' : ''}`} aria-live="polite">
            <div className="tr-head">
              <div className="tr-head-main">
                <span className="tr-eyebrow">Order</span>
                <div className="tr-code-row">
                  <h2>#{searchedOrder.orderId}</h2>
                  <button type="button" className={`tr-icon-btn ${copied ? 'is-done' : ''}`} onClick={copyCode} aria-label="Copy order code">
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                <span className="tr-meta">
                  {searchedOrder.customerName}{searchedOrder.date ? ` · placed ${searchedOrder.date}` : ''}
                </span>
              </div>
              <div className="tr-badges">
                <span className={`tr-badge is-${status.tone}`}><span className="tr-badge-dot" />{status.text}</span>
                {payment && <span className={`tr-badge is-${payment.tone}`}>{payment.text}</span>}
              </div>
            </div>

            {fromDevice && (
              <p className="tr-notice"><Clock size={14} /> Showing the details saved on this phone, so the status may be out of date. Tap Refresh, or ask us on WhatsApp.</p>
            )}

            {/* Progress */}
            <section className="tr-progress" aria-label="Order progress">
              <div className="tr-progress-head">
                <h3>Progress</h3>
                <button type="button" className="tr-refresh" onClick={() => lookUp(searchedOrder.orderId, phoneInput || searchedOrder.phone || '')} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              <ol className="tr-steps">
                {steps.map((st, idx) => (
                  <li
                    key={st.title}
                    className={`tr-step ${st.done ? 'is-done' : ''} ${st.current ? 'is-current' : ''} ${st.cancelled ? 'is-cancelled' : ''}`}
                    aria-current={st.current ? 'step' : undefined}
                  >
                    <span className="tr-step-dot" aria-hidden="true">
                      {st.cancelled ? <X size={14} /> : st.done ? <Check size={14} /> : idx + 1}
                    </span>
                    <div className="tr-step-body">
                      <span className="tr-step-title">
                        {st.title}
                        {st.current && <span className="tr-now">Next</span>}
                      </span>
                      {st.time && <span className="tr-step-time">{st.time}</span>}
                      <span className="tr-step-note">{st.note}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <span className="sr-only">{doneCount} of {steps.length} steps done</span>
            </section>

            {/* Delivery and money */}
            <div className="tr-facts">
              <div className="tr-fact">
                <span className="tr-fact-label"><MapPin size={14} /> Delivering to</span>
                <strong>{searchedOrder.destination || 'Pickup in Kumasi'}</strong>
                {searchedOrder.shippingMethod && <span>{searchedOrder.shippingMethod}</span>}
              </div>
              <div className="tr-fact">
                <span className="tr-fact-label">Total</span>
                <strong className="tr-total">{money(searchedOrder.total)}</strong>
                {Number(searchedOrder.deliveryFee || searchedOrder.shippingCost) > 0 && (
                  <span>Includes {money(searchedOrder.deliveryFee || searchedOrder.shippingCost)} delivery</span>
                )}
                {searchedOrder.paymentMethod && <span>{searchedOrder.paymentMethod}</span>}
              </div>
            </div>

            {items.length > 0 && (
              <section className="tr-items" aria-label="Items in this order">
                <h3>Items ({items.reduce((n, it) => n + (it.qty || it.quantity || 1), 0)})</h3>
                <ul>
                  {items.map((it, idx) => {
                    const qty = it.qty || it.quantity || 1;
                    return (
                      <li key={idx}>
                        <SmartImage src={sizedImage(it.image || '', 160)} alt="" className="tr-item-img" />
                        <div className="tr-item-info">
                          <span className="tr-item-name">{it.name}</span>
                          <span className="tr-item-each">{qty} × {money(it.price)}</span>
                        </div>
                        <span className="tr-item-total">{money(qty * (it.price || 0))}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <div className="tr-help">
              <div>
                <strong>Questions about this order?</strong>
                <span>Our Kumasi team replies on WhatsApp every day.</span>
              </div>
              <a
                href={helpLink(`Hello CHARI, I'd like an update on my order #${searchedOrder.orderId}.`)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={17} /> Ask on WhatsApp
              </a>
            </div>
          </div>
        )}

        {hasSearched && !searchedOrder && !loading && (
          <div className="tr-card tr-empty" role="alert">
            <div className="tr-empty-icon" aria-hidden="true"><Search size={22} /></div>
            <h2>We couldn't find that order</h2>
            <p>
              Check the code <strong>{searchedCode}</strong> and make sure the phone number is the one you used at checkout.
            </p>
            <div className="tr-empty-actions">
              <button type="button" className="btn btn-outline" onClick={() => document.getElementById('tr-code')?.focus()}>
                Try again
              </button>
              <a
                href={helpLink(`Hello CHARI, I need help tracking my order "${searchedCode}".`)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
              >
                <MessageCircle size={17} /> Ask on WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
