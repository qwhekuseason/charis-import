import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { submitInquiry } from '../services/api';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle2
} from 'lucide-react';

export const ContactPage = () => {
  const { showToast, WHATSAPP_NUMBER, settings } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'General question',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitInquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });
      setSubmitted(true);
      showToast('Message sent. We will reply on WhatsApp or by phone.', 'success');
    } catch (err) {
      // Never pretend it worked — the customer can fix the problem or use WhatsApp instead.
      showToast(err.message || 'Your message could not be sent. Please try again or use WhatsApp.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppDirect = () => {
    const text = encodeURIComponent(
      `Hello CHARI Team,\n\nName: ${formData.name || 'Customer'}\nPhone: ${formData.phone || 'N/A'}\nSubject: ${formData.subject}\n\nMessage: ${formData.message || 'I have an inquiry regarding your products.'}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
  };

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: '980px' }}>
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
          <span className="section-pretitle">Get in Touch</span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Contact CHARI <HiddenGem spot="contact-page" />
          </h1>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-muted)', maxWidth: '620px', margin: '0 auto' }}>
            Questions about a product, an order or a special request? Our Kumasi team is happy to help.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px'
          }}
        >
          {/* Contact Details Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* WhatsApp Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '14px',
                padding: '24px',
                border: '1.5px solid rgba(34, 197, 94, 0.35)',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>WhatsApp</h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fastest way to reach us</span>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Chat with our team for prices, order updates and delivery questions.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-whatsapp"
                style={{ width: '100%' }}
              >
                <MessageCircle size={18} /> Chat on WhatsApp
              </a>
            </div>

            {/* Details */}
            <div className="contact-details">
              <div>
                <h4>Phone</h4>
                <a href={`tel:+${settings.whatsappNumber}`}>{settings.phoneDisplay}</a>
              </div>
              {settings.email && (
                <div>
                  <h4>Email</h4>
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                </div>
              )}
              <div>
                <h4>Pickup location</h4>
                <p>{settings.pickupPoint}</p>
                <p className="contact-note">Free pickup available</p>
              </div>
              <div>
                <h4>Opening hours</h4>
                <p>{settings.openingHours}</p>
                <p className="contact-note">We reply on WhatsApp every day</p>
              </div>
            </div>
          </div>
          {/* Form Column */}
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Message Received!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '24px' }}>
                  Thank you for reaching out. Someone from our team will contact you on WhatsApp or by phone soon.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => setSubmitted(false)}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Send us a message
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Akosua Mensah"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Phone / WhatsApp *
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
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      Inquiry Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="General question">General question</option>
                      <option value="Bulk / wholesale order">Bulk / wholesale order</option>
                      <option value="Track my order">Track my order</option>
                      <option value="Request an item">Request an item</option>
                      <option value="Pickup in Kumasi">Pickup in Kumasi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Email <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Your Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us what you would like to know or items you need..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary">
                     Send Message
                  </button>
                  <button
                    type="button"
                    className="btn btn-whatsapp"
                    onClick={handleWhatsAppDirect}
                  >
                    <MessageCircle size={16} /> Send via WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
