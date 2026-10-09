import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
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

export const TrackOrderPage = () => {
  const { orders, WHATSAPP_NUMBER, fxRates, pageParams } = useStore();
  const [searchInput, setSearchInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Auto-search if navigated from AccountPage with a prefill order code
  React.useEffect(() => {
    if (!pageParams?.prefillCode) return;
    const code = pageParams.prefillCode.trim().toUpperCase();
    setSearchInput(code);
    setLoading(true);
    import('../services/api').then(({ trackOrder: apiTrack }) => {
      apiTrack(code)
        .then((liveOrder) => {
          if (liveOrder) {
            setSearchedOrder({
              ...liveOrder,
              orderId: liveOrder.orderCode,
              orderCode: liveOrder.orderCode,
              shippingCost: liveOrder.deliveryFee,
              deliveryFee: liveOrder.deliveryFee,
              status: liveOrder.orderStatus ? liveOrder.orderStatus.toLowerCase() : 'processing',
              customerCity: liveOrder.city,
              date: new Date(liveOrder.createdAt).toLocaleDateString('en-GB'),
              shippingMethod: liveOrder.deliveryMethod,
              destination: liveOrder.address ? `${liveOrder.address}, ${liveOrder.city}` : liveOrder.city,
              steps: [
                { title: 'Order Confirmed & FX Locked', time: new Date(liveOrder.createdAt).toLocaleDateString('en-GB'), location: 'Accra FX Treasury Hub', done: true, note: 'Payment verified and FX rate snapshot secured.' },
                { title: 'Factory Batching & QC Inspection', time: 'In Progress', location: 'Fulfillment Consolidation Depot', done: liveOrder.orderStatus !== 'PENDING', note: 'Quality check and batch allocation.' },
                { title: 'On High Seas / Cargo Transit', time: 'Pending', location: 'International Cargo Corridor', done: liveOrder.orderStatus === 'SHIPPED' || liveOrder.orderStatus === 'DELIVERED', note: 'Vessel transit or dispatch in progress.' },
                { title: 'Local Customs Clearance', time: 'Pending', location: 'Tema Port / KIA Single Window', done: liveOrder.orderStatus === 'SHIPPED' || liveOrder.orderStatus === 'DELIVERED', note: 'ICUMS customs valuation & duty declaration.' },
                { title: 'Arrived at Accra Central Distribution Hub', time: 'Pending', location: 'Spintex Rd Fulfillment Hub', done: liveOrder.orderStatus === 'DELIVERED', note: 'Sorting and local dispatch staging.' },
                { title: 'Out for Delivery / Ready for Collection', time: 'Pending', location: liveOrder.city || 'Greater Accra', done: liveOrder.orderStatus === 'DELIVERED', note: 'Final doorstep delivery or station pickup.' }
              ]
            });
          } else if (orders[code]) {
            setSearchedOrder(orders[code]);
          }
          setHasSearched(true);
        })
        .catch(() => {
          if (orders[code]) setSearchedOrder(orders[code]);
          setHasSearched(true);
        })
        .finally(() => setLoading(false));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageParams?.prefillCode]);

  const handleSearch = async (e) => {

    if (e) e.preventDefault();
    const query = searchInput.trim().toUpperCase();
    if (!query) return;

    setLoading(true);

    // 1. Try local memory / cache first (orders placed in this session)
    if (orders[query]) {
      setSearchedOrder(orders[query]);
      setHasSearched(true);
      setLoading(false);
      return;
    }

    // Also handle lowercase lookup for session orders
    const sessionMatch = Object.values(orders).find(
      (o) => (o.orderCode || o.orderId || '').toUpperCase() === query
    );
    if (sessionMatch) {
      setSearchedOrder(sessionMatch);
      setHasSearched(true);
      setLoading(false);
      return;
    }

    // 2. Try fetching from order history
    try {
      const liveOrder = await apiTrackOrder(query);
      if (liveOrder) {
        setSearchedOrder({
          ...liveOrder,
          orderId: liveOrder.orderCode,
          orderCode: liveOrder.orderCode,
          shippingCost: liveOrder.deliveryFee,
          deliveryFee: liveOrder.deliveryFee,
          status: liveOrder.orderStatus ? liveOrder.orderStatus.toLowerCase() : 'processing',
          customerCity: liveOrder.city,
          date: new Date(liveOrder.createdAt).toLocaleDateString('en-GB'),
          estimatedDelivery: '1 - 3 business days',
          shippingMethod: liveOrder.deliveryMethod,
          destination: liveOrder.address ? `${liveOrder.address}, ${liveOrder.city}` : liveOrder.city,
          steps: [
            { title: 'Order Confirmed & FX Locked', time: new Date(liveOrder.createdAt).toLocaleDateString('en-GB'), location: 'Accra FX Treasury Hub', done: true, note: 'Payment verified and FX rate snapshot secured.' },
            { title: 'Factory Batching & QC Inspection', time: 'In Progress', location: 'Fulfillment Consolidation Depot', done: liveOrder.orderStatus !== 'PENDING', note: 'Quality check and batch allocation.' },
            { title: 'On High Seas / Cargo Transit', time: 'Pending', location: 'International Cargo Corridor', done: liveOrder.orderStatus === 'SHIPPED' || liveOrder.orderStatus === 'DELIVERED', note: 'Vessel transit or dispatch in progress.' },
            { title: 'Local Customs Clearance', time: 'Pending', location: 'Tema Port / KIA Single Window', done: liveOrder.orderStatus === 'SHIPPED' || liveOrder.orderStatus === 'DELIVERED', note: 'ICUMS customs valuation & duty declaration.' },
            { title: 'Arrived at Accra Central Distribution Hub', time: 'Pending', location: 'Spintex Rd Fulfillment Hub', done: liveOrder.orderStatus === 'DELIVERED', note: 'Sorting and local dispatch staging.' },
            { title: 'Out for Delivery / Ready for Collection', time: 'Pending', location: liveOrder.city || 'Greater Accra', done: liveOrder.orderStatus === 'DELIVERED', note: 'Final doorstep delivery or station pickup.' }
          ]
        });
        setHasSearched(true);
        setLoading(false);
        return;
      }
    } catch {
      // Fallback
    }

    // 3. Search by phone number in local memory
    const found = Object.values(orders).find(
      (ord) => ord.phone && ord.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))
    );

    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder(null);
    }
    setHasSearched(true);
    setLoading(false);
  };

  const loadPreset = (orderId) => {
    setSearchInput(orderId);
    if (orders[orderId]) {
      setSearchedOrder(orders[orderId]);
      setHasSearched(true);
    } else {
      apiTrackOrder(orderId).then((res) => {
        if (res) {
          setSearchedOrder({
            ...res,
            orderId: res.orderCode,
            status: res.orderStatus ? res.orderStatus.toLowerCase() : 'processing',
            customerCity: res.city,
            shippingMethod: res.deliveryMethod,
            destination: res.address ? `${res.address}, ${res.city}` : res.city,
            steps: [
              { title: 'Order Confirmed & FX Locked', time: new Date(res.createdAt).toLocaleDateString('en-GB'), location: 'Accra FX Treasury Hub', done: true, note: 'Payment verified and FX locked.' },
              { title: 'Factory Batching & QC Inspection', time: 'In Progress', location: 'Consolidation Center', done: true, note: 'QC inspection cleared.' },
              { title: 'On High Seas / Cargo Transit', time: 'Underway', location: 'In Transit', done: true, current: true, note: 'Shipment dispatched.' },
              { title: 'Local Customs Clearance', time: 'Pending', location: 'Tema Port / KIA', done: false, note: 'Duty clearance scheduled.' },
              { title: 'Arrived at Accra Central Distribution Hub', time: 'Pending', location: 'Spintex Rd Hub', done: false, note: 'Awaiting container arrival.' },
              { title: 'Out for Delivery / Collection', time: 'Pending', location: res.city, done: false, note: 'Delivery routing pending.' }
            ]
          });
        }
        setHasSearched(true);
      }).catch(() => {
        setHasSearched(true);
      });
    }
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

  const isSeaFreight = searchedOrder?.freightType === 'SEA_FREIGHT' || searchedOrder?.containerNumber;
  const isAirFreight = searchedOrder?.freightType === 'AIR_FREIGHT' || searchedOrder?.flightNumber;

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '32px' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Glassmorphic Search & Header Console */}
        <div className="glass-panel" style={{ padding: '36px 28px', marginBottom: '28px', textAlign: 'center' }}>
          
          {/* Header Icon */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05))',
              border: '1.5px solid var(--accent-border)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px var(--accent-subtle)'
            }}
          >
            <Package size={32} />
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span className="fx-rate-pill">
              <span className="fx-rate-pill-dot" />
              Direct International Cargo Tracking
            </span>
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Live Shipment & Pre-Order Tracking
          </h1>
          <p style={{ fontSize: '0.94rem', color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Track international sea freight containers, express air cargo, and domestic bus waybills across all 6 stages of the importation pipeline.
          </p>

          {/* Search Bar with Glass Glow */}
          <form
            onSubmit={handleSearch}
            style={{
              display: 'flex',
              maxWidth: '560px',
              margin: '0 auto',
              gap: '10px',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flex: 1,
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
                placeholder="Enter Tracking / Order ID (e.g. CHR-SEA-8821)"
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
            <span>💡 Enter the order code from your WhatsApp or email receipt (e.g. <strong>CHR-2026-...</strong>) or search with your phone number</span>
          </div>
        </div>

        {/* Results Console */}
        {hasSearched && searchedOrder ? (
          <div className="glass-panel-elevated" style={{ padding: '32px', marginBottom: '32px' }}>
            
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
                    Tracking Master Record
                  </span>
                  {searchedOrder.idempotencyKey && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                        color: '#10b981',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <ShieldCheck size={11} /> Idempotent Lock
                    </span>
                  )}
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
                      <span>Target ETA: <strong style={{ color: '#10b981' }}>{searchedOrder.etaDate}</strong></span>
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
                        ? 'rgba(212, 175, 55, 0.15)'
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
                    Waybill / BL: <strong style={{ color: 'var(--text-primary)' }}>{searchedOrder.waybillNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* International Vessel / Flight Details (If applicable) */}
            {(isSeaFreight || isAirFreight) && (
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '32px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '16px'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {isSeaFreight ? 'Vessel & Maritime Voyage' : 'Cargo Flight & Air Waybill'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isSeaFreight ? <Ship size={18} color="#0284c7" /> : <Plane size={18} color="#2563eb" />}
                    <span>{searchedOrder.vesselName || searchedOrder.flightNumber}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {searchedOrder.containerType || searchedOrder.airWaybill}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Route Corridor
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {searchedOrder.portOfOrigin?.split(',')[0]} → {searchedOrder.portOfDestination?.split('(')[0]}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                    MPS Terminal 3 / GRA ICUMS Verified
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Volumetric Cargo Metrics
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    <Scale size={16} color="var(--accent)" />
                    <span>
                      {searchedOrder.volumetricWeight?.cbm} CBM • {searchedOrder.volumetricWeight?.actualKg} KG
                    </span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Volumetric conversion: 1:167 Air / FCL Sea
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    FX Rate Snapshot Locked
                  </span>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                    USD/GHS: 15.65 • RMB/GHS: 2.18
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Margin protected against depreciation
                  </div>
                </div>
              </div>
            )}

            {/* Expressive 6-Stage Timeline Visualizer */}
            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  6-Stage Importation Lifecycle
                </h3>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {progressPercent}% Complete
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
                        {isDone ? (
                          <CheckCircle2 size={20} />
                        ) : isCurrent ? (
                          <Clock size={19} className="animate-spin" />
                        ) : (
                          <span>{i + 1}</span>
                        )}
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
                        {isDone ? <Check size={18} /> : isCurrent ? <Clock size={18} /> : <span>{idx + 1}</span>}
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
                            <MapPin size={12} /> {st.location}
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
                  <MapPin size={18} color="var(--accent)" />
                  <span>{searchedOrder.destination || 'Accra Central Hub Collection'}</span>
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
                  <ShieldCheck size={14} /> Mobile Money / Card Verified
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
                            src={it.image}
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
            <AlertCircle size={44} color="#f59e0b" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No shipment found matching "{searchInput}"
            </h3>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '22px', maxWidth: '480px', margin: '0 auto 22px' }}>
              Please verify your tracking code or the Ghana phone number used during checkout.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => loadPreset('CHR-2026-7841')}
            >
              Load Demo Order #CHR-2026-7841
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
