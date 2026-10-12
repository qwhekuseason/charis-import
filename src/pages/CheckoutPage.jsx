import React, { useState, useId } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
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
  Check,
  Copy
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
    calculateVolumetricFreight,
    referralInfo
  } = useStore();
  const [useCredit, setUseCredit] = useState(false);

  // Browser-held wallet credit (WALLET-...) can't be verified by the server, so it isn't carried into checkout.
  const carriedPromo = pageParams?.appliedPromo && !pageParams.appliedPromo.startsWith('WALLET-') ? pageParams : null;
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
    : { cbm: estimatedCbm, actualKg: estimatedActualKg, seaFreightGhs: 45, airFreightGhs: 95, customsDutyEst: 50 };

  const FREIGHT_OPTIONS = [
    {
      id: 'sea_freight',
      name: 'Sea shipping',
      type: 'SEA_FREIGHT',
      icon: Ship,
      cost: 35.00,
      time: '35 - 45 working days',
      desc: 'Shipped safely by sea from China to Tema Port. Most affordable option.'
    },
    {
      id: 'air_cargo',
      name: 'Air shipping',
      type: 'AIR_FREIGHT',
      icon: Plane,
      cost: 75.00,
      time: '7 - 12 working days',
      desc: 'Flown directly by air cargo into Accra for quicker delivery.'
    },
    {
      id: 'local_express',
      name: 'Local delivery (Accra)',
      type: 'LOCAL_DISPATCH',
      icon: Truck,
      cost: 40.00,
      time: '1 - 2 working days',
      desc: 'Delivered directly to your doorstep anywhere in Greater Accra from our Spintex hub.'
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
  const [copiedField, setCopiedField] = useState(null);

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
      showToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setCopiedField(null), 2500);
    } catch {
      showToast(`Copied: ${text}`, 'info');
    }
  };

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
  // Mirrors the server's rules so the total shown here matches what's charged:
  // the invited-friend welcome discount and a promo code don't combine — the bigger one applies.
  const welcomeDiscount = referralInfo?.welcomeDiscountAvailable ? Math.min(referralInfo.welcomeDiscount, cartSubtotal) : 0;
  const usingWelcome = welcomeDiscount > discountAmount;
  const effectiveDiscount = usingWelcome ? welcomeDiscount : discountAmount;
  const creditBalance = referralInfo?.creditBalance || 0;
  const creditUsed = useCredit ? Math.min(creditBalance, Math.max(0, cartSubtotal - effectiveDiscount)) : 0;
  const grandTotal = Math.max(0, cartSubtotal - effectiveDiscount - creditUsed + shippingCost);

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
            Your cart is empty
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            Add some products to your cart first.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('shop')}>
            Browse products
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
        containerNumber: null,
        flightNumber: null,
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
        useCredit: creditUsed > 0,
        total: grandTotal,
        shippingMethod: selectedShipping.name,
        shippingMethodId: selectedShipping.id,
        destination: `${formData.address}, ${formData.city} (${formData.region})`,
        city: formData.city,
        address: formData.address,
        region: formData.region,
        paymentMethod:
          paymentMethod === 'momo'
            ? `${momoProvider.toUpperCase()} MoMo Transfer (${momoNumber || formData.phone})`
            : 'Pay on collection (Spintex, Accra)',
        waybillNumber: `BL-GH-${orderId}`,
        steps: [
          { title: 'Order Confirmed', time: 'Just Now', location: 'Charis Import Office', done: true, note: 'Order registered and price locked in Cedis.' },
          { title: 'Supplier Processing & Quality Check', time: '1–3 Days', location: 'Overseas Warehouse', done: false, note: 'Supplier prepares and inspects items before shipping.' },
          { title: 'In Transit to Ghana', time: selectedShipping.type === 'SEA_FREIGHT' ? 'Sea: 35–45 days' : 'Air: 7–12 days', location: 'En Route to Ghana', done: false, note: 'Cargo moving safely to Ghana.' },
          { title: 'Customs Clearance at Port', time: 'Pending Arrival', location: 'Tema Port / Airport', done: false, note: 'Customs duties and port clearance processed.' },
          { title: 'Arrived at Accra Hub', time: 'Pending', location: 'Spintex Rd Hub, Accra', done: false, note: 'Sorted and prepared for local delivery.' },
          { title: 'Out for Delivery / Ready for Pickup', time: 'Pending', location: `${formData.city}, ${formData.region}`, done: false, note: 'Delivered to your address or ready for pickup.' }
        ]
      };

      const savedOrder = await addPlacedOrder(newOrder);
      const confirmedOrder = savedOrder || newOrder;

      setPlacedOrderDetails(confirmedOrder);
      clearCart();
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`Order #${confirmedOrder.orderCode || confirmedOrder.orderId} recorded successfully!`, 'success');

      // Auto-open WhatsApp with order details
      try {
        const waLink = getOrderWhatsAppLink(confirmedOrder);
        window.open(waLink, '_blank');
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
      `*📦 NEW ORDER CONFIRMATION - CHARIS IMPORT*\n\n` +
      `*Order ID:* #${code}\n` +
      `*Customer:* ${order.customerName}\n` +
      `*Phone:* ${order.phone}\n` +
      (order.email ? `*Email:* ${order.email}\n` : '') +
      `*Delivery Address:* ${order.destination || order.city}\n` +
      `*Delivery:* ${order.shippingMethod}\n\n` +
      `*ORDER ITEMS:*\n${itemsList}\n\n` +
      `*Subtotal:* GH₵${(order.subtotal || 0).toFixed(2)}\n` +
      `*Delivery / Shipping:* GH₵${(order.shippingCost || order.deliveryFee || 0).toFixed(2)}\n` +
      (order.discountAmount ? `*Discount:* -GH₵${order.discountAmount.toFixed(2)}\n` : '') +
      (order.creditUsed ? `*Store credit:* -GH₵${order.creditUsed.toFixed(2)}\n` : '') +
      `*TOTAL PAYABLE:* GH₵${(order.total || 0).toFixed(2)}\n\n` +
      `*Payment Method:* ${order.paymentMethod}\n` +
      `*Payment MoMo Account:* 059 144 0934 (CHARIS IMPORT)\n\n` +
      `Hello CHARIS team, I have confirmed this order on your website and am sending my payment details / transfer receipt now.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '28px' }}>
      <div className="container" style={{ maxWidth: '1080px' }}>
        
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
            <span>Delivery Information</span>
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

        {/* STEP 3: ORDER CONFIRMATION & PAYMENT TRANSFER DETAILS */}
        {step === 3 && placedOrderDetails && (
          <div
            className="glass-panel-elevated"
            style={{
              padding: '36px 28px',
              maxWidth: '740px',
              margin: '0 auto'
            }}
          >
            {/* Header / Success Indicator */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '10px' }}>
                <Check size={14} /> ORDER CONFIRMED &bull; AWAITING MOMO TRANSFER
              </div>
              
              <h2 style={{ fontSize: '1.95rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                Order #{placedOrderDetails.orderCode || placedOrderDetails.orderId} Placed!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '540px', margin: '0 auto' }}>
                Thank you, <strong>{placedOrderDetails.customerName}</strong>! Your order has been recorded. Please complete your Mobile Money transfer to the number below to initiate processing.
              </p>
            </div>

            {/* Order Reference & Amount Ticker */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '14px',
                padding: '16px 20px',
                border: '1px solid var(--border-light)',
                marginBottom: '24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '14px',
                textAlign: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  ORDER REFERENCE
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                  #{placedOrderDetails.orderCode || placedOrderDetails.orderId}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  TOTAL TO TRANSFER
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent)', marginTop: '2px' }}>
                  GH₵{placedOrderDetails.total.toFixed(2)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  FREIGHT / ROUTE
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {placedOrderDetails.freightType === 'SEA_FREIGHT' ? 'Sea shipping' : placedOrderDetails.freightType === 'AIR_FREIGHT' ? 'Air shipping (Express)' : 'Local Delivery'}
                </div>
              </div>
            </div>

            {/* HERO PAYMENT TRANSFER CARD */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '24px',
                border: '2px solid rgba(245, 158, 11, 0.45)',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.08)',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#f59e0b', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.8rem' }}>
                    MTN
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Mobile Money Transfer Details
                    </h3>
                    <div style={{ fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                      Official Charis Import Verified Recipient
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '0.74rem', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                  Zero Extra Fees
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Number Box */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      TRANSFER TO (MTN MOMO NUMBER)
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.02em', marginTop: '2px' }}>
                      059 144 0934
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      International format: +233 59 144 0934
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('0591440934', 'momoNumber', 'MoMo Number')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedField === 'momoNumber' ? (
                      <>
                        <Check size={15} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy Number</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Account Name */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      REGISTERED ACCOUNT NAME
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                      CHARIS IMPORT
                    </div>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                    Verified Merchant
                  </span>
                </div>

                {/* Amount to send */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      EXACT AMOUNT TO SEND
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent)', marginTop: '2px' }}>
                      GH₵{placedOrderDetails.total.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(placedOrderDetails.total.toFixed(2), 'momoAmount', 'Amount')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedField === 'momoAmount' ? (
                      <>
                        <Check size={15} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy Amount</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Reference */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-subtle)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      MOMO PAYMENT REFERENCE (REQUIRED)
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: '2px' }}>
                      {placedOrderDetails.orderCode || placedOrderDetails.orderId}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                      Put this reference in your MoMo transfer so we instantly identify your payment.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(placedOrderDetails.orderCode || placedOrderDetails.orderId, 'momoRef', 'Reference')}
                    className="btn btn-outline"
                    style={{ padding: '8px 14px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedField === 'momoRef' ? (
                      <>
                        <Check size={15} color="#10b981" />
                        <span style={{ color: '#10b981' }}>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={15} />
                        <span>Copy Reference</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions 1-2-3 */}
              <div
                style={{
                  marginTop: '18px',
                  padding: '14px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  lineHeight: 1.5,
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: '6px', color: '#b45309' }}>
                  📌 Quick 3-Step Transfer Guide:
                </div>
                <ol style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <li>Dial <strong>*170#</strong> or open your MTN MoMo / Bank App.</li>
                  <li>Transfer <strong>GH₵{placedOrderDetails.total.toFixed(2)}</strong> to <strong>059 144 0934</strong> with reference <strong>{placedOrderDetails.orderCode || placedOrderDetails.orderId}</strong>.</li>
                  <li>Click the button below to send your payment screenshot or SMS confirmation to WhatsApp.</li>
                </ol>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href={getOrderWhatsAppLink(placedOrderDetails)}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp btn-lg"
                style={{ borderRadius: '14px', fontSize: '0.98rem', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <MessageCircle size={22} />
                <span>Send Order &amp; Payment Receipt via WhatsApp</span>
              </a>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                💡 WhatsApp opened automatically upon checkout. Click the button above if it did not open.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => navigate('track-order', { prefillCode: placedOrderDetails.orderCode || placedOrderDetails.orderId, prefillPhone: placedOrderDetails.phone })}
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
                      Delivery Information
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                      Enter your address and choose how you would like your items delivered.
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
                      Street Address or Bus Station Destination *
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

                  {/* Delivery option */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Choose delivery
                      </label>
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
                    Continue to Payment <ArrowRight size={18} />
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
                        Pay safely using Mobile Money (MoMo) or pay upon pickup in Accra.
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
                            Mobile Money Transfer (MoMo)
                          </span>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span style={{ backgroundColor: '#f59e0b', color: '#000', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>MTN</span>
                            <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>Telecel</span>
                            <span style={{ backgroundColor: '#2563eb', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>AT</span>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Transfer directly to our official MoMo number (059 144 0934) after confirming. Details provided on next screen and sent to WhatsApp.
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
                            Your Network Provider:
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
                            Your {momoProvider.toUpperCase()} Phone Number:
                          </label>
                          <input
                            type="tel"
                            className="glass-input"
                            placeholder="024 123 4567"
                            value={momoNumber || formData.phone}
                            onChange={(e) => setMomoNumber(e.target.value)}
                            style={{ width: '100%' }}
                          />
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
                          Pay when you collect (Accra)
                        </span>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Check your items at our Spintex, Accra pickup point, then pay.
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
                          pre-order terms
                        </button>
                        . I understand pre-orders are paid in full, the price is fixed in cedis, and delivery takes the time shown above.
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
                      ? 'Placing Order & Connecting WhatsApp...'
                      : `Place order · GH₵${grandTotal.toFixed(2)}`}
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
                      src={sizedImage(item.product.images ? item.product.images[0] : (item.product.image || ''), 160)}
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

              {/* Store credit (from referrals) */}
              {creditBalance > 0 && (
                <label className="shop-check" style={{ marginBottom: '12px', padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: '10px' }}>
                  <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
                  Use my store credit (GH₵{creditBalance.toFixed(2)} available)
                </label>
              )}

              {usingWelcome && (
                <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#047857', fontSize: '0.84rem', fontWeight: 600, marginBottom: '12px' }}>
                  Welcome discount from your invite: −GH₵{welcomeDiscount.toFixed(2)}
                </div>
              )}

              {/* Promo Input */}
              <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Promo code"
                  aria-label="Promo code"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value)}
                  className="glass-input"
                  style={{ flex: 1, minWidth: 0, padding: '8px 12px', fontSize: '0.84rem' }}
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
                  <span>Items</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>GH₵{cartSubtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Delivery</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>GH₵{shippingCost.toFixed(2)}</span>
                </div>

                {effectiveDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>{usingWelcome ? 'Welcome discount' : 'Discount'}</span>
                    <span style={{ fontWeight: 700 }}>−GH₵{effectiveDiscount.toFixed(2)}</span>
                  </div>
                )}

                {creditUsed > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Store credit</span>
                    <span style={{ fontWeight: 700 }}>−GH₵{creditUsed.toFixed(2)}</span>
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
                  <span>Total</span>
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
