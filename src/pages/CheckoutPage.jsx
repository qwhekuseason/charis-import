import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { SmartImage } from '../components/SmartImage';
import { GHANA_REGIONS } from '../data/products';
import { validateDiscountCode } from '../services/api';
import './CheckoutPage.css';
import {
  ShoppingBag,
  Truck,
  MessageCircle,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  Ship,
  Plane,
  Check,
  Copy,
  X,
  MapPin,
  Smartphone,
  AlertCircle,
  Lock
} from 'lucide-react';

// Delivery options shown at checkout. Fees must match DELIVERY_OPTIONS in server/index.js.
const FREIGHT_OPTIONS = [
  {
    id: 'sea_freight',
    name: 'Sea shipping',
    type: 'SEA_FREIGHT',
    icon: Ship,
    cost: 35.00,
    time: '35 – 45 working days',
    desc: 'Shipped by sea from China to Tema Port. Most affordable.'
  },
  {
    id: 'air_cargo',
    name: 'Air shipping',
    type: 'AIR_FREIGHT',
    icon: Plane,
    cost: 75.00,
    time: '7 – 12 working days',
    desc: 'Flown to Ghana by air cargo for quicker delivery.'
  },
  {
    id: 'local_express',
    name: 'Local delivery (Kumasi)',
    type: 'LOCAL_DISPATCH',
    icon: Truck,
    cost: 40.00,
    time: '1 – 2 working days',
    desc: 'For items already in stock — delivered to your door in Kumasi.'
  }
];

const MOMO_PROVIDERS = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'telecel', label: 'Telecel Cash' },
  { id: 'at', label: 'AT Money' }
];

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
const phoneDigits = (v) => String(v || '').replace(/\D/g, '');

// Guests' delivery details are remembered on this device so the next order is quicker.
const SAVED_DETAILS_KEY = 'chari_checkout_details';
const loadSavedDetails = () => {
  try {
    return JSON.parse(localStorage.getItem(SAVED_DETAILS_KEY)) || {};
  } catch {
    return {};
  }
};

const validateDetails = (data) => {
  const errors = {};
  if (!data.fullName.trim()) errors.fullName = 'Enter your name.';
  if (!data.phone.trim()) errors.phone = 'Enter a phone number we can reach you on.';
  else if (phoneDigits(data.phone).length < 9) errors.phone = 'This phone number looks too short.';
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Check this email address, or leave it empty.';
  if (!data.city.trim()) errors.city = 'Enter your town or suburb.';
  if (!data.address.trim()) errors.address = 'Enter a street address or bus station.';
  return errors;
};

