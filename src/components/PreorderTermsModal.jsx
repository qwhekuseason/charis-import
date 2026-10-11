import React from 'react';
import { X, CheckCircle2, AlertCircle, Ship, Clock, Scale, ShieldAlert, FileCheck, PhoneCall, ShieldCheck } from 'lucide-react';

export const PREORDER_TERMS = [
  {
    icon: CheckCircle2,
    color: '#2563eb',
    title: 'Payment Confirms Your Order',
    desc: 'Your pre-order is confirmed once we receive your payment by Mobile Money or at pickup.'
  },
  {
    icon: Clock,
    color: '#3b82f6',
    title: 'Close to factory prices',
    desc: 'We group orders together to get you lower prices from overseas suppliers.'
  },
  {
    icon: Ship,
    color: '#0ea5e9',
    title: 'Shipping Times',
    desc: 'Sea shipping takes about 35–45 working days. Air cargo takes 7–12 working days.'
  },
  {
    icon: ShieldAlert,
    color: '#8b5cf6',
    title: 'Customs Handled for You',
    desc: 'We manage all customs clearance at Tema Port or Kotoka International Airport so you don\'t have to worry.'
  },
  {
    icon: Scale,
    color: '#10b981',
    title: 'No hidden fees',
    desc: 'Your shipping fee is calculated and clearly shown at checkout so you know exactly what you are paying.'
  },
  {
    icon: ShieldCheck,
    color: '#2563eb',
    title: 'Check Your Specs',
    desc: 'Please ensure you have selected your preferred size, colour, or model before completing payment.'
  },
  {
    icon: FileCheck,
    color: '#ef4444',
    title: 'Orders can’t be changed',
    desc: 'Once we’ve placed your order with the supplier, it can’t be changed or cancelled.'
  },
  {
    icon: AlertCircle,
    color: '#2563eb',
    title: 'Realistic Estimates',
    desc: 'Delivery times are estimates and can sometimes be delayed by shipping schedules, weather or customs checks.'
  },
  {
    icon: PhoneCall,
    color: '#14b8a6',
    title: 'Correct contact details',
    desc: 'Please make sure your name, WhatsApp number and delivery town or bus station are correct.'
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
        backgroundColor: 'rgba(15, 23, 42, 0.72)',        zIndex: 1000,
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
            background: 'rgba(37, 99, 235,0.06)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                What to Know Before Ordering
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '4px 0 0', fontWeight: 500 }}>
              Please read these terms before you place a pre-order.
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
              background: '#1e40af',
              color: '#ffffff',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Our Promise
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '4px' }}>
              See it. Send it. We'll source it.
            </div>
            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
              Bought from trusted suppliers · Clear prices in cedis · Track your order online
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
              background: '#2563eb',
              color: '#ffffff',
              padding: '10px 24px',
              borderRadius: '10px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer'
            }}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
};
