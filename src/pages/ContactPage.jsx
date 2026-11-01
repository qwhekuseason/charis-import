import React, { useState, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { submitInquiry } from '../services/api';
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Package,
  Search,
  Boxes,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  Navigation
} from 'lucide-react';
import './ContactPage.css';

const SUBJECTS = ['General question', 'Bulk / wholesale order', 'Problem with an order', 'Payment', 'Something else'];
const phoneDigits = (v) => String(v || '').replace(/\D/g, '');

// Name, phone and email from the account or the last checkout on this phone.
const savedContact = (user) => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('chari_checkout_details')) || {}; } catch {}
  return { name: user?.name || saved.fullName || '', phone: user?.phone || saved.phone || '', email: user?.email || saved.email || '' };
};

export const ContactPage = () => {
  const { WHATSAPP_NUMBER, settings, user, navigate, setQuoteModalOpen } = useStore();
  const [formData, setFormData] = useState(() => ({ ...savedContact(user), subject: 'General question', message: '' }));
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const formRef = useRef(null);

  // Answers to what people ask most, so they don't have to wait for a reply.
  const FAQS = [
    ['How long does delivery take?', 'Sea shipping takes about 35–45 working days and air shipping 7–12 working days. Items already in stock in Kumasi arrive in 1–2 working days.'],
    ['How do I pay?', `By Mobile Money (MTN, Telecel or AT) to ${settings.momoNumber} (${settings.momoName}), using your order code as the reference. All orders are pre-orders, paid in full before we buy from the supplier.`],
    ['Can I change or cancel an order?', 'Pre-orders are bought from the supplier once paid, so they usually can’t be changed after that. Message us as soon as possible and we’ll do our best.'],
    ['Are customs and duties included?', 'Yes. The price at checkout includes customs clearance; you only add the delivery option you choose.'],
    ['Do you deliver outside Kumasi?', 'Yes — anywhere in Ghana, to your door or your nearest bus station.'],
  ];

  const update = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key] || errors.form) setErrors((prev) => ({ ...prev, [key]: undefined, form: undefined }));
  };

  const validate = () => {
    const found = {};
    if (!formData.name.trim()) found.name = 'Enter your name.';
    if (phoneDigits(formData.phone).length < 9) found.phone = 'Enter a phone or WhatsApp number we can reply on.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) found.email = 'Check this email address, or leave it empty.';
    if (formData.message.trim().length < 5) found.message = 'Write a short message so we know how to help.';
    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) { formRef.current?.querySelector(`[name="${first}"]`)?.focus(); return; }
    setSubmitting(true);
    try {
      await submitInquiry({ ...formData, name: formData.name.trim(), email: formData.email.trim(), message: formData.message.trim() });
      setSubmitted(true);
    } catch (err) {
      // Never pretend it worked — the customer can fix the problem or use WhatsApp instead.
      setErrors({ form: err.message || 'Your message could not be sent. Please try again or use WhatsApp.' });
    } finally {
      setSubmitting(false);
    }
  };

  const whatsAppLink = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  const formAsWhatsApp = () => whatsAppLink(
    `Hello CHARI,\n\n${formData.message.trim() || 'I have a question.'}\n\n— ${formData.name.trim() || 'A customer'}${formData.subject ? ` (${formData.subject})` : ''}`
  );

  const copyPhone = () => {
    navigator.clipboard?.writeText(settings.phoneDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`CHARI ${settings.location}`)}`;
  const err = (key) => (errors[key] ? <span className="ct-error" id={`ct-${key}-error`} role="alert"><AlertCircle size={13} /> {errors[key]}</span> : null);
  const aria = (key) => ({ name: key, 'aria-invalid': Boolean(errors[key]), 'aria-describedby': errors[key] ? `ct-${key}-error` : undefined });

  return (
    <div className="section ct-page">
      <div className="container ct-container">
        <header className="ct-head">
          <h1>How can we help? <HiddenGem spot="contact-page" /></h1>
          <p>Our Kumasi team replies on WhatsApp every day. For most things, one of these is quickest:</p>
        </header>

        {/* Quick routes — straight to the right place instead of a message */}
        <div className="ct-quick">
          <button type="button" className="ct-quick-card" onClick={() => navigate('track-order')}>
            <span className="ct-quick-icon"><Package size={20} /></span>
            <span><strong>Track an order</strong><small>See where it is right now</small></span>
            <ArrowRight size={16} className="ct-quick-arrow" />
          </button>
          <button type="button" className="ct-quick-card" onClick={() => setQuoteModalOpen(true)}>
            <span className="ct-quick-icon"><Search size={20} /></span>
            <span><strong>Request an item</strong><small>Send a link or photo, get a price</small></span>
            <ArrowRight size={16} className="ct-quick-arrow" />
          </button>
          <a className="ct-quick-card is-wa" href={whatsAppLink('Hello CHARI, I have a question.')} target="_blank" rel="noreferrer">
            <span className="ct-quick-icon"><MessageCircle size={20} /></span>
            <span><strong>Chat on WhatsApp</strong><small>Fastest reply</small></span>
            <ArrowRight size={16} className="ct-quick-arrow" />
          </a>
        </div>

        <div className="ct-grid">
          {/* Form */}
          <section className="ct-card ct-form-card" aria-label="Send us a message">
            {submitted ? (
              <div className="ct-done">
                <div className="ct-done-icon"><Check size={28} strokeWidth={3} /></div>
                <h2>Message sent</h2>
                <p>Thanks, {formData.name.trim().split(' ')[0]}. We'll reply on WhatsApp or by phone at <strong>{formData.phone}</strong>, usually the same day.</p>
                <a className="btn btn-whatsapp btn-block" href={formAsWhatsApp()} target="_blank" rel="noreferrer">
                  <MessageCircle size={18} /> Need it sooner? Chat on WhatsApp
                </a>
                <button type="button" className="btn btn-outline btn-block" onClick={() => { setSubmitted(false); update('message', ''); }}>
                  Send another message
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} noValidate>
                <h2>Send us a message</h2>
                {errors.form && <div className="form-error ct-form-error" role="alert"><AlertCircle size={16} /> {errors.form}</div>}

                <div className="ct-row">
                  <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
                    <label className="form-label" htmlFor="ct-name">Your name</label>
                    <input id="ct-name" className="form-input" autoComplete="name" placeholder="Akosua Mensah" value={formData.name} onChange={(e) => update('name', e.target.value)} {...aria('name')} />
                    {err('name')}
                  </div>
                  <div className={`form-field ${errors.phone ? 'has-error' : ''}`}>
                    <label className="form-label" htmlFor="ct-phone">Phone or WhatsApp</label>
                    <input id="ct-phone" className="form-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={formData.phone} onChange={(e) => update('phone', e.target.value)} {...aria('phone')} />
                    {err('phone')}
                  </div>
                </div>

                <div className={`form-field ${errors.email ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="ct-email">Email <span className="form-optional">(optional)</span></label>
                  <input id="ct-email" className="form-input" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={(e) => update('email', e.target.value)} {...aria('email')} />
                  {err('email')}
                </div>

                <div className="form-field">
                  <span className="form-label">What's it about?</span>
                  <div className="ct-chips" role="radiogroup" aria-label="What's it about?">
                    {SUBJECTS.map((s) => (
                      <button key={s} type="button" role="radio" aria-checked={formData.subject === s} className={`ct-chip ${formData.subject === s ? 'is-active' : ''}`} onClick={() => update('subject', s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`form-field ${errors.message ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="ct-message">Your message</label>
                  <textarea id="ct-message" className="form-input" rows={5} maxLength={4000}
                    placeholder={formData.subject === 'Problem with an order' ? 'Your order code (e.g. CHR-SEA-7KQ2MX9P) and what went wrong…' : 'How can we help?'}
                    value={formData.message} onChange={(e) => update('message', e.target.value)} {...aria('message')} />
                  <div className="ct-under">
                    {err('message') || <span />}
                    {formData.message.length > 3500 && <span className="ct-count">{4000 - formData.message.length} left</span>}
                  </div>
                </div>

                <button type="submit" className={`btn btn-primary btn-block ct-submit ${submitting ? 'is-loading' : ''}`}>Send message</button>
                <a className="ct-wa-link" href={formAsWhatsApp()} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> Prefer WhatsApp? Send this as a chat
                </a>
              </form>
            )}
          </section>

          {/* Details */}
          <aside className="ct-side">
            <div className="ct-card ct-details">
              <div className="ct-detail">
                <span className="ct-detail-icon"><Phone size={17} /></span>
                <div>
                  <span className="ct-detail-label">Phone</span>
                  <a href={`tel:+${phoneDigits(settings.whatsappNumber)}`}>{settings.phoneDisplay}</a>
                </div>
                <button type="button" className={`ct-mini-btn ${copied ? 'is-done' : ''}`} onClick={copyPhone} aria-label="Copy phone number">
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              {settings.email && (
                <div className="ct-detail">
                  <span className="ct-detail-icon"><Mail size={17} /></span>
                  <div>
                    <span className="ct-detail-label">Email</span>
                    <a href={`mailto:${settings.email}`}>{settings.email}</a>
                  </div>
                </div>
              )}
              <div className="ct-detail">
                <span className="ct-detail-icon"><MapPin size={17} /></span>
                <div>
                  <span className="ct-detail-label">Pickup point</span>
                  <span className="ct-detail-value">{settings.pickupPoint}</span>
                  <small>{settings.location} · free pickup</small>
                </div>
                <a className="ct-mini-btn" href={mapsLink} target="_blank" rel="noreferrer" aria-label="Get directions"><Navigation size={14} /></a>
              </div>
              <div className="ct-detail">
                <span className="ct-detail-icon"><Clock size={17} /></span>
                <div>
                  <span className="ct-detail-label">Opening hours</span>
                  <span className="ct-detail-value">{settings.openingHours}</span>
                  <small>WhatsApp replies every day</small>
                </div>
              </div>
              <button type="button" className="ct-bulk" onClick={() => { update('subject', 'Bulk / wholesale order'); formRef.current?.querySelector('[name="message"]')?.focus(); }}>
                <Boxes size={16} /> Buying in bulk? Ask about wholesale prices
              </button>
            </div>

            <div className="ct-card ct-faq">
              <h2>Quick answers</h2>
              {FAQS.map(([q, a]) => (
                <details key={q} className="ct-faq-item">
                  <summary>{q}<ChevronDown size={16} aria-hidden="true" /></summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
