import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { submitInquiry, uploadRequestPhoto } from '../services/api';
import { X, MessageCircle, Ship, Plane, AlertCircle, Check, ImagePlus, Trash2, Info } from 'lucide-react';

const CITIES = [
  ['Kumasi', 'Kumasi'],
  ['Accra', 'Accra / Tema'],
  ['Takoradi', 'Takoradi / Sekondi'],
  ['Tamale', 'Tamale'],
  ['Cape Coast', 'Cape Coast'],
  ['Sunyani', 'Sunyani'],
  ['Koforidua', 'Koforidua'],
  ['Other', 'Somewhere else in Ghana'],
];

// Name, phone and town from the account or the last checkout on this phone.
const savedContact = (user) => {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('chari_checkout_details')) || {}; } catch {}
  return {
    name: user?.name || saved.fullName || '',
    phone: user?.phone || saved.phone || '',
    city: CITIES.some(([v]) => v === (user?.city || saved.city)) ? (user?.city || saved.city) : 'Kumasi',
  };
};

const URL_RE = /(https?:\/\/\S+)/i;
const phoneDigits = (v) => String(v || '').replace(/\D/g, '');

export const QuoteModal = () => {
  const { quoteModalOpen, setQuoteModalOpen, WHATSAPP_NUMBER, user, quoteDraft } = useStore();
  const [formData, setFormData] = useState(() => ({
    ...savedContact(user),
    productName: quoteDraft?.productName || '',
    productUrl: '',
    budget: '',
    quantity: '1',
    notes: '',
    shippingPreference: 'sea', // sea or air
  }));
  const [photo, setPhoto] = useState({ preview: '', url: '', uploading: false, error: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    formRef.current?.querySelector('[name="productName"]')?.focus({ preventScroll: true });
  }, []);

  if (!quoteModalOpen) return null;
  const close = () => setQuoteModalOpen(false);

  const update = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Pasting a shop link into "What item" moves it to the link box.
  const updateItem = (value) => {
    const link = value.match(URL_RE)?.[1];
    if (link && !formData.productUrl) {
      update('productUrl', link);
      update('productName', value.replace(link, '').trim());
      return;
    }
    update('productName', value);
  };

  // The photo uploads as soon as it's picked, so sending the request is instant.
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhoto((p) => ({ ...p, error: 'Please choose a photo (JPG, PNG or WEBP).' })); return; }
    if (file.size > 5 * 1024 * 1024) { setPhoto((p) => ({ ...p, error: 'That photo is too big. Please choose one under 5 MB.' })); return; }
    const preview = URL.createObjectURL(file);
    setPhoto({ preview, url: '', uploading: true, error: '' });
    try {
      const url = await uploadRequestPhoto(file);
      setPhoto({ preview, url, uploading: false, error: '' });
    } catch (err) {
      setPhoto({ preview: '', url: '', uploading: false, error: err.message });
    }
  };
  const removePhoto = () => setPhoto({ preview: '', url: '', uploading: false, error: '' });

  const validate = ({ forWhatsApp = false } = {}) => {
    const found = {};
    if (!formData.productName.trim() && !formData.productUrl.trim() && !photo.url) found.productName = 'Tell us what you want — a name, a link or a photo.';
    if (!forWhatsApp) {
      if (!formData.name.trim()) found.name = 'Enter your name.';
      if (phoneDigits(formData.phone).length < 9) found.phone = 'Enter a WhatsApp number we can reply on.';
    }
    if (!(Number(formData.quantity) >= 1)) found.quantity = 'At least 1.';
    return found;
  };
  const showErrors = (found) => {
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) formRef.current?.querySelector(`[name="${first}"]`)?.focus();
    return !first;
  };

  const itemLabel = formData.productName.trim() || (formData.productUrl ? 'Item from link' : 'Item from photo');
  const shippingText = formData.shippingPreference === 'air' ? 'Air (7–12 days)' : 'Sea (30–50 days)';

  // Saved as an Admin message, with the photo link, so no request is lost.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photo.uploading) return;
    if (!showErrors(validate())) return;
    setSending(true);
    const lines = [
      `Item: ${itemLabel}`,
      `Link: ${formData.productUrl || '—'}`,
      `Quantity: ${formData.quantity || '1'}`,
      `Budget: ${formData.budget ? `GH₵${formData.budget}` : 'Flexible'}`,
      `Shipping: ${shippingText}`,
      `Deliver to: ${formData.city || 'Kumasi'}`,
      `Details: ${formData.notes || '—'}`,
    ];
    try {
      await submitInquiry({
        name: formData.name,
        phone: formData.phone,
        subject: `Item request: ${itemLabel}`.slice(0, 80),
        message: lines.join('\n'),
        photoUrl: photo.url || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setErrors({ form: err.message || 'Your request could not be sent. Please try again or use WhatsApp.' });
    } finally {
      setSending(false);
    }
  };

  const photoLink = photo.url ? (photo.url.startsWith('http') ? photo.url : `${window.location.origin}${photo.url}`) : '';
  const whatsAppText = () => encodeURIComponent(
    `Hello CHARI, I'd like to request an item:\n\n`
    + `• *Item:* ${itemLabel}\n`
    + `• *Link:* ${formData.productUrl || '—'}\n`
    + (photoLink ? `• *Photo:* ${photoLink}\n` : '')
    + `• *Quantity:* ${formData.quantity || '1'}\n`
    + `• *Budget:* ${formData.budget ? `GH₵${formData.budget}` : 'Flexible'}\n`
    + `• *Shipping:* ${shippingText}\n`
    + `• *Deliver to:* ${formData.city}\n`
    + `• *Details:* ${formData.notes || '—'}\n\n`
    + `Please send me a price in cedis.`
  );

  const handleSendViaWhatsApp = () => {
    if (!submitted && !showErrors(validate({ forWhatsApp: true }))) return;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsAppText()}`, '_blank');
    close();
  };

  const err = (key) => (errors[key] ? <span className="rq-error" role="alert"><AlertCircle size={13} /> {errors[key]}</span> : null);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="modal-panel rq-panel" role="dialog" aria-modal="true" aria-labelledby="rq-title">
        <div className="modal-header">
          <div>
            <h2 id="rq-title" className="modal-title">{submitted ? 'Request sent' : 'Request an item'}</h2>
            <p className="modal-subtitle">
              {submitted ? "We'll reply on WhatsApp with a price in cedis." : 'Seen it on 1688, Alibaba, Shein, TikTok or Instagram? Send it and we’ll source it.'}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={close} aria-label="Close"><X size={20} /></button>
        </div>

        <div className="modal-body">
          {submitted ? (
            <div className="rq-done">
              <div className="rq-done-icon"><Check size={28} strokeWidth={3} /></div>
              <dl className="rq-summary">
                <div><dt>Item</dt><dd>{itemLabel}</dd></div>
                {photo.preview && <div><dt>Photo</dt><dd><img src={photo.preview} alt="" className="rq-summary-photo" /></dd></div>}
                <div><dt>Quantity</dt><dd>{formData.quantity}</dd></div>
                <div><dt>Shipping</dt><dd>{shippingText}</dd></div>
                <div><dt>Reply to</dt><dd>{formData.phone}</dd></div>
              </dl>
              <p className="rq-muted">We'll check with the supplier and send a full price including shipping and customs — usually within a day.</p>
              <button type="button" className="btn btn-whatsapp btn-block" onClick={handleSendViaWhatsApp}>
                <MessageCircle size={18} /> Chat about it on WhatsApp
              </button>
              <button type="button" className="btn btn-outline btn-block" onClick={close}>Done</button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="rq-form">
              {errors.form && <div className="form-error rq-form-error" role="alert"><AlertCircle size={16} /> {errors.form}</div>}

              <div className={`form-field ${errors.productName ? 'has-error' : ''}`}>
                <label className="form-label" htmlFor="rq-item">What do you want?</label>
                <input id="rq-item" name="productName" className="form-input" placeholder="Dough mixer, velvet mannequin, ladies co-ord… or paste a link"
                  value={formData.productName} onChange={(e) => updateItem(e.target.value)} maxLength={140} />
                {err('productName')}
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="rq-link">Link <span className="form-optional">(optional)</span></label>
                <input id="rq-link" name="productUrl" className="form-input" type="url" inputMode="url" placeholder="https://…" value={formData.productUrl} onChange={(e) => update('productUrl', e.target.value)} />
              </div>

              <div className="form-field">
                <span className="form-label">Photo or screenshot <span className="form-optional">(optional)</span></span>
                {photo.preview ? (
                  <div className="rq-photo">
                    <img src={photo.preview} alt="Your photo" />
                    <div className="rq-photo-text">
                      <strong>{photo.uploading ? 'Uploading…' : <><Check size={14} /> Photo attached</>}</strong>
                      <span>{photo.uploading ? 'You can keep filling in the form.' : 'We’ll see it with your request.'}</span>
                    </div>
                    <button type="button" className="rq-photo-remove" onClick={removePhoto} aria-label="Remove photo" disabled={photo.uploading}><Trash2 size={16} /></button>
                  </div>
                ) : (
                  <label className="rq-drop">
                    <input type="file" accept="image/*" onChange={handlePhoto} />
                    <ImagePlus size={22} aria-hidden="true" />
                    <span><strong>Add a photo</strong> from your gallery</span>
                    <small>JPG, PNG or WEBP, up to 5 MB</small>
                  </label>
                )}
                {photo.error && <span className="rq-error" role="alert"><AlertCircle size={13} /> {photo.error}</span>}
              </div>

              <div className="rq-row">
                <div className={`form-field ${errors.quantity ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="rq-qty">Quantity</label>
                  <input id="rq-qty" name="quantity" className="form-input" type="number" inputMode="numeric" min="1" value={formData.quantity} onChange={(e) => update('quantity', e.target.value)} />
                  {err('quantity')}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="rq-budget">Budget <span className="form-optional">(GH₵, optional)</span></label>
                  <input id="rq-budget" className="form-input" type="number" inputMode="decimal" min="0" placeholder="350" value={formData.budget} onChange={(e) => update('budget', e.target.value)} />
                </div>
              </div>

              <fieldset className="rq-ship">
                <legend className="form-label">Shipping</legend>
                {[
                  ['sea', Ship, 'Sea', '30–50 days · cheaper'],
                  ['air', Plane, 'Air', '7–12 days · faster'],
                ].map(([id, Icon, title, sub]) => (
                  <label key={id} className={`rq-ship-option ${formData.shippingPreference === id ? 'is-selected' : ''}`}>
                    <input type="radio" name="shippingPreference" checked={formData.shippingPreference === id} onChange={() => update('shippingPreference', id)} />
                    <Icon size={18} aria-hidden="true" />
                    <span><strong>{title}</strong><small>{sub}</small></span>
                  </label>
                ))}
              </fieldset>

              <div className="form-field">
                <label className="form-label" htmlFor="rq-notes">Colours, sizes or other details <span className="form-optional">(optional)</span></label>
                <textarea id="rq-notes" className="form-input" rows={2} placeholder="Black, size 42, with original box…" value={formData.notes} onChange={(e) => update('notes', e.target.value)} />
              </div>

              <div className="rq-section-label">Where we reply</div>
              <div className="rq-row">
                <div className={`form-field ${errors.name ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="rq-name">Your name</label>
                  <input id="rq-name" name="name" className="form-input" autoComplete="name" placeholder="Ama Serwaa" value={formData.name} onChange={(e) => update('name', e.target.value)} />
                  {err('name')}
                </div>
                <div className={`form-field ${errors.phone ? 'has-error' : ''}`}>
                  <label className="form-label" htmlFor="rq-phone">WhatsApp number</label>
                  <input id="rq-phone" name="phone" className="form-input" type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={formData.phone} onChange={(e) => update('phone', e.target.value)} />
                  {err('phone')}
                </div>
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="rq-city">Deliver to</label>
                <select id="rq-city" className="form-input" value={formData.city} onChange={(e) => update('city', e.target.value)}>
                  {CITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <p className="rq-note"><Info size={15} aria-hidden="true" /> Pre-orders are paid in full before we buy from the supplier. Shipping is charged by weight when your item reaches Ghana.</p>

              <button type="submit" className={`btn btn-primary btn-block rq-submit ${sending ? 'is-loading' : ''}`} disabled={photo.uploading}>
                {photo.uploading ? 'Waiting for photo…' : 'Send request'}
              </button>
              <button type="button" className="rq-wa" onClick={handleSendViaWhatsApp}>
                <MessageCircle size={16} /> Prefer WhatsApp? Send it as a chat
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
