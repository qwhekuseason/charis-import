import React from 'react';
import { X, CheckCircle2, AlertCircle, Ship, Clock, Scale, ShieldAlert, FileCheck, PhoneCall, ShieldCheck } from 'lucide-react';

export const PREORDER_TERMS = [
  {
    icon: CheckCircle2,
    color: '#2563eb',
    title: 'Paid in Full Upfront',
    desc: 'Preorders are paid in full before your order is processed and reserved with our overseas manufacturers.'
  },
  {
    icon: Clock,
    color: '#3b82f6',
    title: 'Batch Procurement',
    desc: 'Orders are placed directly with suppliers as soon as the active preorder batch window closes.'
  },
  {
    icon: Ship,
    color: '#0ea5e9',
    title: 'Estimated Sea Transit: 30–50 Days',
    desc: 'Estimated shipping time to Ghana is 30–50 days from international port departure.'
  },
  {
    icon: ShieldAlert,
    color: '#8b5cf6',
    title: 'Port Clearance: 3–7 Days',
    desc: 'After vessel arrival at Tema Port or airport, customs inspection and port clearance takes approximately 3–7 business days.'
  },
  {
    icon: Scale,
    color: '#10b981',
    title: 'Shipping Fees Paid Separately on Arrival',
    desc: 'International freight and local delivery fees are calculated by actual weight/CBM and paid when your package safely lands in Ghana.'
  },
  {
    icon: ShieldCheck,
    color: '#2563eb',
    title: 'Confirm Specs Before Payment',
    desc: 'Product colours, sizes, voltage, and exact specifications must be thoroughly reviewed and confirmed prior to checkout.'
  },
  {
    icon: FileCheck,
    color: '#ef4444',
    title: 'Strict Order Locking',
    desc: 'Once an order batch has been submitted to the supplier, modifications, cancellations, or refunds are not possible.'
  },
  {
    icon: AlertCircle,
    color: '#D4AF37',
    title: 'Realistic Estimates',
    desc: 'Transit times are good-faith estimates and may occasionally be influenced by carrier schedules, weather, or customs inspections.'
  },
  {
    icon: PhoneCall,
    color: '#14b8a6',
    title: 'Accurate Contact & Delivery Details',
    desc: 'Please ensure your full name, active WhatsApp number, and delivery city/VIP station are accurate for arrival dispatch.'
  }
];

export const PreorderTermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, rgba(255,255,255,0.8) 100%)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck size={20} color="#D4AF37" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                What to Know Before Ordering
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
              Please read our transparent direct-import terms before placing your preorder.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-subtle)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Terms List */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {PREORDER_TERMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.03)'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {idx + 1}. {item.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Slogan Banner */}
          <div
            style={{
              marginTop: '10px',
              padding: '16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
              color: '#ffffff',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Our Promise
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
              SEE IT. SEND IT. WE’LL SOURCE IT.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Direct factory procurement · Zero warehousing markups · 100% transparent tracking
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            By placing an order, you agree to these preorder terms.
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            I Understand &amp; Agree
          </button>
        </div>
      </div>
    </div>
  );
};
