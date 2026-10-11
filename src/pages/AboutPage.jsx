import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  ShoppingBag,
  ShieldCheck,
  Globe2,
  Truck,
  Users,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Building
} from 'lucide-react';

export const AboutPage = () => {
  const { navigate, setQuoteModalOpen } = useStore();

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Story Hero */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '20px',
            padding: '48px 36px',
            marginBottom: '40px',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}
        >
          <span className="section-pretitle">About CHARI</span>
          <h1
            style={{
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginBottom: '16px'
            }}
          >
            Quality imports, delivered across Ghana
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.7,
              maxWidth: '780px',
              margin: '0 auto 28px'
            }}
          >
            CHARI helps shoppers and small businesses in Ghana buy directly from suppliers in China, Turkey and Dubai — without the middlemen, high markups or customs stress.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border-light)'
            }}
          >
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>16</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Regions we deliver to</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>3</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Countries we buy from</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>Included</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Customs clearance</div>
            </div>
          </div>
        </div>

        {/* Our Mission & Values */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '48px'
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid var(--border-light)'
            }}
          >
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Direct Factory Partnerships
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              We buy from trusted suppliers in Yiwu, Guangzhou and Istanbul, so you pay close to factory prices.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid var(--border-light)'
            }}
          >
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Quality Checked Before Loading
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Our team checks items for quality before they are shipped to Ghana.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px 24px',
              border: '1px solid var(--border-light)'
            }}
          >
            
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Pickup in Accra
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Collect your order for free in Spintex, Accra, or we send it to your nearest bus station.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            backgroundColor: '#090d16',
            borderRadius: '16px',
            padding: '36px',
            color: '#ffffff',
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>
            Ready to stock your shop or boutique?
          </h3>
          <p style={{ color: '#cbd5e1', maxWidth: '560px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
            Shop online and get delivery to all 16 regions of Ghana.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('shop')}>
              Shop now <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setQuoteModalOpen(true)}
              style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', backgroundColor: 'transparent' }}
            >
              Request an item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
