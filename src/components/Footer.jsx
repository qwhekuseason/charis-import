import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  MtnMomoIcon,
  TelecelCashIcon,
  AtMoneyIcon,
  VisaIcon,
  MastercardIcon,
  CashOnDeliveryIcon
} from './PaymentIcons';


export const Footer = () => {
  const { navigate, setQuoteModalOpen } = useStore();

  return (
    <footer
      style={{
        background: '#ffffff',
        color: '#64748b',
        paddingTop: '70px',
        paddingBottom: '44px',
        borderTop: '1px solid #e2e8f0',
      }}
    >
      <div className="container">

        {/* Contact Strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
            borderRadius: '20px',
            padding: '30px 36px',
            marginBottom: '60px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '22px',
            border: '1px solid #dbeafe',
            boxShadow: '0 4px 20px rgba(37,99,235,0.05)',
          }}
        >
          <div style={{ maxWidth: '520px' }}>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 6px',
                letterSpacing: '-0.01em',
              }}
            >
              Questions about an order or product?
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
              Reach us on WhatsApp — we're available daily for delivery, sourcing and payment queries.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/233591440934"
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
            <button
              className="btn btn-outline"
              onClick={() => navigate('contact')}
              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
            >
              Contact Page
            </button>
          </div>
        </div>

        {/* Main Footer Links */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '44px',
            marginBottom: '52px',
          }}
        >
          {/* Brand Col */}
          <div>
            <div
              onClick={() => navigate('home')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                marginBottom: '18px',
              }}
            >
              <img
                src="/charis-logo.jpeg"
                alt="CHARI Logo"
                style={{
                  width: '52px',
                  height: '52px',
                  objectFit: 'contain',
                  borderRadius: '12px',
                  display: 'block',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  CHARI<span style={{ color: 'var(--accent)' }}>.</span>
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Direct Imports
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', lineHeight: 1.7, marginBottom: '18px', color: '#475569' }}>
              Ghana's premier destination for quality direct global imports. Kitchen essentials, electronics, mannequins & fashion — quality-checked and delivered nationwide.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <MapPin size={14} color="#0284c7" />
                <span>Accra & Spintex Warehouse Hub, Greater Accra</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} color="#0284c7" />
                <a
                  href="https://wa.me/233591440934"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#334155', transition: 'color 0.15s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#334155')}
                >
                  +233 59 144 0934
                </a>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                <Mail size={14} color="#0284c7" />
                <span>support@chari.com</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Shop
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.9rem' }}>
              {[
                { label: 'All Wholesale Products', action: () => navigate('shop') },
                { label: 'Browse Categories', action: () => navigate('categories') },
                { label: 'Fresh Stock & Restocks', action: () => navigate('shop', { filter: 'justLanded' }) },
                { label: 'Bulk Container Pallets', action: () => navigate('shop', { filter: 'bulk' }) },
                { label: 'Starter MOQ Deals (Min 10)', action: () => navigate('shop', { filter: 'moq10' }) },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    className="footer-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Customer Care
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.9rem' }}>
              <li>
                <button onClick={() => navigate('track-order')} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', color: '#64748b' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}>Track My Order</button>
              </li>
              <li>
                <button onClick={() => navigate('contact')} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', color: '#64748b' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}>Contact Us & Locations</button>
              </li>
              <li>
                <a
                  href="https://wa.me/233591440934"
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.88rem', padding: '5px 0', fontWeight: 600 }}
                >
                  <MessageCircle size={13} /> WhatsApp Direct Support
                </a>
              </li>
              <li>
                <button onClick={() => setQuoteModalOpen(true)} className="footer-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', color: '#64748b' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')} onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}>Request Sourcing Quote</button>
              </li>
              <li>
                <span style={{ color: '#64748b', fontSize: '0.86rem', padding: '5px 0', display: 'block' }}>Accra Free Pickup Available</span>
              </li>
            </ul>
          </div>

          {/* Company & Guides */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Company & Guides
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.9rem' }}>
              {[
                { label: 'About Us', action: () => navigate('about') },
                { label: 'Importing to Ghana: 6 Steps', action: () => navigate('import-tips') },
                { label: 'Quality Inspection Guarantee', action: () => navigate('about') },
                { label: 'Wholesale Partner Inquiries', action: () => navigate('contact') },
                { label: 'Admin Logistics Portal', action: () => navigate('admin') },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', color: '#64748b', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '4px', transition: 'color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
                  >
                    {item.label}
                    <ArrowUpRight size={12} style={{ opacity: 0.5 }} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '28px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '0.79rem',
            color: '#64748b',
          }}
        >
          <div>© 2026 CHARI. All rights reserved. Quality direct imports delivered across Ghana.</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#64748b', fontWeight: 600, marginRight: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accepted:</span>
            <MtnMomoIcon />
            <TelecelCashIcon />
            <AtMoneyIcon />
            <VisaIcon />
            <MastercardIcon />
            <CashOnDeliveryIcon />
          </div>
        </div>
      </div>
    </footer>
  );
};