const Field = ({ label, error, hint, children, htmlFor }) => (
  <div className={`co-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={htmlFor} className="co-label">{label}</label>
    {children}
    {error ? (
      <span className="co-error" id={`${htmlFor}-error`} role="alert">
        <AlertCircle size={13} aria-hidden="true" /> {error}
      </span>
    ) : hint ? (
      <span className="co-hint">{hint}</span>
    ) : null}
  </div>
);

export const CheckoutPage = () => {
  const {
    cart,
    cartSubtotal,
    clearCart,
    addPlacedOrder,
    navigate,
    showToast,
    pageParams,
    WHATSAPP_NUMBER,
    user,
    setPreorderTermsOpen,
    calculateVolumetricFreight,
    referralInfo,
    settings
  } = useStore();
  const [useCredit, setUseCredit] = useState(false);

  // Browser-held wallet credit (WALLET-...) can't be verified by the server, so it isn't carried into checkout.
  const carriedPromo = pageParams?.appliedPromo && !String(pageParams.appliedPromo).startsWith('WALLET-') ? pageParams : null;
  const [discountAmount, setDiscountAmount] = useState(carriedPromo?.discountAmount || 0);
  const [appliedPromo, setAppliedPromo] = useState(carriedPromo?.appliedPromo || '');
  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Generate unique transaction idempotency key per checkout attempt
  const [idempotencyKey] = useState(() => `idemp_gh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  // Volumetric Freight Calculation based on cart items
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const estimatedCbm = Math.round((totalItemsCount * 0.045) * 100) / 100;
  const estimatedActualKg = Math.round((totalItemsCount * 3.2) * 10) / 10;
  const freightCalc = calculateVolumetricFreight
    ? calculateVolumetricFreight(estimatedCbm, estimatedActualKg)
    : { cbm: estimatedCbm, actualKg: estimatedActualKg };

  const [selectedShipping, setSelectedShipping] = useState(FREIGHT_OPTIONS[0]);
  const [momoProvider, setMomoProvider] = useState('mtn');
  const [momoNumber, setMomoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [step, setStep] = useState(1);
  const [copiedField, setCopiedField] = useState(null);
  const [errors, setErrors] = useState({});
  const [summaryOpen, setSummaryOpen] = useState(false);
  const formRef = useRef(null);
  const termsRef = useRef(null);

  const handleCopy = (text, fieldName, label) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      showToast(`${label} copied`, 'success');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      showToast(`Copied: ${text}`, 'info');
    }
  };

  const [formData, setFormData] = useState(() => {
    const saved = loadSavedDetails();
    return {
      fullName: user?.name || saved.fullName || '',
      phone: user?.phone || saved.phone || '',
      email: user?.email || saved.email || '',
      region: saved.region || (user?.city?.includes('Accra') ? 'Greater Accra' : 'Ashanti'),
      city: user?.city || saved.city || '',
      address: user?.address || saved.address || '',
      notes: ''
    };
  });

  // Typing in a field clears its error straight away.
  const updateField = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    setValidatingPromo(true);
    try {
      const res = await validateDiscountCode(code, cartSubtotal);
      if (res.valid) {
        setAppliedPromo(res.code);
        setDiscountAmount(res.discountAmount);
        showToast(res.message || `Code "${res.code}" applied`, 'success');
        setPromoInput('');
      }
    } catch (err) {
      showToast(err.message || 'That promo code is not valid', 'error');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo('');
    setDiscountAmount(0);
    showToast('Promo code removed', 'info');
  };

  const shippingCost = selectedShipping.cost;
  // Mirrors the server's rules so the total shown here matches what's charged:
  // the invited-friend welcome discount and a promo code don't combine — the bigger one applies.
  const welcomeDiscount = referralInfo?.welcomeDiscountAvailable ? Math.min(referralInfo.welcomeDiscount, cartSubtotal) : 0;
  const usingWelcome = welcomeDiscount > discountAmount;
  const effectiveDiscount = usingWelcome ? welcomeDiscount : discountAmount;
  const creditBalance = referralInfo?.creditBalance || 0;
  const creditUsed = useCredit ? Math.min(creditBalance, Math.max(0, cartSubtotal - effectiveDiscount)) : 0;
  const grandTotal = Math.max(0, cartSubtotal - effectiveDiscount - creditUsed + shippingCost);

  const goToStep = (n) => {
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If cart is empty and not on confirmation
  if (cart.length === 0 && !placedOrderDetails) {
    return (
      <div className="section">
        <div className="container co-empty">
          <div className="co-empty-icon"><ShoppingBag size={34} /></div>
          <h2>Your cart is empty</h2>
          <p>Add some products to your cart first.</p>
          <button className="btn btn-primary" onClick={() => navigate('shop')}>
            Browse products <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Step 1 → 2: check every field, show what's wrong next to it, and jump to the first problem.
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    const found = validateDetails(formData);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      const el = formRef.current?.querySelector(`[name="${first}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }
      return;
    }
    if (!user) {
      try {
        const { notes, ...keep } = formData;
        localStorage.setItem(SAVED_DETAILS_KEY, JSON.stringify(keep));
      } catch {}
    }
    goToStep(2);
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;
    if (!termsAgreed) {
      setTermsError(true);
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      termsRef.current?.querySelector('input')?.focus({ preventScroll: true });
      return;
    }
    if (phoneDigits(momoNumber || formData.phone).length < 9) {
      showToast('Enter the MoMo number you will pay from.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPrefix = selectedShipping.type === 'SEA_FREIGHT' ? 'CHR-SEA' : selectedShipping.type === 'AIR_FREIGHT' ? 'CHR-AIR' : 'CHR';
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const orderId = `${orderPrefix}-${randomCode}`;

      const newOrder = {
        orderId,
        orderCode: orderId,
        customerName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || null,
        date: new Date().toISOString().split('T')[0],
        status: 'processing',
        freightType: selectedShipping.type,
        containerNumber: null,
        flightNumber: null,
        volumetricWeight: { cbm: freightCalc.cbm, actualKg: freightCalc.actualKg },
        idempotencyKey,
        items: cart.map((i) => ({
          id: i.product?.id || i.id,
          name: i.product?.name || i.name,
          qty: i.quantity,
          price: i.unitPrice,
          image: i.product?.images?.[0] || i.product?.image || i.image || '',
        })),
        subtotal: cartSubtotal,
        shippingCost,
        deliveryFee: shippingCost,
        discountAmount,
        couponCode: appliedPromo || null,
        useCredit: creditUsed > 0,
        total: grandTotal,
        shippingMethod: selectedShipping.name,
        shippingMethodId: selectedShipping.id,
        destination: `${formData.address}, ${formData.city} (${formData.region})`,
        city: formData.city,
        address: formData.address,
        region: formData.region,
        notes: formData.notes.trim() || null,
        // Pre-orders are paid in full up front, so Mobile Money is the only way to pay.
        paymentMethod: `${momoProvider.toUpperCase()} MoMo Transfer (${momoNumber || formData.phone})`,
        waybillNumber: `BL-GH-${orderId}`,
      };

      const savedOrder = await addPlacedOrder(newOrder);
      const confirmedOrder = savedOrder || newOrder;

      setPlacedOrderDetails(confirmedOrder);
      clearCart();
      goToStep(3);

      // Try to open WhatsApp with the order details (some browsers block this; there's a button too).
      try {
        window.open(getOrderWhatsAppLink(confirmedOrder), '_blank');
      } catch (err) {
        console.warn('WhatsApp auto-open popup notice:', err);
      }
    } catch (err) {
      console.error('Error in handlePlaceOrder:', err);
      showToast(err.message || 'Could not complete order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderWhatsAppLink = (order) => {
    const code = order.orderCode || order.orderId;
    const itemsList = (order.items || [])
      .map((it) => `• ${it.name} (${it.qty} pcs) @ GH₵${(it.price || 0).toFixed(2)}`)
      .join('\n');

    const msg = encodeURIComponent(
      `*New order — CHARI*\n\n` +
      `*Order ID:* #${code}\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Phone:* ${order.phone}\n` +
      (order.email ? `*Email:* ${order.email}\n` : '') +
      `*Delivery Address:* ${order.destination || [order.address, order.city].filter(Boolean).join(', ')}\n` +
      `*Delivery:* ${order.shippingMethod || order.deliveryMethod}\n\n` +
      `*ORDER ITEMS:*\n${itemsList}\n\n` +
      `*Subtotal:* GH₵${(order.subtotal || 0).toFixed(2)}\n` +
      `*Delivery / Shipping:* GH₵${(order.shippingCost || order.deliveryFee || 0).toFixed(2)}\n` +
      (order.discountAmount ? `*Discount:* -GH₵${order.discountAmount.toFixed(2)}\n` : '') +
      (order.creditUsed ? `*Store credit:* -GH₵${order.creditUsed.toFixed(2)}\n` : '') +
      `*TOTAL PAYABLE:* GH₵${(order.total || 0).toFixed(2)}\n\n` +
      `*Payment Method:* ${order.paymentMethod}\n` +
      `*Pay to MoMo:* ${settings.momoNumber} (${settings.momoName})\n\nHello CHARI, I have placed this order on your website and will send my payment receipt now.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  const steps = [
    { n: 1, label: 'Delivery' },
    { n: 2, label: 'Payment' },
    { n: 3, label: 'Done' },
  ];

  // ── Order summary (sidebar on desktop, collapsible panel on phones) ──
  const summaryBody = (
    <>
      <ul className="co-items">
        {cart.map((item) => (
          <li key={item.product.id} className="co-item">
            <div className="co-item-thumb">
              <SmartImage
                src={sizedImage(item.product.images ? item.product.images[0] : (item.product.image || ''), 160)}
                alt={item.product.name}
                className="co-item-img"
              />
              <span className="co-item-qty" aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span>
            </div>
            <div className="co-item-info">
              <span className="co-item-name">{item.product.name}</span>
              <span className="co-item-each">{money(item.unitPrice)} each</span>
            </div>
            <span className="co-item-total">{money(item.total)}</span>
          </li>
        ))}
      </ul>

      {creditBalance > 0 && (
        <label className="co-check-row">
          <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
          <span>Use my store credit <strong>({money(creditBalance)} available)</strong></span>
        </label>
      )}

      {usingWelcome && (
        <div className="co-note co-note-success">
          <Check size={14} aria-hidden="true" /> Welcome discount from your invite: −{money(welcomeDiscount)}
        </div>
      )}

      {appliedPromo ? (
        <div className="co-promo-applied">
          <span><Check size={14} aria-hidden="true" /> Code <strong>{appliedPromo}</strong> applied (−{money(discountAmount)})</span>
          <button type="button" onClick={handleRemovePromo} aria-label="Remove promo code"><X size={15} /></button>
        </div>
      ) : (
        <form onSubmit={handleApplyPromo} className="co-promo">
          <input
            type="text"
            placeholder="Promo code"
            aria-label="Promo code"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            autoCapitalize="characters"
          />
          <button type="submit" className={`btn btn-outline btn-sm ${validatingPromo ? 'is-loading' : ''}`} disabled={!promoInput.trim()}>
            Apply
          </button>
        </form>
      )}

      <dl className="co-totals">
        <div><dt>Items ({totalItemsCount})</dt><dd>{money(cartSubtotal)}</dd></div>
        <div><dt>Delivery · {selectedShipping.name}</dt><dd>{money(shippingCost)}</dd></div>
        {effectiveDiscount > 0 && (
          <div className="is-saving"><dt>{usingWelcome ? 'Welcome discount' : 'Discount'}</dt><dd>−{money(effectiveDiscount)}</dd></div>
        )}
        {creditUsed > 0 && (
          <div className="is-saving"><dt>Store credit</dt><dd>−{money(creditUsed)}</dd></div>
        )}
        <div className="co-grand"><dt>Total</dt><dd>{money(grandTotal)}</dd></div>
      </dl>
    </>
  );

  const orderCode = placedOrderDetails?.orderCode || placedOrderDetails?.orderId;
  const orderTotal = Number(placedOrderDetails?.total ?? grandTotal);

  return (
    <div className="section co-page">
      <div className="container co-container">

        {/* Progress */}
        <ol className="co-steps" aria-label="Checkout progress">
          {steps.map((s, i) => {
            const state = step > s.n || (s.n === 3 && step === 3) ? 'done' : step === s.n ? 'current' : 'todo';
            const canGoBack = s.n === 1 && step === 2;
            return (
              <li key={s.n} className={`co-step is-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
                {i > 0 && <span className="co-step-line" aria-hidden="true" />}
                <button type="button" className="co-step-btn" disabled={!canGoBack} onClick={() => goToStep(1)}>
                  <span className="co-step-dot">{state === 'done' ? <Check size={14} /> : s.n}</span>
                  <span className="co-step-label">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* ── STEP 3: CONFIRMATION ── */}
        {step === 3 && placedOrderDetails && (
          <div className="co-card co-done">
            <div className="co-done-head">
              <div className="co-done-icon"><Check size={30} strokeWidth={3} /></div>
              <h1>Thank you, {String(placedOrderDetails.customerName || '').split(' ')[0] || 'friend'}!</h1>
              <p>
                Your order <strong>#{orderCode}</strong> has been placed.{' '}
                Send your MoMo payment below so we can start processing it.
              </p>
            </div>

            <section className="co-pay" aria-label="How to pay">
              <div className="co-pay-head">
                <Smartphone size={18} aria-hidden="true" />
                <h2>Pay {money(orderTotal)} by Mobile Money</h2>
              </div>

              <div className="co-pay-rows">
                {[
                  { key: 'momoNumber', label: 'MoMo number', value: settings.momoNumber, copy: settings.momoNumber.replace(/\s/g, ''), copyLabel: 'MoMo number' },
                  { key: 'momoName', label: 'Account name', value: settings.momoName },
                  { key: 'momoAmount', label: 'Amount', value: money(orderTotal), copy: orderTotal.toFixed(2), copyLabel: 'Amount', accent: true },
                  { key: 'momoRef', label: 'Reference', value: orderCode, copy: orderCode, copyLabel: 'Reference', note: 'Use this as the reference so we can match your payment.' },
                ].map((row) => (
                  <div key={row.key} className="co-pay-row">
                    <div className="co-pay-text">
                      <span className="co-pay-label">{row.label}</span>
                      <span className={`co-pay-value ${row.accent ? 'is-accent' : ''}`}>{row.value}</span>
                      {row.note && <span className="co-pay-note">{row.note}</span>}
                    </div>
                    {row.copy && (
                      <button
                        type="button"
                        className={`co-copy ${copiedField === row.key ? 'is-copied' : ''}`}
                        onClick={() => handleCopy(row.copy, row.key, row.copyLabel)}
                        aria-label={`Copy ${row.copyLabel}`}
                      >
                        {copiedField === row.key ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <ol className="co-pay-steps">
                <li>Dial <strong>*170#</strong> or open your MoMo app.</li>
                <li>Send <strong>{money(orderTotal)}</strong> to <strong>{settings.momoNumber}</strong> with reference <strong>{orderCode}</strong>.</li>
                <li>Send us the payment screenshot or SMS on WhatsApp.</li>
              </ol>
            </section>

            <div className="co-done-actions">
              <a
                href={getOrderWhatsAppLink(placedOrderDetails)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-lg btn-block"
              >
                <MessageCircle size={20} />
                Send payment receipt on WhatsApp
              </a>
              <p className="co-hint co-center">If WhatsApp didn't open by itself, tap the button above.</p>
              <div className="co-done-secondary">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => navigate('track-order', { prefillCode: orderCode, prefillPhone: placedOrderDetails.phone })}
                >
                  Track my order
                </button>
                <button type="button" className="btn btn-dark" onClick={() => navigate('shop')}>
                  Keep shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEPS 1 & 2 ── */}
        {step < 3 && (
          <div className="co-layout">
            {/* Phones: collapsible summary with the total always visible */}
            <div className={`co-summary-mobile ${summaryOpen ? 'is-open' : ''}`}>
              <button
                type="button"
                className="co-summary-toggle"
                onClick={() => setSummaryOpen((o) => !o)}
                aria-expanded={summaryOpen}
              >
                <ShoppingBag size={17} aria-hidden="true" />
                <span>{summaryOpen ? 'Hide' : 'Show'} order summary</span>
                <ChevronDown size={16} className="co-chevron" aria-hidden="true" />
                <strong>{money(grandTotal)}</strong>
              </button>
              {summaryOpen && <div className="co-summary-mobile-body">{summaryBody}</div>}
            </div>

            <div className="co-main">
              {step === 1 ? (
                /* Step 1: delivery details */
                <form id="co-delivery-form" ref={formRef} onSubmit={handleProceedToPayment} className="co-card" noValidate>
                  <div className="co-card-head">
                    <h1>Delivery details</h1>
                    <p>Where should we send your order?</p>
                  </div>

                  <div className="co-grid">
                    <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
                      <input
                        id="fullName" name="fullName" type="text" autoComplete="name"
                        placeholder="Kwabena Asante"
                        value={formData.fullName} onChange={updateField('fullName')}
                        aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                      />
                    </Field>
                    <Field label="Phone (WhatsApp)" htmlFor="phone" error={errors.phone} hint="We'll send order updates here.">
                      <input
                        id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel"
                        placeholder="024 412 3456"
                        value={formData.phone} onChange={updateField('phone')}
                        aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined}
                      />
                    </Field>
                  </div>

                  <Field label={<>Email <span className="co-optional">optional</span></>} htmlFor="email" error={errors.email} hint="For order confirmation and shipping emails.">
                    <input
                      id="email" name="email" type="email" inputMode="email" autoComplete="email"
                      placeholder="k.asante@gmail.com"
                      value={formData.email} onChange={updateField('email')}
                      aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                  </Field>

                  <div className="co-grid">
                    <Field label="Region" htmlFor="region">
                      <select id="region" name="region" value={formData.region} onChange={updateField('region')} autoComplete="address-level1">
                        {GHANA_REGIONS.map((reg) => <option key={reg} value={reg}>{reg}</option>)}
                      </select>
                    </Field>
                    <Field label="Town or suburb" htmlFor="city" error={errors.city}>
                      <input
                        id="city" name="city" type="text" autoComplete="address-level2"
                        placeholder="Adum, Asokwa, Takoradi…"
                        value={formData.city} onChange={updateField('city')}
                        aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'city-error' : undefined}
                      />
                    </Field>
                  </div>

                  <Field label="Street address or bus station" htmlFor="address" error={errors.address}>
                    <input
                      id="address" name="address" type="text" autoComplete="street-address"
                      placeholder="Hse No. 12, Asokwa — or VIP Station, Accra"
                      value={formData.address} onChange={updateField('address')}
                      aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                  </Field>

                  <fieldset className="co-fieldset">
                    <legend className="co-label">Delivery method</legend>
                    <div className="co-options">
                      {FREIGHT_OPTIONS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedShipping.id === method.id;
                        return (
                          <label key={method.id} className={`co-option ${isSelected ? 'is-selected' : ''}`}>
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={isSelected}
                              onChange={() => setSelectedShipping(method)}
                            />
                            <span className="co-option-icon" aria-hidden="true"><Icon size={18} /></span>
                            <span className="co-option-body">
                              <span className="co-option-top">
                                <span className="co-option-name">{method.name}</span>
                                <span className="co-option-price">{money(method.cost)}</span>
                              </span>
                              <span className="co-option-desc">{method.desc}</span>
                              <span className="co-option-time">Arrives in {method.time}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <Field label={<>Delivery note <span className="co-optional">optional</span></>} htmlFor="notes">
                    <textarea
                      id="notes" name="notes" rows={2}
                      placeholder="Landmark, best time to call, sizes or colours…"
                      value={formData.notes} onChange={updateField('notes')}
                    />
                  </Field>

                  <button type="submit" className="btn btn-primary btn-lg btn-block co-desktop-only">
                    Continue to payment <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                /* Step 2: payment and review */
                <div className="co-card">
                  <div className="co-card-head">
                    <h1>Payment</h1>
                    <p>Check your details, then place your order and pay by Mobile Money.</p>
                  </div>

                  {/* What they entered on step 1, with a quick way back */}
                  <div className="co-review">
                    <MapPin size={18} className="co-review-icon" aria-hidden="true" />
                    <div className="co-review-text">
                      <strong>{formData.fullName}</strong>
                      <span>{formData.phone}</span>
                      <span>{formData.address}, {formData.city}, {formData.region}</span>
                      <span>{selectedShipping.name} · {selectedShipping.time}</span>
                    </div>
                    <button type="button" className="co-link" onClick={() => goToStep(1)}>Edit</button>
                  </div>

                  <section className="co-fieldset" aria-labelledby="co-pay-title">
                    <h2 id="co-pay-title" className="co-label">How you'll pay</h2>
                    <div className="co-options">
                      <div className="co-option is-selected">
                        <span className="co-option-icon" aria-hidden="true"><Smartphone size={18} /></span>
                        <span className="co-option-body">
                          <span className="co-option-top">
                            <span className="co-option-name">Mobile Money</span>
                            <span className="co-momo-tags" aria-hidden="true">
                              <span className="co-tag co-tag-mtn">MTN</span>
                              <span className="co-tag co-tag-telecel">Telecel</span>
                              <span className="co-tag co-tag-at">AT</span>
                            </span>
                          </span>
                          <span className="co-option-desc">Pre-orders are paid in full by MoMo before we buy from the supplier. You'll get our MoMo number after placing the order.</span>
                        </span>
                      </div>

                      <div className="co-momo">
                        <span className="co-label">Your network</span>
                        <div className="co-segment" role="radiogroup" aria-label="Your network">
                          {MOMO_PROVIDERS.map((prov) => (
                            <button
                              key={prov.id}
                              type="button"
                              role="radio"
                              aria-checked={momoProvider === prov.id}
                              className={`co-segment-btn ${momoProvider === prov.id ? 'is-active' : ''}`}
                              onClick={() => setMomoProvider(prov.id)}
                            >
                              {prov.label}
                            </button>
                          ))}
                        </div>
                        <Field label="Number you'll pay from" htmlFor="momoNumber">
                          <input
                            id="momoNumber" type="tel" inputMode="tel" autoComplete="tel"
                            placeholder="024 123 4567"
                            value={momoNumber || formData.phone}
                            onChange={(e) => setMomoNumber(e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  </section>

                  <div ref={termsRef} className={`co-terms ${termsError && !termsAgreed ? 'has-error' : ''}`}>
                    <label>
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => { setTermsAgreed(e.target.checked); setTermsError(false); }}
                      />
                      <span>
                        I agree to the{' '}
                        <button type="button" className="co-link" onClick={() => setPreorderTermsOpen(true)}>pre-order terms</button>.
                        {' '}Pre-orders are paid in full, the price is fixed in cedis, and delivery takes the time shown above.
                      </span>
                    </label>
                    {termsError && !termsAgreed && (
                      <span className="co-error" role="alert"><AlertCircle size={13} aria-hidden="true" /> Tick the box to agree before placing your order.</span>
                    )}
                  </div>

                  <button
                    type="button"
                    className={`btn btn-primary btn-lg btn-block co-desktop-only ${isSubmitting ? 'is-loading' : ''}`}
                    onClick={handlePlaceOrder}
                    aria-busy={isSubmitting}
                  >
                    <Lock size={16} /> Place order · {money(grandTotal)}
                  </button>
                  <button type="button" className="co-back co-desktop-only" onClick={() => goToStep(1)}>
                    <ChevronLeft size={16} /> Back to delivery details
                  </button>
                </div>
              )}
            </div>

            {/* Desktop: summary sidebar */}
            <aside className="co-card co-summary" aria-label="Order summary">
              <h2 className="co-summary-title">Order summary</h2>
              {summaryBody}
            </aside>
          </div>
        )}
      </div>

      {/* Phones: the main action and total stay in reach at the bottom of the screen */}
      {step < 3 && (
        <div className="co-actionbar">
          <div className="co-actionbar-total">
            <span>Total</span>
            <strong>{money(grandTotal)}</strong>
          </div>
          {step === 1 ? (
            <button type="submit" form="co-delivery-form" className="btn btn-primary">
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-primary ${isSubmitting ? 'is-loading' : ''}`}
              onClick={handlePlaceOrder}
              aria-busy={isSubmitting}
            >
              <Lock size={15} /> Place order
            </button>
          )}
        </div>
      )}
    </div>
  );
};
