import React, { useState, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// `shortTail` replaces `tail` on phones so the message fits without being cut off.
const buildMessages = (maxDealPercent) => [
  { text: 'Use code ', bold: 'CHARI10', tail: ' for 10% off your first order', shortTail: ' = 10% off 1st order' },
  { text: 'Flash Deals: Save up to ', bold: `${maxDealPercent}% OFF`, tail: ' on selected imports', shortTail: '' },
  { text: '', bold: 'Invite a friend, earn GH₵25', tail: ' in store credit', shortTail: '' },
  { text: 'Spotted it online? ', bold: 'Request Any Item', tail: ' — we source it for you', shortTail: '' },
];

export const AnnouncementBar = () => {
  const { navigate, products } = useStore();
  const maxDealPercent = Math.round(
    Math.max(0, ...products.map((p) => (p.originalPrice > p.price ? (p.originalPrice - p.price) / p.originalPrice : 0))) * 100
  );
  // Skip the deals message when nothing is on sale.
  const MESSAGES = buildMessages(maxDealPercent).filter((m) => maxDealPercent > 0 || !m.text.startsWith('Flash Deals'));
  const [visible, setVisible] = useState(true);
  const [msgIndex, setMsgIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setFading(false);
      }, 350);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const msg = MESSAGES[msgIndex % MESSAGES.length];

  return (
    <div
      style={{
        background: '#1d4ed8',
        color: '#ffffff',
        fontSize: '0.8rem',
        fontWeight: 500,
        padding: '8px 0',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
        overflow: 'hidden',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          position: 'relative',
          paddingRight: '60px', // space for close + dots
        }}
      >
        {/* Small brand pill — no "LIVE" */}
        <span
          className="announcement-pill"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            fontSize: '0.62rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          
          Deal
        </span>

        {/* Rotating message */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: fading ? 0 : 1,
            transform: fading ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <span
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {msg.text}
            <strong
              style={{
                color: '#ffffff',
                textDecoration: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationColor: 'rgba(255, 255, 255, 0.7)',
              }}
            >
              {msg.bold}
            </strong>
            <span className="announcement-tail-long" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{msg.tail}</span>
            <span className="announcement-tail-short" style={{ color: 'rgba(255, 255, 255, 0.95)' }}>{msg.shortTail}</span>
          </span>

          {/* Shop Now — hidden on very small screens */}
          <button
            onClick={() => navigate('shop')}
            className="announcement-cta"
            style={{
              marginLeft: '4px',
              backgroundColor: '#ffffff',
              color: '#1d4ed8',
              padding: '2px 10px',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              transition: 'all 0.15s ease',
            }}
          >
            Shop Now →
          </button>
        </div>

        {/* Dot indicators — desktop only */}
        <div
          className="announcement-dots"
          style={{
            position: 'absolute',
            right: '28px',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          {MESSAGES.map((_, i) => (
            <span
              key={i}
              onClick={() => setMsgIndex(i)}
              style={{
                width: i === msgIndex ? '14px' : '5px',
                height: '5px',
                borderRadius: '3px',
                backgroundColor: i === msgIndex ? '#3b82f6' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss announcement"
          style={{
            position: 'absolute',
            right: '0',
            color: 'rgba(255,255,255,0.4)',
            padding: '4px',
            lineHeight: 0,
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};
