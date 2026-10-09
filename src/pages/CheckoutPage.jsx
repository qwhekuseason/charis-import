import React, { useState, useId } from 'react';
import { useStore } from '../context/StoreContext';
import { GHANA_REGIONS } from '../data/products';
import { validateDiscountCode } from '../services/api';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Phone,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  ChevronLeft,
  Tag,
  Loader2,
  Info,
  Ship,
  Plane,
  Scale,
  Lock,
  Clock,
  Check
} from 'lucide-react';

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
    availableCoupons,
    fxRates,
    calculateVolumetricFreight
  } = useStore();

  const [discountAmount, setDiscountAmount] = useState(pageParams?.discountAmount || 0);
  const [appliedPromo, setAppliedPromo] = useState(pageParams?.appliedPromo || '');
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
    : { cbm: estimatedCbm, actualKg: estimatedActualKg, seaFreightGhs: 45, airFreightGhs: 95, customsDutyEst: 50 };

  const FREIGHT_OPTIONS = [
    {
      id: 'sea_freight',
      name: 'Consolidated Sea Freight Pre-Order',
      type: 'SEA_FREIGHT',
      icon: Ship,
      cost: 35.00,
      time: '35 - 45 business days',
      desc: 'Container FCL from Guangzhou Port to Tema Port MPS Terminal 3. Lowest cost per KG/CBM.'
    },
    {
      id: 'air_cargo',
      name: 'Express Air Cargo Pre-Order',
      type: 'AIR_FREIGHT',
      icon: Plane,
      cost: 75.00,
      time: '7 - 12 business days',
      desc: 'Direct cargo flight to Kotoka International Airport (KIA Cargo Terminal). Fast-track delivery.'
    },
    {
      id: 'local_express',
      name: 'Accra Doorstep Express Courier',
      type: 'LOCAL_DISPATCH',
      icon: Truck,
      cost: 40.00,
      time: 'Same day or next day',
      desc: 'Immediate dispatch from Spintex Fulfillment Hub to your doorstep anywhere in Greater Accra.'
    }
  ];

  const [selectedShipping, setSelectedShipping] = useState(FREIGHT_OPTIONS[0]);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [momoProvider, setMomoProvider] = useState('mtn');
  const [momoNumber, setMomoNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    region: user?.city ? (user.city.includes('Accra') ? 'Greater Accra' : user.city.includes('Kumasi') ? 'Ashanti' : 'Greater Accra') : 'Greater Accra',
    city: user?.city || '',
    address: user?.address || '',
    notes: ''
  });

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
        showToast(res.message || `Coupon "${res.code}" applied!`, 'success');
        setPromoInput('');
      }
    } catch (err) {
      showToast(err.message || 'Invalid promo code', 'error');
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
  const grandTotal = Math.max(0, cartSubtotal - discountAmount + shippingCost);

  // If cart is empty and not on confirmation
  if (cart.length === 0 && !placedOrderDetails) {
    return (
      <div className="section">
        <div className="container" style={{ maxWidth: '600px', textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '76px',
              height: '76px',
              borderRadius: '24px',
              background: 'var(--accent-subtle)',
              border: '1.5px solid var(--accent-border)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}
          >
            <ShoppingBag size={38} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Your Cart is Empty
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Select products or pre-orders from our international catalog before proceeding to checkout.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('shop')}>
            Browse Products & Pre-Orders
          </button>
        </div>
      </div>
    );
  }

  // Handle Step 1 submit
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.city) {
      showToast('Please provide your name, phone number, and delivery city.', 'warning');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle final order placement with transactional metadata & row locking simulation
  const handlePlaceOrder = async () => {
    if (!termsAgreed) {
      showToast('Please accept the pre-order terms before completing checkout.', 'warning');
      return;
    }
    if (paymentMethod === 'momo' && !momoNumber && !formData.phone) {
      showToast('Please enter your Mobile Money phone number.', 'warning');
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
        customerName: formData.fullName,
        phone: formData.phone,
        email: formData.email || null,
        date: new Date().toISOString().split('T')[0],
        status: paymentMethod === 'cash' ? 'order_placed' : 'processing',
        freightType: selectedShipping.type,
        containerNumber: selectedShipping.type === 'SEA_FREIGHT' ? 'MSKU-882419-7' : null,
        flightNumber: selectedShipping.type === 'AIR_FREIGHT' ? 'EK-9821 Cargo' : null,
        volumetricWeight: { cbm: freightCalc.cbm, actualKg: freightCalc.actualKg },
        fxLock: {
          usdRate: fxRates?.USD_GHS || 15.65,
          rmbRate: fxRates?.RMB_GHS || 2.18,
          lockedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' GMT'
        },
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
        total: grandTotal,
        shippingMethod: selectedShipping.name,
        destination: `${formData.address}, ${formData.city} (${formData.region})`,
        city: formData.city,
        address: formData.address,
        region: formData.region,
        paymentMethod:
          paymentMethod === 'momo'
            ? `${momoProvider.toUpperCase()} MoMo (${momoNumber || formData.phone})`
            : paymentMethod === 'card'
            ? 'Debit / Credit Card (3D Secure)'
            : 'Pay on Collection / Inspection',
        waybillNumber: `BL-GH-${orderId}`,
        steps: [
          { title: 'Order Confirmed & FX Locked', time: 'Just Now', location: 'Accra FX Treasury Hub', done: true, note: `USD/GHS: ${fxRates?.USD_GHS || 15.65} snapshot locked. PO queued with supplier.` },
          { title: 'Factory Batching & QC Inspection', time: 'Cutoff: 3 Days', location: 'Fulfillment Consolidation Depot', done: false, note: 'Supplier fabrication, stress testing, and batch packaging.' },
          { title: 'On High Seas / International Flight', time: selectedShipping.type === 'SEA_FREIGHT' ? 'Sea: 35–45 days' : 'Air: 7–12 days', location: 'International Cargo Transit Corridor', done: false, note: 'Marine vessel routing or air cargo dispatch to Ghana.' },
          { title: 'Local Customs Clearance (Tema Port / KIA)', time: 'Pending Arrival', location: 'MPS Terminal 3 / GRA ICUMS', done: false, note: 'Single window duty assessment and port clearance.' },
          { title: 'Arrived at Accra Central Distribution Hub', time: 'Pending', location: 'Spintex Rd Fulfillment Hub', done: false, note: 'Consolidation sorting and final-mile staging.' },
          { title: 'Out for Delivery / Station Ready', time: 'Pending', location: `${formData.city}, ${formData.region}`, done: false, note: 'Designated courier assigned with delivery code.' }
        ]
      };

      const savedOrder = await addPlacedOrder(newOrder);
      const confirmedOrder = savedOrder || newOrder;

      setPlacedOrderDetails(confirmedOrder);
      clearCart();
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Order #${confirmedOrder.orderCode || confirmedOrder.orderId} locked & confirmed!`, 'success');
    } catch (err) {
      console.error('Error in handlePlaceOrder:', err);
      showToast('Could not complete order. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderWhatsAppLink = (order) => {
    const itemsList = order.items
      .map((it) => `• ${it.name} (${it.qty} pcs) @ GH₵${it.price.toFixed(2)}`)
      .join('\n');

    const msg = encodeURIComponent(
      `Hello CHARI Team,\n\nI just placed an international import pre-order:\n*Order ID: #${order.orderId}*\nCustomer: *${order.customerName}*\nPhone: *${order.phone}*\nFreight Route: *${order.shippingMethod}*\nDestination: *${order.destination}*\n\n*Items:*\n${itemsList}\n\n*Total Amount: GH₵${order.total.toFixed(2)}*\nPayment: *${order.paymentMethod}*\nFX Lock Snapshot: *USD ${order.fxLock?.usdRate || '15.65'}*\nIdempotency Key: *${order.idempotencyKey}*\n\nPlease confirm receipt and allocation into the next container batch.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '28px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
        {/* FX Rate & Idempotency Guarantee Ticker Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '12px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="fx-rate-pill-dot" />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              FX Snapshot Guaranteed: 1 USD = GH₵{fxRates?.USD_GHS || '15.65'} • 1 RMB = GH₵{fxRates?.RMB_GHS || '2.18'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700 }}>
              <ShieldCheck size={14} /> Idempotency Key Active: {idempotencyKey.slice(0, 14)}...
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> 30-Min Price Lock
            </span>
          </div>
        </div>

        {/* Step Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: step >= 1 ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? 'var(--accent)' : 'var(--border-medium)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.84rem'
              }}
            >
              1
            </span>
            <span>Delivery & Logistics</span>
          </div>

          <div style={{ width: '40px', height: '2px', backgroundColor: step >= 2 ? 'var(--accent)' : 'var(--border-light)' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: step >= 2 ? 'var(--accent)' : 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? 'var(--accent)' : 'var(--border-medium)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.84rem'
              }}
            >
              2
            </span>
            <span>Payment & Review</span>
          </div>

          <div style={{ width: '40px', height: '2px', backgroundColor: step >= 3 ? '#10b981' : 'var(--border-light)' }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              color: step >= 3 ? '#10b981' : 'var(--text-muted)'
            }}
          >
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: step >= 3 ? '#10b981' : 'var(--border-medium)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.84rem'
              }}
            >
              3
            </span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* STEP 3: ORDER CONFIRMATION */}
        {step === 3 && placedOrderDetails && (
          <div
            className="glass-panel-elevated"
            style={{
              padding: '40px 32px',
              textAlign: 'center',
              maxWidth: '720px',
              margin: '0 auto'
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                border: '2px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckCircle2 size={48} />
            </div>

            <span className="badge badge-stock" style={{ marginBottom: '10px' }}>
              Transaction & Allocation Secured
            </span>
            
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
              Order Confirmed, {placedOrderDetails.customerName}!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px' }}>
              Your order is recorded with transactional database lock. Exchange rate and freight space snapshot locked.
            </p>

            {/* Order Reference Box */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '16px',
                padding: '20px',
                border: '1.5px dashed var(--border-medium)',
                marginBottom: '28px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '16px',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TRACKING ID
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  #{placedOrderDetails.orderId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TOTAL LOCKED
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent)', marginTop: '2px' }}>
                  GH₵{placedOrderDetails.total.toFixed(2)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  FREIGHT TYPE
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {placedOrderDetails.freightType === 'SEA_FREIGHT' ? 'Sea Freight FCL' : placedOrderDetails.freightType === 'AIR_FREIGHT' ? 'Air Cargo' : 'Local Courier'}
                </div>
              </div>
            </div>

            {/* Next Steps Notification */}
            <div
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderRadius: '14px',
                padding: '18px 20px',
                border: '1px solid var(--accent-border)',
                textAlign: 'left',
                marginBottom: '28px',
                fontSize: '0.88rem',
                color: 'var(--text-primary)'
              }}
            >
              <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PackageCheck size={18} /> Pre-Order Batching Lifecycle:
              </div>
              <ul style={{ paddingLeft: '22px', margin: 0, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                <li>Supplier fabrication and quality stress inspection initiated.</li>
                <li>Your items are consolidated into container batch <strong>BATCH-2026-FCL04</strong>.</li>
                <li>Customs single window clearance through Tema MPS Terminal 3 included.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href={getOrderWhatsAppLink(placedOrderDetails)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-lg"
                style={{ borderRadius: '14px' }}
              >
                <MessageCircle size={20} />
                <span>Send Order Slip to WhatsApp Support</span>
              </a>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate('track-order', { prefillCode: placedOrderDetails.orderCode || placedOrderDetails.orderId })}
                  style={{ borderRadius: '12px' }}
                >
                  Track My Order
                </button>
                <button
                  className="btn btn-dark"
                  onClick={() => navigate('shop')}
                  style={{ borderRadius: '12px' }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1 & 2: CHECKOUT FORM & BREAKDOWN */}
        {step < 3 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '28px',
              alignItems: 'start'
            }}
          >
            {/* Left: Interactive Form */}
            <div>
              {step === 1 ? (
                /* Step 1: Delivery & Logistics Routing */
                <form
                  onSubmit={handleProceedToPayment}
                  className="glass-panel"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      Delivery &amp; Freight Routing
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enter your address and select your international importation corridor.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Full Name / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        className="glass-input"
                        placeholder="e.g. Kwabena Asante"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        WhatsApp Active Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        className="glass-input"
                        placeholder="024 412 3456"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Email Address (For Invoices &amp; Tracking Codes)
                    </label>
                    <input
                      type="email"
                      className="glass-input"
                      placeholder="k.asante@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Ghana Region *
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="glass-input"
                        style={{ width: '100%' }}
                      >
                        {GHANA_REGIONS.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                        Town / Suburb *
                      </label>
                      <input
                        type="text"
                        required
                        className="glass-input"
                        placeholder="e.g. Spintex / Adum / Takoradi"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                      Doorstep Address / VIP Bus Station Destination *
                    </label>
                    <input
                      type="text"
                      required
                      className="glass-input"
                      placeholder="e.g. VIP Station Kumasi, or Hse No. 12 Spintex Road"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      style={{ width: '100%' }}
                    />
                  </div>

                  {/* Freight Corridor Engine Selector */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Select International Logistics Method
                      </label>
                      <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Scale size={12} /> {freightCalc.cbm} CBM • {freightCalc.actualKg} KG Volumetric
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {FREIGHT_OPTIONS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedShipping.id === method.id;
                        return (
                          <label
                            key={method.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '14px',
                              padding: '14px 16px',
                              borderRadius: '14px',
                              border: isSelected
                                ? '2px solid var(--accent)'
                                : '1px solid var(--border-light)',
                              backgroundColor: isSelected
                                ? 'var(--accent-subtle)'
                                : 'var(--bg-subtle)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <input
                              type="radio"
                              name="shippingMethod"
                              checked={isSelected}
                              onChange={() => setSelectedShipping(method)}
                              style={{ marginTop: '4px', accentColor: 'var(--accent)' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Icon size={16} color="var(--accent)" />
                                  {method.name}
                                </span>
                                <span style={{ color: 'var(--accent)' }}>
                                  GH₵{method.cost.toFixed(2)}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                {method.desc}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, marginTop: '4px' }}>
                                ETA Window: {method.time}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: '8px', borderRadius: '12px' }}>
                    Continue to Payment Options <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                /* Step 2: Payment Method */
                <div
                  className="glass-panel"
                  style={{
                    padding: '28px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                        Select Payment Method
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                        Encrypted Mobile Money &amp; Card checkout with transaction idempotency.
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.84rem',
                        color: 'var(--accent)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={16} /> Edit Details
                    </button>
                  </div>

                  {/* Payment Methods */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* MoMo Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '14px',
                        border: paymentMethod === 'momo'
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-light)',
                        backgroundColor: paymentMethod === 'momo'
                          ? 'var(--accent-subtle)'
                          : 'var(--bg-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'momo'}
                        onChange={() => setPaymentMethod('momo')}
                        style={{ marginTop: '4px', accentColor: 'var(--accent)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                            Mobile Money (MoMo Direct)
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ backgroundColor: '#f59e0b', color: '#000', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>MTN</span>
                            <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>Telecel</span>
                            <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>AT</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Instant MoMo prompt sent directly to your phone. Zero merchant fees.
                        </p>
                      </div>
                    </label>

                    {/* MoMo Configuration Subform */}
                    {paymentMethod === 'momo' && (
                      <div
                        style={{
                          backgroundColor: 'var(--bg-card)',
                          borderRadius: '12px',
                          padding: '16px',
                          border: '1px solid var(--border-light)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          marginLeft: '28px'
                        }}
                      >
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                            Choose Network Provider:
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            {[
                              { id: 'mtn', label: 'MTN MoMo', color: '#f59e0b' },
                              { id: 'telecel', label: 'Telecel Cash', color: '#ef4444' },
                              { id: 'at', label: 'AT Money', color: '#2563eb' }
                            ].map((prov) => (
                              <button
                                key={prov.id}
                                type="button"
                                onClick={() => setMomoProvider(prov.id)}
                                style={{
                                  padding: '8px',
                                  borderRadius: '8px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  border:
                                    momoProvider === prov.id
                                      ? `2px solid ${prov.color}`
                                      : '1px solid var(--border-light)',
                                  backgroundColor:
                                    momoProvider === prov.id ? 'var(--bg-subtle)' : 'transparent',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer'
                                }}
                              >
                                {prov.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                            {momoProvider.toUpperCase()} MoMo Phone Number *
                          </label>
                          <input
                            type="tel"
                            className="glass-input"
                            placeholder="024 123 4567"
                            value={momoNumber || formData.phone}
                            onChange={(e) => setMomoNumber(e.target.value)}
                            style={{ width: '100%' }}
                          />
                          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                            Enter your PIN on your handset when prompted to verify reservation.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Store Pickup / Inspection Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '14px',
                        border: paymentMethod === 'cash'
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-light)',
                        backgroundColor: paymentMethod === 'cash'
                          ? 'var(--accent-subtle)'
                          : 'var(--bg-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                        style={{ marginTop: '4px', accentColor: 'var(--accent)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                          Pay on Inspection / Store Collection (Accra Hub)
                        </span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Inspect stock in person at our Spintex / Accra warehouse hub before final settlement.
                        </p>
                      </div>
                    </label>

                    {/* Card Option */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '14px',
                        padding: '16px',
                        borderRadius: '14px',
                        border: paymentMethod === 'card'
                          ? '2px solid var(--accent)'
                          : '1px solid var(--border-light)',
                        backgroundColor: paymentMethod === 'card'
                          ? 'var(--accent-subtle)'
                          : 'var(--bg-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        style={{ marginTop: '4px', accentColor: 'var(--accent)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-primary)' }}>
                          Debit / Credit Card (Visa / Mastercard)
                        </span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Encrypted 3D Secure Ghanaian card payment.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Preorder Terms Agreement */}
                  <div
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      border: '1px solid var(--accent-border)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginTop: '12px'
                    }}
                  >
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        style={{ marginTop: '3px', accentColor: 'var(--accent)', width: '16px', height: '16px', flexShrink: 0 }}
                      />
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setPreorderTermsOpen(true)}
                          style={{
                            color: 'var(--accent)',
                            fontWeight: 700,
                            textDecoration: 'underline',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          Preorder Terms &amp; Conditions
                        </button>
                        . I understand that the FX rate (1 USD = GH₵{fxRates?.USD_GHS || '15.65'}) is locked at this moment, sea transit is 35-45 days, and delivery to my doorstep is fully handled.
                      </span>
                    </label>
                  </div>

                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handlePlaceOrder}
                    disabled={isSubmitting || !termsAgreed}
                    style={{ marginTop: '8px', borderRadius: '12px', opacity: termsAgreed ? 1 : 0.5 }}
                  >
                    {isSubmitting
                      ? 'Confirming Transaction & Locking Rates...'
                      : `Pay GH₵${grandTotal.toFixed(2)} & Lock Pre-Order`}
                  </button>
                </div>
              )}
            </div>

            {/* Right: Order Summary Breakdown Card */}
            <div
              className="glass-panel"
              style={{
                padding: '26px',
                position: 'sticky',
                top: '100px'
              }}
            >
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 16px' }}>
                Order Summary ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </h4>

              {/* Items List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                  marginBottom: '16px'
                }}
              >
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      paddingBottom: '12px',
                      borderBottom: '1px solid var(--border-light)'
                    }}
                  >
                    <img
                      src={item.product.images ? item.product.images[0] : (item.product.image || '')}
                      alt={item.product.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        backgroundColor: 'var(--bg-subtle)'
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} × GH₵{item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      GH₵{item.total.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Input */}
              <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Promo Code (e.g. CHARI10)"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="glass-input"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '0.84rem' }}
                />
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={validatingPromo}
                  style={{ padding: '8px 14px', fontSize: '0.84rem' }}
                >
                  {validatingPromo ? '...' : 'Apply'}
                </button>
              </form>

              {appliedPromo && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10b981',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    marginBottom: '16px'
                  }}
                >
                  <span>Code: {appliedPromo} (-GH₵{discountAmount.toFixed(2)})</span>
                  <button onClick={handleRemovePromo} style={{ color: '#ef4444', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              )}

              {/* Price Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Product Subtotal:</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>GH₵{cartSubtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Logistics ({selectedShipping.type === 'SEA_FREIGHT' ? 'Sea' : selectedShipping.type === 'AIR_FREIGHT' ? 'Air' : 'Local'}):</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>GH₵{shippingCost.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                    <span>Discount Applied:</span>
                    <span style={{ fontWeight: 700 }}>-GH₵{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    paddingTop: '12px',
                    borderTop: '1px dashed var(--border-medium)',
                    marginTop: '4px'
                  }}
                >
                  <span>Total Amount:</span>
                  <span style={{ color: 'var(--accent)' }}>
                    <span className="currency-ghc">GH₵</span>
                    {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
