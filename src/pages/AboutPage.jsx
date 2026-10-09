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
            Empowering Ghanaian Retailers with Direct Factory Imports
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
            CHARI was founded to bridge the gap between global manufacturing hubs in China, Turkey, and the USA, and local Ghanaian retail entrepreneurs. We eliminate unnecessary middlemen, high shipping markups, and port clearance confusion.
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
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>5,000+</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Happy Customers Served</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>16</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Regions Delivered in Ghana</div>
            </div>
            <div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent)' }}>100%</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Port Clearing Guarantee</div>
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
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Globe2 size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Direct Factory Partnerships
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              We partner directly with verified manufacturers in Yiwu, Guangzhou, and Istanbul. No third-party trading markups — you get authentic factory pricing.
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
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: 'rgba(5, 150, 105, 0.12)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <ShieldCheck size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Quality Checked Before Loading
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Our procurement agents on the ground in China personally open cartons and test items for stitching, motors, and finish before sealing the containers.
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
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Building size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Accra Warehouse &amp; Pickup Hub
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Inspect and collect your orders free of charge at our Accra hub, or let our logistics team book parcel delivery to your regional bus station.
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
            Explore our curated collection of quality products — shop online with delivery across all 16 regions of Ghana.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('shop')}>
              Explore Our Shop <ArrowRight size={16} />
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setQuoteModalOpen(true)}
              style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff', backgroundColor: 'transparent' }}
            >
              Request Custom Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
