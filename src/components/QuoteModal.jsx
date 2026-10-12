import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { submitInquiry } from '../services/api';
import { X, Send, MessageCircle, CheckCircle2, Upload, Search, Ship, Plane, ShieldCheck, Scale } from 'lucide-react';

export const QuoteModal = () => {
  const { quoteModalOpen, setQuoteModalOpen, showToast, WHATSAPP_NUMBER } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    productName: '',
    productUrl: '',
    budget: '',
    city: 'Accra',
    quantity: '1',
    notes: '',
    shippingPreference: 'sea' // sea or air
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  if (!quoteModalOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Saved as an Admin message so no request is lost; the photo itself is sent on WhatsApp.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const lines = [
      `Item: ${formData.productName}`,
      `Link: ${formData.productUrl || '—'}`,
      `Quantity: ${formData.quantity || '1'}`,
      `Budget: ${formData.budget ? `GH₵${formData.budget}` : 'Flexible'}`,
      `Shipping: ${formData.shippingPreference === 'air' ? 'Air (7–12 days)' : 'Sea (30–50 days)'}`,
      `Deliver to: ${formData.city || 'Accra'}`,
      `Details: ${formData.notes || '—'}`,
      imagePreview ? 'Customer has a photo — ask them to send it on WhatsApp.' : null,
    ].filter(Boolean);
    try {
      await submitInquiry({
        name: formData.name,
        phone: formData.phone,
        subject: `Item request: ${formData.productName}`.slice(0, 80),
        message: lines.join('\n'),
      });
      setSubmitted(true);
      showToast('Request sent. We will reply with a price on WhatsApp.', 'success');
    } catch (err) {
      showToast(err.message || 'Your request could not be sent. Please try again or use WhatsApp.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleSendViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello CHARI Sourcing Team,\n\n*REQUEST AN ITEM / CUSTOM SOURCING*:\n\n• *Name:* ${formData.name || 'Customer'}\n• *Phone:* ${formData.phone}\n• *Product:* ${formData.productName}\n• *Target Budget:* ${formData.budget ? `GH₵${formData.budget}` : 'Flexible'}\n• *Link/Ref:* ${formData.productUrl || 'Will send photo in chat'}\n• *Estimated Qty:* ${formData.quantity || '1'}\n• *Shipping Mode:* ${formData.shippingPreference === 'sea' ? 'Sea Cargo (30–50 Days)' : 'Air Express (7–12 Days)'}\n• *Destination:* ${formData.city || 'Accra'}\n• *Specs/Notes:* ${formData.notes || 'None'}\n\nPlease confirm factory pricing and quote in GHS.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    setQuoteModalOpen(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => setQuoteModalOpen(false)}
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
        className="modal-content-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0
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
            background: 'rgba(37,99,235,0.06)'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--accent-subtle)', border: '1px solid var(--accent-border)', color: 'var(--accent)', padding: '3px 10px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              <Search size={12} /> Custom order
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Request an item
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Seen something on 1688, Amazon, Alibaba, Shein, TikTok or Instagram? Send it to us and we'll get it for you.
            </p>
          </div>
          <button
            onClick={() => setQuoteModalOpen(false)}
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
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '32px 10px' }}>
              
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Request received
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                We'll check the price with the supplier and send you a full quote in cedis, including shipping and customs.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={18} /> Get a faster reply on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-muted)',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Reminder Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  backgroundColor: 'var(--accent-subtle)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  border: '1px solid rgba(37, 99, 235,0.12)',
                  fontSize: '0.78rem',
                  color: '#92400e',
                  lineHeight: 1.45
                }}
              >
                
                <span>
                  <strong>Good to know:</strong> Pre-orders are paid in full before we order from the supplier. Sea shipping takes <strong>30–50 days</strong> (+ 3–7 days port clearance). Shipping is charged by weight and paid when your item arrives in Ghana.
                </span>
              </div>

              {/* Name & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ama Serwaa"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="024 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Product Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  What item do you want? *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commercial Dough Mixer, Velvet Mannequins, Ladies Co-ords"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.9rem',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>

              {/* Link & Quantity */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Link (1688 / Taobao / Alibaba / Shein)
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.productUrl}
                    onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
              </div>

              {/* Target Budget & City */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Budget in GH₵ (optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 350"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Destination City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-medium)',
                      fontSize: '0.9rem',
                      backgroundColor: '#fff'
                    }}
                  >
                    <option value="Accra">Accra / Tema</option>
                    <option value="Kumasi">Kumasi</option>
                    <option value="Takoradi">Takoradi / Sekondi</option>
                    <option value="Tamale">Tamale</option>
                    <option value="Cape Coast">Cape Coast</option>
                    <option value="Sunyani">Sunyani</option>
                    <option value="Koforidua">Koforidua</option>
                    <option value="Other">Other Ghana Location</option>
                  </select>
                </div>
              </div>

              {/* Screenshot / Photo Upload Simulation */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Product Photo or Screenshot (Optional)
                </label>
                <div
                  style={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    backgroundColor: 'var(--bg-subtle)',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  {imagePreview ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                      />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Image attached</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Click to change photo</div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload size={22} color="#2563eb" style={{ margin: '0 auto 6px' }} />
                      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Upload screenshot from 1688 / Taobao / Instagram
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-light)', marginTop: '2px' }}>
                        PNG, JPG, or WEBP up to 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Preference */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Shipping preference
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: formData.shippingPreference === 'sea' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: formData.shippingPreference === 'sea' ? 'rgba(37, 99, 235, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <input
                      type="radio"
                      name="shippingPreference"
                      checked={formData.shippingPreference === 'sea'}
                      onChange={() => setFormData({ ...formData, shippingPreference: 'sea' })}
                    />
                    
                    <div>
                      <div>Sea Freight</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>30–50 Days (Cost-effective)</div>
                    </div>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: formData.shippingPreference === 'air' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: formData.shippingPreference === 'air' ? 'rgba(37, 99, 235, 0.08)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 600
                    }}
                  >
                    <input
                      type="radio"
                      name="shippingPreference"
                      checked={formData.shippingPreference === 'air'}
                      onChange={() => setFormData({ ...formData, shippingPreference: 'air' })}
                    />
                    
                    <div>
                      <div>Air Cargo</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>7–12 Days (Fast)</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Specs & Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Colours, sizes or other details
                </label>
                <textarea
                  rows={2}
                  placeholder="Specify exact colors, sizes, packaging or custom branding requirements..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-medium)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <button
                  type="submit"
                  disabled={sending}
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                   {sending ? 'Sending…' : 'Send request'}
                </button>
                <button
                  type="button"
                  onClick={handleSendViaWhatsApp}
                  style={{
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <MessageCircle size={16} /> Send via WhatsApp
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
