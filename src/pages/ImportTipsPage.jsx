import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  Search,
  FileSpreadsheet,
  CreditCard,
  Globe2,
  Ship,
  Truck,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plane
} from 'lucide-react';

export const ImportTipsPage = () => {
  const { setQuoteModalOpen, WHATSAPP_NUMBER } = useStore();

  const steps = [
    {
      num: 1,
      title: 'Identify Your Product',
      desc: 'Find the exact item you want on sites like Amazon, Alibaba, 1688, or AliExpress. Take clear screenshots, note sizes, colors, and the quantity you need.',
      icon: Search,
      highlight: 'Alibaba, 1688, Amazon, AliExpress'
    },
    {
      num: 2,
      title: 'Request a Quote',
      desc: 'Send us the link or photo through our quote form or WhatsApp. We will calculate the total cost in Ghanaian Cedi (GH₵) including factory cost, freight, and Tema port clearing duties.',
      icon: FileSpreadsheet,
      highlight: 'Transparent all-inclusive quote in GH₵'
    },
    {
      num: 3,
      title: 'Payment Transfer',
      desc: 'Review and accept your transparent quotation. Pay via Mobile Money (MTN MoMo, Telecel Cash, AT Money) or Ghanaian bank transfer to initiate procurement.',
      icon: CreditCard,
      highlight: 'Secure MoMo & Bank deposit'
    },
    {
      num: 4,
      title: 'Global Sourcing & Inspection',
      desc: 'Our procurement agents in Yiwu, Guangzhou (China), Istanbul (Turkey), and the USA visit the factory, inspect sample units for flaws, verify counts, and package them securely for overseas transit.',
      icon: Globe2,
      highlight: 'Pre-shipment factory inspection'
    },
    {
      num: 5,
      title: 'Transit & Ghana Port Clearing',
      desc: 'We manage full international freight logistics — handling shipping manifests, bill of lading, and comprehensive Ghana Revenue Authority (Customs Division) Tema Port clearance.',
      icon: Ship,
      highlight: 'Zero customs headaches for you'
    },
    {
      num: 6,
      title: 'Local Delivery in Ghana',
      desc: 'Once cleared, pick up free from our Spintex / Accra Central warehouse, or have your consignment dispatched straight to your doorstep or regional VIP/STC parcel bus terminal.',
      icon: Truck,
      highlight: 'Nationwide delivery across all 16 regions'
    }
  ];

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '960px' }}>
        {/* Header */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '40px 32px',
            marginBottom: '40px',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}
        >
          <span className="section-pretitle">CHARI Knowledge Hub</span>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              marginBottom: '14px'
            }}
          >
            Importing to Ghana: What to know before you order
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: '750px',
              margin: '0 auto 20px'
            }}
          >
            General guidance drawn from our own hands-on experience sourcing, inspecting, and clearing containers into Ghana. We make global importation simple, predictable, and stress-free.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(217, 119, 6, 0.1)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.82rem',
              color: 'var(--accent)',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>
              Always verify regulatory compliance with Ghana Revenue Authority (GRA Customs Division) or FDA for regulated items like food and cosmetics.
            </span>
          </div>
        </div>

        {/* The 6-Step Process Cards */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="section-pretitle">The 6-Step Process</span>
            <h2 className="section-title">Simple, clear, and efficient importation</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {steps.map((step) => {
              const IconComp = step.icon;
              return (
                <div
                  key={step.num}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '24px',
                    boxShadow: 'var(--shadow-sm)'
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
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      flexShrink: 0
                    }}
                  >
                    {step.num}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {step.title}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--bg-subtle)',
                          color: 'var(--text-secondary)',
                          padding: '3px 10px',
                          borderRadius: '9999px'
                        }}
                      >
                        {step.highlight}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sea Freight vs Air Freight Comparison */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '16px',
            padding: '36px',
            marginBottom: '48px',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <span className="section-pretitle">Shipping Methods</span>
            <h2 className="section-title">Sea Freight vs Air Express to Ghana</h2>
            <p className="section-desc" style={{ margin: '6px auto 0' }}>
              Choose the best transit mode based on weight, urgency, and resale budget.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Sea Freight */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: '12px',
                padding: '24px',
                border: '1.5px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Ship size={24} color="#0284c7" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sea Freight (Container Cargo)</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Lowest Cost:</strong> Priced by CBM (Cubic Metres). Ideal for heavy goods, mannequins, furniture, and bulk cartons.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Transit Time:</strong> 35 - 50 days from China port to Tema Harbour.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Port Clearance:</strong> CHARIS handles clearing, duties, and offloading.</span>
                </li>
              </ul>
            </div>

            {/* Air Freight */}
            <div
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.07)',
                borderRadius: '12px',
                padding: '24px',
                border: '1.5px solid rgba(217, 119, 6, 0.25)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Plane size={24} color="var(--accent)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Air Cargo (Express Freight)</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Fast Delivery:</strong> 7 - 12 business days to Kotoka Airport, Accra.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Best For:</strong> High-value lightweight goods, sample orders, urgent seasonal fashion, and electronics.</span>
                </li>
                <li style={{ display: 'flex', gap: '8px' }}>
                  <CheckCircle2 size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Pricing:</strong> Calculated per kilogram ($/kg) including airport clearance.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '16px',
            padding: '36px',
            color: '#ffffff',
            textAlign: 'center'
          }}
        >
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>
            Have a specific product in mind?
          </h3>
          <p style={{ fontSize: '0.95rem', color: '#cbd5e1', maxWidth: '560px', margin: '0 auto 24px' }}>
            Message us on WhatsApp or request an itemized quotation. We advise on sourcing, factory vetting, duties, and realistic delivery timelines.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => setQuoteModalOpen(true)}
            >
              Request Sourcing Quote
            </button>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                'Hello CHARI Team, I would like advice on importing an item into Ghana.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-whatsapp"
            >
              <MessageCircle size={18} /> Chat with Sourcing Agent
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
