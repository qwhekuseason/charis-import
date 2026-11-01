import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import * as admin from '../services/adminApi';
import { sizedImage } from '../utils/images';
import { X, Plus, Trash2, RefreshCw, Search, Upload, MessageCircle, ArrowLeft, ArrowRight, Phone, Check, AlertTriangle, Copy } from 'lucide-react';
import { SmartImage } from '../components/SmartImage';

// ---------------------------------------------------------------------------
// Labels shown to the admin (database values → plain words)
// ---------------------------------------------------------------------------
const ORDER_STATUSES = [
  ['PROCESSING', 'New'],
  ['CONFIRMED', 'Confirmed'],
  ['SHIPPED', 'Shipped'],
  ['DELIVERED', 'Delivered'],
  ['CANCELLED', 'Cancelled'],
];
const PAYMENT_STATUSES = [
  ['PENDING', 'Not paid'],
  ['VERIFYING', 'Checking payment'],
  ['PAID', 'Paid'],
  ['REFUNDED', 'Refunded'],
];
const BATCH_STAGES = [
  ['CONFIRMED', 'Taking orders'],
  ['QC_BATCHING', 'Checking & packing'],
  ['HIGH_SEAS', 'On the way to Ghana'],
  ['CUSTOMS_CLEARANCE', 'Clearing customs'],
  ['ACCRA_HUB', 'Arrived in Kumasi'],
  ['DELIVERY_READY', 'Out for delivery'],
];
const MESSAGE_STATUSES = [
  ['NEW', 'New'],
  ['REPLIED', 'Replied'],
  ['CLOSED', 'Closed'],
];
const label = (pairs, value) => (pairs.find(([v]) => v === value) || [value, value || '—'])[1];

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
const date = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const waLink = (phone, text) => {
  let digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `233${digits.slice(1)}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
const Modal = ({ title, onClose, children, footer }) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  // Escape closes, and the page behind stays still while the popup is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeRef.current(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel adm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="adm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

const Field = ({ label: text, hint, children }) => (
  <label className="form-field adm-field">
    <span className="form-label">{text}</span>
    {children}
    {hint && <span className="form-hint">{hint}</span>}
  </label>
);

const Empty = ({ children }) => <div className="adm-empty">{children}</div>;

// Photo picker used for products and categories: upload files or paste links, reorder, remove.
const PhotoManager = ({ photos, onChange, max = 8, single = false, onBusyChange }) => {
  const { showToast } = useStore();
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');

  const addFiles = async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(true);
    onBusyChange?.(true);
    try {
      const urls = [];
      for (const file of list.slice(0, single ? 1 : max - photos.length)) {
        if (file.size > 15 * 1024 * 1024) { showToast(`${file.name} is over 15 MB`, 'error'); continue; }
        urls.push(await admin.uploadPhoto(file));
      }
      onChange(single ? urls.slice(0, 1) : [...photos, ...urls].slice(0, max));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\//.test(url)) { showToast('Paste a full link starting with https://', 'error'); return; }
    onChange(single ? [url] : [...photos, url].slice(0, max));
    setLink('');
  };

  const move = (i, dir) => {
    const next = [...photos];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    onChange(next);
  };

  return (
    <div className="adm-photos">
      <div className="adm-photo-grid">
        {photos.map((url, i) => (
          <div key={url + i} className="adm-photo">
            <SmartImage src={sizedImage(url, 200)} alt="" fallbackLabel="Can't load photo" />
            {i === 0 && !single && <span className="adm-photo-main">Main photo</span>}
            <div className="adm-photo-actions">
              {!single && i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label="Move left"><ArrowLeft size={14} /></button>}
              {!single && i < photos.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label="Move right"><ArrowRight size={14} /></button>}
              <button type="button" onClick={() => onChange(photos.filter((_, j) => j !== i))} aria-label="Remove photo"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {(single ? photos.length === 0 : photos.length < max) && (
          <label className={`adm-photo-add ${uploading ? 'is-busy' : ''}`}>
            <input type="file" accept="image/*" multiple={!single} hidden disabled={uploading} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            <Upload size={18} />
            <span>{uploading ? 'Uploading…' : single ? 'Upload photo' : 'Upload photos'}</span>
          </label>
        )}
      </div>
      <div className="adm-inline">
        <input className="form-input" placeholder="…or paste a photo link" value={link} onChange={(e) => setLink(e.target.value)} />
        <button type="button" className="btn btn-outline" onClick={addLink} disabled={!link.trim()}>Add link</button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
// Quick views of the order list, in the order the team works through them.
const ORDER_VIEWS = [
  ['all', 'All', () => true],
  ['check', 'Check payment', (o) => o.orderStatus !== 'CANCELLED' && o.paymentStatus === 'VERIFYING'],
  ['unpaid', 'Not paid', (o) => o.orderStatus !== 'CANCELLED' && (o.paymentStatus || 'PENDING') === 'PENDING'],
  ['toShip', 'To ship', (o) => o.paymentStatus === 'PAID' && ['PROCESSING', 'CONFIRMED'].includes(o.orderStatus)],
  ['shipped', 'On the way', (o) => o.orderStatus === 'SHIPPED'],
  ['done', 'Delivered', (o) => o.orderStatus === 'DELIVERED'],
  ['cancelled', 'Cancelled', (o) => o.orderStatus === 'CANCELLED'],
];

// The one most likely next action for an order, so the common path is a single tap.
const nextStep = (o) => {
  if (o.orderStatus === 'CANCELLED' || o.orderStatus === 'DELIVERED') return null;
  if (o.paymentStatus === 'VERIFYING') return { label: 'Mark as paid', changes: { paymentStatus: 'PAID' } };
  if (o.paymentStatus !== 'PAID') return null;
  if (o.orderStatus === 'PROCESSING') return { label: 'Confirm order', changes: { orderStatus: 'CONFIRMED' } };
  if (o.orderStatus === 'CONFIRMED') return { label: 'Mark shipped', changes: { orderStatus: 'SHIPPED' } };
  if (o.orderStatus === 'SHIPPED') return { label: 'Mark delivered', changes: { orderStatus: 'DELIVERED' } };
  return null;
};

const OrdersTab = ({ orders, setOrders, view, setView, searchRequest }) => {
  const { showToast } = useStore();
  const [query, setQuery] = useState(searchRequest?.text || '');
  useEffect(() => { if (searchRequest) setQuery(searchRequest.text); }, [searchRequest]);
  const [saving, setSaving] = useState(null);

  const viewTest = (ORDER_VIEWS.find(([id]) => id === view) || ORDER_VIEWS[0])[2];
  const shown = orders.filter((o) => {
    if (!viewTest(o)) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [o.orderCode, o.customerName, o.phone, o.city, o.email].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const update = async (order, changes) => {
    // These can't be quietly undone: the customer is emailed and any store credit is returned.
    if (changes.orderStatus === 'CANCELLED' && !window.confirm(`Cancel order ${order.orderCode}? The customer will be told and any store credit they used is returned.`)) return;
    if (changes.paymentStatus === 'REFUNDED' && !window.confirm(`Mark order ${order.orderCode} as refunded?`)) return;
    setSaving(order.id);
    try {
      const { data: updated, emailed } = await admin.setOrderStatus(order.id, changes);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      showToast(`${order.orderCode} updated${emailed ? ' — customer emailed' : ''}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <div className="adm-views" role="tablist" aria-label="Order views">
        {ORDER_VIEWS.map(([id, text, test]) => {
          const count = orders.filter(test).length;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              className={`adm-view ${view === id ? 'is-active' : ''} ${count && ['check', 'toShip'].includes(id) ? 'is-urgent' : ''}`}
              onClick={() => setView(id)}
            >
              {text} <span>{count}</span>
            </button>
          );
        })}
      </div>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search code, name, phone or city" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>

      {shown.length === 0 ? <Empty>{query ? 'No orders match your search.' : 'Nothing here right now.'}</Empty> : (
        <div className="adm-list">
          {shown.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            const step = nextStep(o);
            return (
              <article key={o.id} className={`adm-card ${saving === o.id ? 'is-saving' : ''}`} aria-busy={saving === o.id}>
                <header className="adm-card-head">
                  <div>
                    <strong className="adm-code">{o.orderCode}</strong>
                    <span className="adm-muted"> · {date(o.createdAt)}</span>
                  </div>
                  <strong className="adm-total">{money(o.total)}</strong>
                </header>
                <div className="adm-pills">
                  <span className={`adm-pill is-${o.orderStatus === 'CANCELLED' ? 'danger' : o.orderStatus === 'DELIVERED' ? 'success' : 'info'}`}>{label(ORDER_STATUSES, o.orderStatus)}</span>
                  <span className={`adm-pill is-${o.paymentStatus === 'PAID' ? 'success' : o.paymentStatus === 'REFUNDED' ? 'muted' : 'warning'}`}>{label(PAYMENT_STATUSES, o.paymentStatus || 'PENDING')}</span>
                </div>

                <div className="adm-order-grid">
                  <div>
                    <div className="adm-label">Customer</div>
                    <div>{o.customerName}</div>
                    <a className="adm-phone" href={`tel:${String(o.phone || '').replace(/\s/g, '')}`}><Phone size={13} /> {o.phone}</a>
                    {o.email && <div className="adm-muted">{o.email}</div>}
                    <div className="adm-muted">{[o.address, o.city].filter(Boolean).join(', ')}</div>
                  </div>
                  <div>
                    <div className="adm-label">Items</div>
                    <ul className="adm-items adm-items-thumbs">
                      {items.map((it, i) => (
                        <li key={i}>
                          <SmartImage src={sizedImage(it.image || '', 96)} alt="" className="adm-item-thumb" />
                          <span>{it.qty} × {it.name} <span className="adm-muted">@ {money(it.price)}</span></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="adm-label">Money</div>
                    <div className="adm-muted">Items {money(o.subtotal)} · Delivery {money(o.deliveryFee)}</div>
                    {o.discountAmount > 0 && <div className="adm-muted">Discount −{money(o.discountAmount)}{o.couponCode ? ` (${o.couponCode})` : ''}</div>}
                    {o.creditUsed > 0 && <div className="adm-muted">Store credit −{money(o.creditUsed)}</div>}
                    <div className="adm-muted">{o.deliveryMethod} · {o.paymentMethod}</div>
                  </div>
                </div>
                {o.notes && <p className="adm-note">Note: {o.notes}</p>}

                <footer className="adm-card-actions">
                  {step && (
                    <button type="button" className="btn btn-primary adm-next" disabled={saving === o.id} onClick={() => update(o, step.changes)}>
                      <Check size={16} /> {step.label}
                    </button>
                  )}
                  <label className="adm-mini-field">
                    <span>Order status</span>
                    <select className="form-input" value={o.orderStatus} disabled={saving === o.id} onChange={(e) => update(o, { orderStatus: e.target.value })}>
                      {ORDER_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="adm-mini-field">
                    <span>Payment</span>
                    <select className="form-input" value={o.paymentStatus || 'PENDING'} disabled={saving === o.id} onChange={(e) => update(o, { paymentStatus: e.target.value })}>
                      {PAYMENT_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <a
                    className="btn btn-whatsapp"
                    target="_blank"
                    rel="noreferrer"
                    href={waLink(o.phone, `Hello ${o.customerName}, this is CHARI about your order ${o.orderCode} (${money(o.total)}). Status: ${label(ORDER_STATUSES, o.orderStatus)}.`)}
                  >
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      <p className="adm-help">Setting payment to <strong>Paid</strong> also gives the customer who invited this buyer their GH₵25 reward (first order only). Cancelling an order returns any store credit it used.</p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const emptyProduct = (category) => ({ name: '', category, price: '', originalPrice: '', inStock: true, isNew: false, photos: [], description: '', specs: [] });

// Turns a product from the server into the editor's form fields.
const productToForm = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: String(p.listPrice ?? p.price),
  originalPrice: (p.listWasPrice ?? p.originalPrice) ? String(p.listWasPrice ?? p.originalPrice) : '',
  inStock: p.inStock !== false,
  isNew: p.badge === 'New',
  photos: (p.gallery && p.gallery.length ? p.gallery : p.images?.length ? p.images : [p.image]).filter(Boolean),
  description: p.description || '',
  specs: (p.specifications || p.specs || []).map((s) => ({ label: s.label || '', value: s.value || '' })),
});

// What's wrong with the form, field by field (the server checks the same things).
const productProblems = (f) => {
  const found = {};
  if (!f.name.trim()) found.name = 'Give the product a name.';
  const price = Number(f.price);
  if (!f.price || !Number.isFinite(price) || price <= 0) found.price = 'Enter a price above 0.';
  if (f.originalPrice !== '') {
    const was = Number(f.originalPrice);
    if (!Number.isFinite(was) || was <= 0) found.originalPrice = 'Enter a number, or leave it empty.';
    else if (!found.price && was <= price) found.originalPrice = 'Must be higher than the price, or empty.';
  }
  if (f.photos.length === 0) found.photos = 'Add at least one photo.';
  if (!f.category) found.category = 'Choose a category.';
  return found;
};

const STOCK_FILTERS = [['all', 'All'], ['in', 'In stock'], ['out', 'Out of stock'], ['new', 'New'], ['deal', 'On deal']];

const ProductsTab = ({ products, setProducts, categories, onCatalogChange }) => {
  const { showToast } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [stock, setStock] = useState('all');
  const [editing, setEditing] = useState(null); // form state, id = null for a new product
  const [original, setOriginal] = useState(null); // snapshot, to warn before throwing changes away
  const [problems, setProblems] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState({});

  const stockTest = {
    all: () => true,
    in: (p) => p.inStock !== false,
    out: (p) => p.inStock === false,
    new: (p) => p.badge === 'New',
    deal: (p) => p.onDeal,
  }[stock];
  const shown = products.filter((p) => (category === 'all' || p.category === category)
    && stockTest(p)
    && `${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()));

  const open = (form) => { setEditing(form); setOriginal(JSON.stringify(form)); setProblems({}); };
  const openNew = () => open({ id: null, ...emptyProduct(category !== 'all' ? category : categories[0]?.name || '') });
  const openEdit = (p) => open(productToForm(p));
  // A copy to start from — handy for the same item in another colour or size.
  const openDuplicate = (p) => open({ ...productToForm(p), id: null, name: `${p.name} (copy)` });

  const isDirty = editing && JSON.stringify(editing) !== original;
  const closeEditor = () => {
    if (saving) return;
    if (isDirty && !window.confirm('Close without saving? Your changes will be lost.')) return;
    setEditing(null);
  };
  const setField = (key, value) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
    if (problems[key]) setProblems((prev) => ({ ...prev, [key]: undefined }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (uploading) { showToast('Wait for the photos to finish uploading.', 'warning'); return; }
    const found = productProblems(editing);
    setProblems(found);
    if (Object.keys(found).length) {
      document.querySelector(`[data-field="${Object.keys(found)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    const specs = editing.specs.map((s) => ({ label: s.label.trim(), value: s.value.trim() })).filter((s) => s.label && s.value);
    const payload = {
      name: editing.name,
      category: editing.category,
      price: editing.price,
      originalPrice: editing.originalPrice === '' ? null : editing.originalPrice,
      inStock: editing.inStock,
      badge: editing.isNew ? 'New' : null,
      image: editing.photos[0] || '',
      gallery: editing.photos,
      description: editing.description,
      specs,
    };
    try {
      if (editing.id) {
        const updated = await admin.editProduct(editing.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        showToast(`"${updated.name}" saved`, 'success');
      } else {
        const created = await admin.addProduct(payload);
        setProducts((prev) => [created, ...prev]);
        showToast(`"${created.name}" added to the shop`, 'success');
      }
      setEditing(null);
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (p, changes, message) => {
    try {
      const updated = await admin.editProduct(p.id, changes);
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
      showToast(message, 'success');
      onCatalogChange();
      return true;
    } catch (err) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const clearDraft = (id) => setPriceDrafts((prev) => { const next = { ...prev }; delete next[id]; return next; });
  const savePrice = async (p) => {
    const draft = priceDrafts[p.id];
    if (draft === undefined || Number(draft) === (p.listPrice ?? p.price)) return;
    if (await quickUpdate(p, { price: draft }, `${p.name}: price now GH₵${Number(draft).toFixed(2)}`)) clearDraft(p.id);
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" from the shop? This can't be undone.`)) return;
    try {
      await admin.removeProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      showToast(`"${p.name}" deleted`, 'info');
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Live preview numbers for the editor.
  const previewPrice = Number(editing?.price) || 0;
  const previewWas = Number(editing?.originalPrice) || 0;
  const previewOff = previewWas > previewPrice && previewPrice > 0 ? Math.round(((previewWas - previewPrice) / previewWas) * 100) : 0;
  const problem = (key) => (problems[key] ? <span className="adm-field-error" role="alert"><AlertTriangle size={13} /> {problems[key]}</span> : null);

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select className="form-input adm-select" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <button type="button" className="btn btn-primary" onClick={openNew}><Plus size={16} /> Add product</button>
      </div>
      <div className="adm-views" role="tablist" aria-label="Product filters">
        {STOCK_FILTERS.map(([id, text]) => {
          const count = products.filter({ all: () => true, in: (p) => p.inStock !== false, out: (p) => p.inStock === false, new: (p) => p.badge === 'New', deal: (p) => p.onDeal }[id]).length;
          return (
            <button key={id} type="button" role="tab" aria-selected={stock === id} className={`adm-view ${stock === id ? 'is-active' : ''}`} onClick={() => setStock(id)}>
              {text} <span>{count}</span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <Empty>
          {products.length === 0 ? 'No products yet.' : 'No products match.'}{' '}
          <button type="button" className="shop-link-btn" onClick={openNew}>Add a product</button>
        </Empty>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-products-table">
            <thead>
              <tr><th>Product</th><th>Price (GH₵)</th><th>Was</th><th>In stock</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const draftChanged = priceDrafts[p.id] !== undefined && Number(priceDrafts[p.id]) !== (p.listPrice ?? p.price);
                return (
                  <tr key={p.id} className={p.inStock === false ? 'is-out' : ''}>
                    <td className="adm-cell-product">
                      <button type="button" className="adm-product-cell" onClick={() => openEdit(p)} title="Edit product">
                        <SmartImage src={sizedImage(p.image || p.images?.[0] || '', 96)} alt="" className="adm-product-thumb" />
                        <span>
                          <span className="adm-strong">{p.name}</span>
                          <span className="adm-muted adm-product-meta">
                            {p.category}
                            {p.badge === 'New' && <span className="adm-pill is-info">New</span>}
                            {p.onDeal && <span className="adm-pill is-warning">Deal {money(p.price)}</span>}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="adm-cell-price" data-label="Price">
                      <div className="adm-price-cell">
                        <input
                          className="form-input adm-price"
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          step="0.01"
                          aria-label={`Price of ${p.name}`}
                          value={priceDrafts[p.id] ?? (p.listPrice ?? p.price)}
                          onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') savePrice(p); if (e.key === 'Escape') clearDraft(p.id); }}
                        />
                        {draftChanged && (
                          <>
                            <button type="button" className="btn btn-primary btn-sm" onClick={() => savePrice(p)}>Save</button>
                            <button type="button" className="btn btn-outline btn-sm" aria-label="Undo price change" onClick={() => clearDraft(p.id)}><X size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="adm-muted adm-cell-was" data-label="Was">{(p.listWasPrice ?? p.originalPrice) ? money(p.listWasPrice ?? p.originalPrice) : '—'}</td>
                    <td className="adm-cell-stock" data-label="In stock">
                      <label className="adm-switch">
                        <input
                          type="checkbox"
                          checked={p.inStock !== false}
                          onChange={(e) => quickUpdate(p, { inStock: e.target.checked }, `${p.name}: ${e.target.checked ? 'in stock' : 'out of stock'}`)}
                        />
                        <span>{p.inStock !== false ? 'Yes' : 'No'}</span>
                      </label>
                    </td>
                    <td className="adm-row-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openDuplicate(p)} aria-label={`Duplicate ${p.name}`} title="Duplicate"><Copy size={14} /></button>
                      <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`} title="Delete"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="adm-help">Change a price in the list, then press Save (or Enter). Out-of-stock products stay visible but can't be ordered. Use <Copy size={12} /> to start a new product from an existing one.</p>

      {editing && (
        <Modal
          title={editing.id ? 'Edit product' : 'Add product'}
          onClose={closeEditor}
          footer={(
            <>
              <span className="adm-footer-note">{uploading ? 'Uploading photos…' : isDirty ? 'Unsaved changes' : ''}</span>
              <button type="button" className="btn btn-outline" onClick={closeEditor} disabled={saving}>Cancel</button>
              <button type="submit" form="product-form" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={uploading}>
                {editing.id ? 'Save changes' : 'Add to shop'}
              </button>
            </>
          )}
        >
          <form id="product-form" onSubmit={save} noValidate>
            {/* How it will look in the shop */}
            <div className="adm-preview" aria-label="Preview">
              <SmartImage src={sizedImage(editing.photos[0] || '', 160)} alt="" className="adm-preview-img" fallbackLabel="No photo yet" />
              <div className="adm-preview-body">
                <span className="adm-preview-name">{editing.name || 'Product name'}</span>
                <span className="adm-preview-price">
                  <strong>{previewPrice ? money(previewPrice) : 'GH₵—'}</strong>
                  {previewOff > 0 && <><s>{money(previewWas)}</s><em>−{previewOff}%</em></>}
                </span>
                <span className="adm-preview-tags">
                  {editing.isNew && <span className="adm-pill is-info">New</span>}
                  {!editing.inStock && <span className="adm-pill is-muted">Out of stock</span>}
                  {editing.category && <span className="adm-muted">{editing.category}</span>}
                </span>
              </div>
            </div>

            <div data-field="name">
              <Field label="Name">
                <input className="form-input" maxLength={120} placeholder="Smart Air Fryer 7.5L" value={editing.name} onChange={(e) => setField('name', e.target.value)} aria-invalid={Boolean(problems.name)} />
              </Field>
              {problem('name')}
            </div>
            <div data-field="category">
              <Field label="Category">
                <select className="form-input" value={editing.category} onChange={(e) => setField('category', e.target.value)}>
                  {!editing.category && <option value="">Choose…</option>}
                  {!categories.some((c) => c.name === editing.category) && editing.category && <option value={editing.category}>{editing.category}</option>}
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              {problem('category')}
            </div>
            <div className="form-row">
              <div data-field="price">
                <Field label="Price (GH₵)">
                  <input className="form-input" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="450" value={editing.price} onChange={(e) => setField('price', e.target.value)} aria-invalid={Boolean(problems.price)} />
                </Field>
                {problem('price')}
              </div>
              <div data-field="originalPrice">
                <Field label="Was price (GH₵)" hint={problems.originalPrice ? null : 'Optional — shows a discount.'}>
                  <input className="form-input" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="600" value={editing.originalPrice} onChange={(e) => setField('originalPrice', e.target.value)} aria-invalid={Boolean(problems.originalPrice)} />
                </Field>
                {problem('originalPrice')}
              </div>
            </div>
            <div className="adm-checks">
              <label className="shop-check"><input type="checkbox" checked={editing.inStock} onChange={(e) => setField('inStock', e.target.checked)} /> In stock</label>
              <label className="shop-check"><input type="checkbox" checked={editing.isNew} onChange={(e) => setField('isNew', e.target.checked)} /> Show "New" label</label>
            </div>
            <div data-field="photos">
              <Field label="Photos" hint="The first photo is the main one. Up to 8.">
                <PhotoManager photos={editing.photos} onChange={(photos) => setField('photos', photos)} onBusyChange={setUploading} />
              </Field>
              {problem('photos')}
            </div>
            <Field label="Description">
              <textarea className="form-input" rows={4} placeholder="What it is, what it's made of, what's in the box…" value={editing.description} onChange={(e) => setField('description', e.target.value)} />
            </Field>

            <div className="adm-specs">
              <span className="form-label">Details shoppers see <span className="form-optional">(optional)</span></span>
              {editing.specs.map((s, i) => (
                <div key={i} className="adm-spec-row">
                  <input className="form-input" placeholder="e.g. Size" aria-label={`Detail ${i + 1} name`} value={s.label}
                    onChange={(e) => setField('specs', editing.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="form-input" placeholder="e.g. 7.5 litres" aria-label={`Detail ${i + 1} value`} value={s.value}
                    onChange={(e) => setField('specs', editing.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" className="btn btn-outline btn-sm adm-danger" aria-label={`Remove detail ${i + 1}`}
                    onClick={() => setField('specs', editing.specs.filter((_, j) => j !== i))}><X size={14} /></button>
                </div>
              ))}
              {editing.specs.length < 12 && (
                <button type="button" className="adm-add-spec" onClick={() => setField('specs', [...editing.specs, { label: '', value: '' }])}>
                  <Plus size={14} /> Add a detail (size, colour, material…)
                </button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
// Editor state for an admin popup form, with a warning before unsaved changes are thrown away.
const useEditor = () => {
  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState('');
  const [errors, setErrors] = useState({});
  const open = (value) => { setForm(value); setOriginal(JSON.stringify(value)); setErrors({}); };
  const dirty = form !== null && JSON.stringify(form) !== original;
  const close = (force = false) => {
    if (!force && dirty && !window.confirm('Close without saving? Your changes will be lost.')) return;
    setForm(null);
  };
  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };
  return { form, setForm, open, close, dirty, set, errors, setErrors };
};

const FieldError = ({ message }) => (message ? <span className="adm-field-error" role="alert"><AlertTriangle size={13} /> {message}</span> : null);
const DirtyNote = ({ dirty, busy }) => <span className="adm-footer-note">{busy || (dirty ? 'Unsaved changes' : '')}</span>;

const CategoriesTab = ({ categories, products, onCatalogChange }) => {
  const { showToast } = useStore();
  const ed = useEditor();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const countFor = (name) => products.filter((p) => p.category === name).length;

  const save = async (e) => {
    e.preventDefault();
    if (uploading) return;
    const name = ed.form.name.trim();
    if (!name) { ed.setErrors({ name: 'Give the category a name.' }); return; }
    if (categories.some((c) => c.id !== ed.form.id && c.name.toLowerCase() === name.toLowerCase())) {
      ed.setErrors({ name: `There's already a category called "${name}".` });
      return;
    }
    setSaving(true);
    try {
      const body = { name, image: ed.form.photos[0] || '' };
      if (ed.form.id) await admin.editCategory(ed.form.id, body);
      else await admin.addCategory(body);
      showToast(`Category "${name}" saved`, 'success');
      ed.close(true);
      onCatalogChange();
    } catch (err) {
      ed.setErrors({ name: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the "${c.name}" category?`)) return;
    try {
      await admin.removeCategory(c.id);
      showToast(`"${c.name}" deleted`, 'info');
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const renaming = ed.form?.id && ed.form.name.trim() && ed.form.name.trim() !== ed.form.originalName;
  const movingCount = ed.form?.id ? countFor(ed.form.originalName) : 0;

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{categories.length} categories</span>
        <button type="button" className="btn btn-primary" onClick={() => ed.open({ name: '', photos: [] })}><Plus size={16} /> Add category</button>
      </div>
      {categories.length === 0 ? <Empty>No categories yet. Add one so products can be grouped in the shop.</Empty> : (
        <div className="adm-cat-grid">
          {categories.map((c) => {
            const count = countFor(c.name);
            const openEdit = () => ed.open({ id: c.id, name: c.name, originalName: c.name, photos: c.image ? [c.image] : [] });
            return (
              <div key={c.id} className="adm-card adm-cat">
                <button type="button" className="adm-cat-photo" onClick={openEdit} aria-label={`Edit ${c.name}`}>
                  <SmartImage src={c.image ? sizedImage(c.image, 240) : ''} alt="" fallbackLabel="No photo" />
                </button>
                <div className="adm-strong">{c.name}</div>
                <div className="adm-muted">{count} product{count === 1 ? '' : 's'}</div>
                <div className="adm-row-actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={openEdit}>Edit</button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm adm-danger"
                    onClick={() => remove(c)}
                    disabled={count > 0}
                    aria-label={`Delete ${c.name}`}
                    title={count > 0 ? `Move or delete its ${count} product${count === 1 ? '' : 's'} first` : 'Delete category'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                {count > 0 && <span className="adm-cat-note">Can be deleted once it's empty</span>}
              </div>
            );
          })}
        </div>
      )}
      <p className="adm-help">Renaming a category moves its products along with it. A category can only be deleted when no products use it.</p>

      {ed.form && (
        <Modal
          title={ed.form.id ? 'Edit category' : 'Add category'}
          onClose={() => !saving && ed.close()}
          footer={(
            <>
              <DirtyNote dirty={ed.dirty} busy={uploading && 'Uploading photo…'} />
              <button type="button" className="btn btn-outline" onClick={() => ed.close()} disabled={saving}>Cancel</button>
              <button type="submit" form="category-form" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={uploading}>Save category</button>
            </>
          )}
        >
          <form id="category-form" onSubmit={save} noValidate>
            <Field label="Name"><input className="form-input" maxLength={60} placeholder="Kitchen Appliances" value={ed.form.name} onChange={(e) => ed.set('name', e.target.value)} aria-invalid={Boolean(ed.errors.name)} /></Field>
            <FieldError message={ed.errors.name} />
            {renaming && movingCount > 0 && (
              <p className="adm-note">The {movingCount} product{movingCount === 1 ? '' : 's'} in "{ed.form.originalName}" will move to "{ed.form.name.trim()}".</p>
            )}
            <Field label="Photo" hint="Shown on the home page and Categories page.">
              <PhotoManager single photos={ed.form.photos} onChange={(photos) => ed.set('photos', photos)} onBusyChange={setUploading} />
            </Field>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
const promoStatus = (d) => {
  if (!d.isActive) return ['Off', 'muted'];
  if (d.expiresAt && new Date(d.expiresAt) < new Date()) return ['Expired', 'danger'];
  if (d.usageLimit && (d.usedCount || 0) >= d.usageLimit) return ['Used up', 'warning'];
  return ['Active', 'success'];
};

// "15% off orders of GH₵100 or more, up to GH₵50, until 31 Dec 2026, for the first 100 uses."
const promoSummary = (f) => {
  const value = Number(f.value);
  if (!(value > 0)) return '';
  const parts = [f.type === 'PERCENTAGE' ? `${value}% off` : `${money(value)} off`];
  parts[0] += Number(f.minOrderAmount) > 0 ? ` orders of ${money(f.minOrderAmount)} or more` : ' any order';
  if (f.type === 'PERCENTAGE' && Number(f.maxDiscount) > 0) parts.push(`up to ${money(f.maxDiscount)}`);
  if (f.expiresAt) parts.push(`until the end of ${date(f.expiresAt)}`);
  if (Number(f.usageLimit) > 0) parts.push(`for the first ${parseInt(f.usageLimit, 10)} use${Number(f.usageLimit) === 1 ? '' : 's'}`);
  return `Customers get ${parts.join(', ')}.`;
};

const randomCode = () => `CHARI${Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 31]).join('')}`;

const PromoTab = ({ discounts, setDiscounts }) => {
  const { showToast } = useStore();
  const blank = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' };
  const ed = useEditor();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');

  const openEdit = (d) => ed.open({
    id: d.id,
    code: d.code,
    description: d.description || '',
    type: d.type,
    value: String(d.value),
    minOrderAmount: d.minOrderAmount ? String(d.minOrderAmount) : '',
    maxDiscount: d.maxDiscount ? String(d.maxDiscount) : '',
    usageLimit: d.usageLimit ? String(d.usageLimit) : '',
    expiresAt: d.expiresAt ? toDateInput(new Date(d.expiresAt)) : '',
    usedCount: d.usedCount || 0,
  });

  const validate = (f) => {
    const found = {};
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,20}$/.test(code)) found.code = 'Use 3–20 letters or numbers, no spaces.';
    else if (discounts.some((d) => d.id !== f.id && d.code === code)) found.code = `${code} already exists.`;
    const value = Number(f.value);
    if (!(value > 0)) found.value = 'Enter an amount above 0.';
    else if (f.type === 'PERCENTAGE' && value > 100) found.value = 'A percentage can’t be more than 100.';
    if (f.minOrderAmount !== '' && !(Number(f.minOrderAmount) >= 0)) found.minOrderAmount = 'Enter a number, or leave it empty.';
    if (f.maxDiscount !== '' && !(Number(f.maxDiscount) > 0)) found.maxDiscount = 'Enter a number, or leave it empty.';
    if (f.usageLimit !== '' && !(Number.isInteger(Number(f.usageLimit)) && Number(f.usageLimit) >= 1)) found.usageLimit = 'Enter a whole number, or leave it empty.';
    if (!f.id && f.expiresAt && f.expiresAt < toDateInput(new Date())) found.expiresAt = 'Choose today or a later date.';
    return found;
  };

  const save = async (e) => {
    e.preventDefault();
    const found = validate(ed.form);
    ed.setErrors(found);
    if (Object.keys(found).length) return;
    const f = ed.form;
    const body = {
      code: f.code.trim().toUpperCase(),
      description: f.description,
      type: f.type,
      value: Number(f.value),
      minOrderAmount: f.minOrderAmount ? Number(f.minOrderAmount) : 0,
      maxDiscount: f.type === 'PERCENTAGE' && f.maxDiscount ? Number(f.maxDiscount) : null,
      usageLimit: f.usageLimit ? parseInt(f.usageLimit, 10) : null,
      expiresAt: f.expiresAt || null,
    };
    setSaving(true);
    try {
      if (f.id) {
        const updated = await admin.editDiscount(f.id, body);
        setDiscounts((prev) => prev.map((x) => (x.id === f.id ? updated : x)));
        showToast(`${updated.code} saved`, 'success');
      } else {
        const created = await admin.addDiscount({ ...body, isActive: true });
        setDiscounts((prev) => [created, ...prev]);
        showToast(`Promo code ${created.code} created`, 'success');
      }
      ed.close(true);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (d) => {
    try {
      const updated = await admin.editDiscount(d.id, { isActive: !d.isActive });
      setDiscounts((prev) => prev.map((x) => (x.id === d.id ? updated : x)));
      showToast(`${d.code} is now ${updated.isActive ? 'on' : 'off'}`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Delete promo code ${d.code}?${d.usedCount ? ` It has been used ${d.usedCount} time${d.usedCount === 1 ? '' : 's'}.` : ''}`)) return;
    try {
      await admin.removeDiscount(d.id);
      setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
      showToast(`${d.code} deleted`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const copy = (code) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(''), 1500);
  };

  const f = ed.form;
  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{discounts.length} promo code{discounts.length === 1 ? '' : 's'}</span>
        <button type="button" className="btn btn-primary" onClick={() => ed.open(blank)}><Plus size={16} /> New promo code</button>
      </div>
      {discounts.length === 0 ? <Empty>No promo codes yet. Create one to share with customers or hide in the treasure hunt.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-stack">
            <thead><tr><th>Code</th><th>Discount</th><th>Rules</th><th>Used</th><th>On</th><th /></tr></thead>
            <tbody>
              {discounts.map((d) => {
                const [statusText, tone] = promoStatus(d);
                return (
                  <tr key={d.id}>
                    <td data-label="Code">
                      <div className="adm-code-row">
                        <span className="adm-strong adm-code">{d.code}</span>
                        <button type="button" className={`adm-icon-btn ${copied === d.code ? 'is-done' : ''}`} onClick={() => copy(d.code)} aria-label={`Copy ${d.code}`}>
                          {copied === d.code ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <span className={`adm-pill is-${tone}`}>{statusText}</span>
                      </div>
                      {d.description && <div className="adm-muted">{d.description}</div>}
                    </td>
                    <td data-label="Discount">{d.type === 'PERCENTAGE' ? `${d.value}% off` : `${money(d.value)} off`}{d.maxDiscount ? <div className="adm-muted">max {money(d.maxDiscount)}</div> : null}</td>
                    <td className="adm-muted" data-label="Rules">
                      {d.minOrderAmount ? `Min order ${money(d.minOrderAmount)}` : 'Any order'}
                      {d.expiresAt ? <div>Ends {date(d.expiresAt)}</div> : null}
                    </td>
                    <td data-label="Used">{d.usedCount || 0}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</td>
                    <td data-label="On"><label className="adm-switch"><input type="checkbox" checked={d.isActive} onChange={() => toggle(d)} /><span>{d.isActive ? 'On' : 'Off'}</span></label></td>
                    <td className="adm-row-actions">
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => openEdit(d)}>Edit</button>
                      <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(d)} aria-label={`Delete ${d.code}`}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {f && (
        <Modal
          title={f.id ? `Edit ${f.code}` : 'New promo code'}
          onClose={() => !saving && ed.close()}
          footer={(
            <>
              <DirtyNote dirty={ed.dirty} />
              <button type="button" className="btn btn-outline" onClick={() => ed.close()} disabled={saving}>Cancel</button>
              <button type="submit" form="promo-form" className={`btn btn-primary ${saving ? 'is-loading' : ''}`}>{f.id ? 'Save changes' : 'Create code'}</button>
            </>
          )}
        >
          <form id="promo-form" onSubmit={save} noValidate>
            {promoSummary(f) && <p className="adm-summary-line">{promoSummary(f)}</p>}
            {f.id && f.usedCount > 0 && <p className="adm-note">Already used {f.usedCount} time{f.usedCount === 1 ? '' : 's'}. Changes apply to future orders only.</p>}
            <div className="form-row">
              <div>
                <Field label="Code">
                  <div className="adm-inline">
                    <input className="form-input adm-code" value={f.code} onChange={(e) => ed.set('code', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="EASTER15" maxLength={20} aria-invalid={Boolean(ed.errors.code)} />
                    {!f.id && <button type="button" className="btn btn-outline btn-sm" onClick={() => ed.set('code', randomCode())}>Make one</button>}
                  </div>
                </Field>
                <FieldError message={ed.errors.code} />
              </div>
              <Field label="Type">
                <select className="form-input" value={f.type} onChange={(e) => ed.set('type', e.target.value)}>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED">Fixed amount off (GH₵)</option>
                </select>
              </Field>
            </div>
            <div className="form-row">
              <div>
                <Field label={f.type === 'PERCENTAGE' ? 'Percent off' : 'Amount off (GH₵)'}>
                  <input className="form-input" type="number" inputMode="decimal" min="0.01" step="0.01" value={f.value} onChange={(e) => ed.set('value', e.target.value)} aria-invalid={Boolean(ed.errors.value)} />
                </Field>
                <FieldError message={ed.errors.value} />
              </div>
              <div>
                <Field label="Minimum order (GH₵)" hint={ed.errors.minOrderAmount ? null : 'Optional'}>
                  <input className="form-input" type="number" inputMode="decimal" min="0" step="0.01" value={f.minOrderAmount} onChange={(e) => ed.set('minOrderAmount', e.target.value)} />
                </Field>
                <FieldError message={ed.errors.minOrderAmount} />
              </div>
            </div>
            <div className="form-row">
              {f.type === 'PERCENTAGE' ? (
                <div>
                  <Field label="Most it can take off (GH₵)" hint={ed.errors.maxDiscount ? null : 'Optional'}>
                    <input className="form-input" type="number" inputMode="decimal" min="0" step="0.01" value={f.maxDiscount} onChange={(e) => ed.set('maxDiscount', e.target.value)} />
                  </Field>
                  <FieldError message={ed.errors.maxDiscount} />
                </div>
              ) : <span />}
              <div>
                <Field label="How many times it can be used" hint={ed.errors.usageLimit ? null : 'Optional — in total, by all customers'}>
                  <input className="form-input" type="number" inputMode="numeric" min="1" step="1" value={f.usageLimit} onChange={(e) => ed.set('usageLimit', e.target.value)} />
                </Field>
                <FieldError message={ed.errors.usageLimit} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <Field label="Last day it works" hint={ed.errors.expiresAt ? null : 'Optional — works until the end of that day'}>
                  <input className="form-input" type="date" value={f.expiresAt} onChange={(e) => ed.set('expiresAt', e.target.value)} />
                </Field>
                <FieldError message={ed.errors.expiresAt} />
              </div>
              <Field label="Note for yourself" hint="Optional — customers don't see this"><input className="form-input" value={f.description} onChange={(e) => ed.set('description', e.target.value)} /></Field>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Shipments
// ---------------------------------------------------------------------------
const blankBatch = {
  batchNumber: '', type: 'SEA_FCL', carrier: '', originPort: 'Guangzhou, China', destinationPort: 'Tema Port',
  capacityCbm: '68', allocatedCbm: '0', capacityKg: '2500', allocatedKg: '0', totalOrders: '0',
  status: 'CONFIRMED', cutoffDate: '', eta: '', isActive: true,
};

// "12 Nov" from a date-only value like "2026-11-12".
const shortDay = (value) => (value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const daysUntil = (value) => (value ? Math.round((new Date(`${value}T12:00:00`) - new Date(`${toDateInput(new Date())}T12:00:00`)) / 86400000) : null);

const ShipmentsTab = ({ batches, setBatches }) => {
  const { showToast, refreshBatches } = useStore();
  const ed = useEditor();
  const [saving, setSaving] = useState(false);

  const afterChange = () => { if (refreshBatches) refreshBatches(); };
  const clearSpace = () => ed.setErrors((e) => ({ ...e, space: undefined }));

  const validate = (f) => {
    const found = {};
    if (!f.batchNumber.trim()) found.batchNumber = 'Give the shipment a number or name.';
    else if (batches.some((b) => b.id !== f.id && b.batchNumber === f.batchNumber.trim().toUpperCase())) found.batchNumber = 'Another shipment already uses this number.';
    if (!f.carrier.trim()) found.carrier = 'Enter the shipping line or airline.';
    if (f.cutoffDate && f.eta && f.eta < f.cutoffDate) found.eta = 'Arrival should be after the last day to order.';
    const isSea = f.type === 'SEA_FCL';
    const cap = Number(isSea ? f.capacityCbm : f.capacityKg);
    const used = Number(isSea ? f.allocatedCbm : f.allocatedKg);
    if (cap > 0 && used > cap) found.space = 'Space used is more than the total space.';
    return found;
  };

  const save = async (e) => {
    e.preventDefault();
    const found = validate(ed.form);
    ed.setErrors(found);
    if (Object.keys(found).length) return;
    const form = ed.form;
    setSaving(true);
    const isSea = form.type === 'SEA_FCL';
    const body = {
      batchNumber: form.batchNumber.trim(),
      type: form.type,
      carrier: form.carrier,
      originPort: form.originPort,
      destinationPort: form.destinationPort,
      capacityCbm: isSea ? Number(form.capacityCbm) || null : null,
      allocatedCbm: isSea ? Number(form.allocatedCbm) || 0 : 0,
      capacityKg: isSea ? null : Number(form.capacityKg) || null,
      allocatedKg: isSea ? 0 : Number(form.allocatedKg) || 0,
      totalOrders: parseInt(form.totalOrders || 0, 10),
      status: form.status,
      cutoffDate: form.cutoffDate || null,
      eta: form.eta || null,
      isActive: form.isActive,
    };
    try {
      if (form.id) {
        const updated = await admin.editBatch(form.id, body);
        setBatches((prev) => prev.map((b) => (b.id === form.id ? updated : b)));
      } else {
        const created = await admin.addBatch(body);
        setBatches((prev) => [created, ...prev]);
      }
      showToast(`Shipment ${body.batchNumber.toUpperCase()} saved`, 'success');
      ed.close(true);
      afterChange();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const quick = async (b, changes, msg) => {
    try {
      const updated = await admin.editBatch(b.id, changes);
      setBatches((prev) => prev.map((x) => (x.id === b.id ? updated : x)));
      showToast(msg, 'success');
      afterChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete shipment ${b.batchNumber}?`)) return;
    try {
      await admin.removeBatch(b.id);
      setBatches((prev) => prev.filter((x) => x.id !== b.id));
      showToast(`${b.batchNumber} deleted`, 'info');
      afterChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toForm = (b) => ({
    ...blankBatch,
    ...Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v === null || v === undefined ? '' : typeof v === 'number' ? String(v) : v])),
    isActive: b.isActive !== false,
  });

  const form = ed.form;
  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">The newest shipment marked "Show on website" appears on the home page.</span>
        <button type="button" className="btn btn-primary" onClick={() => ed.open({ ...blankBatch })}><Plus size={16} /> New shipment</button>
      </div>
      {batches.length === 0 ? <Empty>No shipments yet. Add one to show customers when the next container closes and arrives.</Empty> : (
        <div className="adm-list">
          {batches.map((b) => {
            const isSea = b.type === 'SEA_FCL';
            const cap = isSea ? b.capacityCbm : b.capacityKg;
            const used = isSea ? b.allocatedCbm : b.allocatedKg;
            const pct = cap ? Math.min(100, Math.round(((used || 0) / cap) * 100)) : null;
            const stageIndex = BATCH_STAGES.findIndex(([v]) => v === b.status);
            const next = BATCH_STAGES[stageIndex + 1];
            const cutoffIn = daysUntil(b.cutoffDate);
            return (
              <article key={b.id} className="adm-card">
                <header className="adm-card-head">
                  <div>
                    <strong className="adm-code">{b.batchNumber}</strong>
                    <span className="adm-muted"> · {isSea ? 'Sea' : 'Air'} · {b.carrier}</span>
                  </div>
                  <label className="adm-switch">
                    <input type="checkbox" checked={b.isActive !== false} onChange={(e) => quick(b, { isActive: e.target.checked }, e.target.checked ? 'Shown on website' : 'Hidden from website')} />
                    <span>Show on website</span>
                  </label>
                </header>

                <ol className="adm-stages" aria-label="Stage">
                  {BATCH_STAGES.map(([v, l], i) => (
                    <li key={v} className={i < stageIndex ? 'is-done' : i === stageIndex ? 'is-current' : ''} title={l}>
                      <span className="adm-stage-dot" />
                      <span className="adm-stage-label">{l}</span>
                    </li>
                  ))}
                </ol>

                <div className="adm-order-grid">
                  <div><div className="adm-label">Route</div><div>{b.originPort} → {b.destinationPort}</div></div>
                  <div>
                    <div className="adm-label">Dates</div>
                    <div>
                      Last day to order: {shortDay(b.cutoffDate)}
                      {cutoffIn !== null && (
                        <span className={`adm-pill is-${cutoffIn < 0 ? 'muted' : cutoffIn <= 3 ? 'warning' : 'info'}`}>
                          {cutoffIn < 0 ? 'Closed' : cutoffIn === 0 ? 'Closes today' : `${cutoffIn} day${cutoffIn === 1 ? '' : 's'} left`}
                        </span>
                      )}
                    </div>
                    <div>Arrives: {shortDay(b.eta)}</div>
                  </div>
                  <div>
                    <div className="adm-label">Space used</div>
                    <div>{used ?? 0} / {cap ?? '—'} {isSea ? 'CBM' : 'kg'}{pct !== null ? ` (${pct}%)` : ''}</div>
                    {pct !== null && <div className="adm-meter" aria-hidden="true"><span style={{ width: `${pct}%` }} className={pct >= 90 ? 'is-full' : ''} /></div>}
                    <div className="adm-muted">{b.totalOrders || 0} orders</div>
                  </div>
                </div>
                <footer className="adm-card-actions">
                  {next && (
                    <button type="button" className="btn btn-primary adm-next" onClick={() => quick(b, { status: next[0] }, `${b.batchNumber}: ${next[1]}`)}>
                      <Check size={16} /> Move to "{next[1]}"
                    </button>
                  )}
                  <label className="adm-mini-field">
                    <span>Stage</span>
                    <select className="form-input" value={b.status} onChange={(e) => quick(b, { status: e.target.value }, `${b.batchNumber}: ${label(BATCH_STAGES, e.target.value)}`)}>
                      {BATCH_STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn btn-outline" onClick={() => ed.open(toForm(b))}>Edit</button>
                  <button type="button" className="btn btn-outline adm-danger" onClick={() => remove(b)} aria-label={`Delete ${b.batchNumber}`}><Trash2 size={14} /></button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <Modal
          title={form.id ? 'Edit shipment' : 'New shipment'}
          onClose={() => !saving && ed.close()}
          footer={(
            <>
              <DirtyNote dirty={ed.dirty} />
              <button type="button" className="btn btn-outline" onClick={() => ed.close()} disabled={saving}>Cancel</button>
              <button type="submit" form="batch-form" className={`btn btn-primary ${saving ? 'is-loading' : ''}`}>Save shipment</button>
            </>
          )}
        >
          <form id="batch-form" onSubmit={save} noValidate>
            <div className="form-row">
              <div>
                <Field label="Shipment number"><input className="form-input" value={form.batchNumber} onChange={(e) => ed.set('batchNumber', e.target.value)} placeholder="CN-GH-2026-FCL05" aria-invalid={Boolean(ed.errors.batchNumber)} /></Field>
                <FieldError message={ed.errors.batchNumber} />
              </div>
              <Field label="Type">
                <select className="form-input" value={form.type} onChange={(e) => ed.set('type', e.target.value)}>
                  <option value="SEA_FCL">Sea</option>
                  <option value="AIR_CARGO">Air</option>
                </select>
              </Field>
            </div>
            <Field label="Shipping line / airline"><input className="form-input" placeholder="Maersk" value={form.carrier} onChange={(e) => ed.set('carrier', e.target.value)} aria-invalid={Boolean(ed.errors.carrier)} /></Field>
            <FieldError message={ed.errors.carrier} />
            <div className="form-row">
              <Field label="From"><input className="form-input" value={form.originPort} onChange={(e) => ed.set('originPort', e.target.value)} /></Field>
              <Field label="To"><input className="form-input" value={form.destinationPort} onChange={(e) => ed.set('destinationPort', e.target.value)} /></Field>
            </div>
            <div className="form-row">
              <Field label="Last day to order"><input className="form-input" type="date" value={form.cutoffDate} onChange={(e) => ed.set('cutoffDate', e.target.value)} /></Field>
              <div>
                <Field label="Expected arrival"><input className="form-input" type="date" value={form.eta} onChange={(e) => ed.set('eta', e.target.value)} /></Field>
                <FieldError message={ed.errors.eta} />
              </div>
            </div>
            {form.type === 'SEA_FCL' ? (
              <div className="form-row">
                <Field label="Container space (CBM)"><input className="form-input" type="number" inputMode="decimal" min="0" step="0.1" value={form.capacityCbm} onChange={(e) => { ed.set('capacityCbm', e.target.value); clearSpace(); }} /></Field>
                <Field label="Space already used (CBM)"><input className="form-input" type="number" inputMode="decimal" min="0" step="0.1" value={form.allocatedCbm} onChange={(e) => { ed.set('allocatedCbm', e.target.value); clearSpace(); }} /></Field>
              </div>
            ) : (
              <div className="form-row">
                <Field label="Weight limit (kg)"><input className="form-input" type="number" inputMode="numeric" min="0" step="1" value={form.capacityKg} onChange={(e) => { ed.set('capacityKg', e.target.value); clearSpace(); }} /></Field>
                <Field label="Weight already used (kg)"><input className="form-input" type="number" inputMode="numeric" min="0" step="1" value={form.allocatedKg} onChange={(e) => { ed.set('allocatedKg', e.target.value); clearSpace(); }} /></Field>
              </div>
            )}
            <FieldError message={ed.errors.space} />
            <div className="form-row">
              <Field label="Number of orders"><input className="form-input" type="number" inputMode="numeric" min="0" step="1" value={form.totalOrders} onChange={(e) => ed.set('totalOrders', e.target.value)} /></Field>
              <Field label="Stage">
                <select className="form-input" value={form.status} onChange={(e) => ed.set('status', e.target.value)}>
                  {BATCH_STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <label className="shop-check"><input type="checkbox" checked={form.isActive} onChange={(e) => ed.set('isActive', e.target.checked)} /> Show on website</label>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
// "5 min ago", "3 hrs ago", "yesterday", then the date.
const timeAgo = (d) => {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (!(mins >= 0)) return date(d);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
  const days = Math.round(hrs / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return date(d);
};

const MessagesTab = ({ messages, setMessages }) => {
  const { showToast } = useStore();
  const [filter, setFilter] = useState('NEW');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const statusOf = (m) => m.status || 'NEW';
  const counts = {
    NEW: messages.filter((m) => statusOf(m) === 'NEW').length,
    REPLIED: messages.filter((m) => statusOf(m) === 'REPLIED').length,
    CLOSED: messages.filter((m) => statusOf(m) === 'CLOSED').length,
    all: messages.length,
  };
  const q = query.trim().toLowerCase();
  const shown = messages.filter((m) => (filter === 'all' || statusOf(m) === filter)
    && (!q || [m.name, m.phone, m.email, m.subject, m.message].some((v) => String(v || '').toLowerCase().includes(q))));

  const setStatus = async (m, status, note) => {
    setBusy(m.id);
    try {
      const updated = await admin.setMessageStatus(m.id, status);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
      if (note) {
        showToast(note, 'info', {
          action: { label: 'Undo', onClick: () => admin.setMessageStatus(m.id, statusOf(m)).then((back) => setMessages((prev) => prev.map((x) => (x.id === m.id ? back : x)))) },
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const replyText = (m) => {
    const isRequest = /^item request/i.test(m.subject || '');
    const item = isRequest ? (m.subject || '').replace(/^item request:\s*/i, '') : '';
    return isRequest
      ? `Hello ${m.name}, this is CHARI about your request for "${item}". `
      : `Hello ${m.name}, this is CHARI replying to your message about "${m.subject}". `;
  };

  return (
    <>
      <div className="adm-views" role="tablist" aria-label="Message filters">
        {[['NEW', 'New'], ['REPLIED', 'Replied'], ['CLOSED', 'Closed'], ['all', 'All']].map(([v, l]) => (
          <button key={v} type="button" role="tab" aria-selected={filter === v} className={`adm-view ${filter === v ? 'is-active' : ''} ${v === 'NEW' && counts.NEW ? 'is-urgent' : ''}`} onClick={() => setFilter(v)}>
            {l} <span>{counts[v]}</span>
          </button>
        ))}
      </div>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search name, phone or words in the message" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>

      {shown.length === 0 ? (
        <Empty>{q ? 'No messages match your search.' : filter === 'NEW' ? 'All caught up — no new messages.' : 'No messages here.'}</Empty>
      ) : (
        <div className="adm-list">
          {shown.map((m) => {
            const status = statusOf(m);
            const isRequest = /^item request/i.test(m.subject || '');
            const lines = String(m.message || '').split('\n');
            // Item requests can carry a "Photo: <link>" line — show it as a picture instead of text.
            const photo = lines.find((l) => l.startsWith('Photo: '))?.slice(7);
            return (
              <article key={m.id} className={`adm-card adm-msg ${status === 'NEW' ? 'is-new' : ''}`} aria-busy={busy === m.id}>
                <header className="adm-card-head">
                  <div className="adm-msg-title">
                    <span className={`adm-pill is-${isRequest ? 'warning' : 'info'}`}>{isRequest ? 'Item request' : 'Message'}</span>
                    <strong>{isRequest ? m.subject.replace(/^item request:\s*/i, '') : m.subject}</strong>
                  </div>
                  <span className="adm-muted" title={new Date(m.createdAt).toLocaleString('en-GB')}>{timeAgo(m.createdAt)}</span>
                </header>
                <p className="adm-message">{lines.filter((l) => !l.startsWith('Photo: ')).join('\n')}</p>
                {photo && (
                  <a className="adm-message-photo" href={photo} target="_blank" rel="noreferrer" title="Open the customer's photo">
                    <SmartImage src={sizedImage(photo, 240)} alt="Photo sent by the customer" fallbackLabel="Open photo" />
                    <span>Customer's photo</span>
                  </a>
                )}
                <div className="adm-msg-from">
                  <strong>{m.name}</strong>
                  {m.phone && <a className="adm-phone" href={`tel:${String(m.phone).replace(/\s/g, '')}`}><Phone size={13} /> {m.phone}</a>}
                  {m.email && <a className="adm-phone" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a>}
                </div>
                <footer className="adm-card-actions">
                  {m.phone ? (
                    <a className="btn btn-whatsapp btn-sm" target="_blank" rel="noreferrer" href={waLink(m.phone, replyText(m))} onClick={() => status === 'NEW' && setStatus(m, 'REPLIED')}>
                      <MessageCircle size={14} /> Reply on WhatsApp
                    </a>
                  ) : m.email ? (
                    <a className="btn btn-primary btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}&body=${encodeURIComponent(replyText(m))}`} onClick={() => status === 'NEW' && setStatus(m, 'REPLIED')}>
                      Reply by email
                    </a>
                  ) : null}
                  <div className="adm-msg-status" role="group" aria-label="Status">
                    {MESSAGE_STATUSES.map(([v, l]) => (
                      <button key={v} type="button" className={status === v ? 'is-active' : ''} aria-pressed={status === v} disabled={busy === m.id || status === v}
                        onClick={() => setStatus(m, v, `Marked as ${l.toLowerCase()}`)}>
                        {l}
                      </button>
                    ))}
                  </div>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      <p className="adm-help">Replying on WhatsApp marks a new message as replied. Close a conversation once it's sorted, so New only shows what still needs an answer.</p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
const CUSTOMER_SORTS = [
  ['newest', 'Newest first'],
  ['orders', 'Most orders'],
  ['credit', 'Most store credit'],
  ['invited', 'Most friends invited'],
  ['name', 'Name A–Z'],
];

// Spreadsheet-safe CSV cell (quotes, commas and line breaks handled).
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const CustomersTab = ({ customers, onViewOrders }) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const q = query.trim().toLowerCase();
  const orderCount = (c) => c._count?.orders ?? 0;
  const shown = customers
    .filter((c) => !q || [c.name, c.email, c.phone, c.city].some((v) => String(v || '').toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sortBy === 'orders') return orderCount(b) - orderCount(a);
      if (sortBy === 'credit') return (b.creditBalance || 0) - (a.creditBalance || 0);
      if (sortBy === 'invited') return (b._count?.referrals ?? 0) - (a._count?.referrals ?? 0);
      if (sortBy === 'name') return String(a.name).localeCompare(String(b.name));
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const stats = [
    ['Customers', customers.length],
    ['Joined this month', customers.filter((c) => new Date(c.createdAt) >= monthStart).length],
    ['Have ordered', customers.filter((c) => orderCount(c) > 0).length],
    ['Store credit owed', money(customers.reduce((s, c) => s + (c.creditBalance || 0), 0))],
  ];

  const download = () => {
    const rows = [['Name', 'Email', 'Phone', 'City', 'Joined', 'Orders', 'Friends invited', 'Store credit (GHS)']]
      .concat(shown.map((c) => [c.name, c.email, c.phone || '', c.city || '', new Date(c.createdAt).toISOString().slice(0, 10), orderCount(c), c._count?.referrals ?? 0, Number(c.creditBalance || 0).toFixed(2)]));
    const blob = new Blob([`\uFEFF${rows.map((r) => r.map(csvCell).join(',')).join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chari-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="adm-mini-stats">
        {stats.map(([text, value]) => <div key={text}><strong>{value}</strong><span>{text}</span></div>)}
      </div>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search name, email, phone or city" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select className="form-input adm-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort customers">
          {CUSTOMER_SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="button" className="btn btn-outline" onClick={download} disabled={shown.length === 0}>Download list (CSV)</button>
      </div>
      {shown.length === 0 ? <Empty>{q ? 'No customers match your search.' : 'No customers yet.'}</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-stack">
            <thead><tr><th>Name</th><th>City</th><th>Joined</th><th>Orders</th><th>Invited</th><th>Store credit</th><th /></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="adm-strong">{c.name} {c.role === 'ADMIN' && <span className="adm-pill is-info">Admin</span>}</div>
                    <div className="adm-muted adm-cust-contact">
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                      {c.phone && <a href={`tel:${String(c.phone).replace(/\s/g, '')}`}>{c.phone}</a>}
                    </div>
                  </td>
                  <td data-label="City">{c.city || '—'}</td>
                  <td data-label="Joined">{date(c.createdAt)}</td>
                  <td data-label="Orders">{orderCount(c)}</td>
                  <td data-label="Invited">{c._count?.referrals ?? 0}</td>
                  <td data-label="Store credit">{c.creditBalance ? money(c.creditBalance) : '—'}</td>
                  <td className="adm-row-actions">
                    {orderCount(c) > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={() => onViewOrders(c.phone || c.email)}>View orders</button>}
                    {c.phone && (
                      <a className="btn btn-whatsapp btn-sm" target="_blank" rel="noreferrer" href={waLink(c.phone, `Hello ${String(c.name).split(' ')[0]}, this is CHARI. `)} aria-label={`WhatsApp ${c.name}`}>
                        <MessageCircle size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Deals
// ---------------------------------------------------------------------------
const pad2 = (n) => String(n).padStart(2, '0');
const toDateInput = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const dateTime = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const DealsTab = ({ products, onCatalogChange }) => {
  const { showToast } = useStore();
  const ed = useEditor();
  const [saving, setSaving] = useState(false);
  const normalPrice = (p) => p.listPrice ?? p.price;
  const live = products.filter((p) => p.onDeal).sort((a, b) => new Date(a.dealEndsAt) - new Date(b.dealEndsAt));
  const form = ed.form;

  const openForm = (preselect = []) => {
    const end = new Date(Date.now() + 7 * 86400000);
    ed.open({
      editing: preselect.length > 0,
      selected: Object.fromEntries(preselect.map((p) => [p.id, String(p.onDeal ? p.price : '')])),
      mode: preselect.length === 1 && preselect[0].onDeal ? 'price' : 'percent',
      percent: '20',
      endDate: toDateInput(preselect[0]?.dealEndsAt ? new Date(preselect[0].dealEndsAt) : end),
      endTime: preselect[0]?.dealEndsAt ? `${pad2(new Date(preselect[0].dealEndsAt).getHours())}:${pad2(new Date(preselect[0].dealEndsAt).getMinutes())}` : '23:59',
      search: '',
    });
  };

  const setEnd = (days) => {
    const d = new Date(Date.now() + days * 86400000);
    ed.setForm((f) => ({ ...f, endDate: toDateInput(d), endTime: '23:59' }));
    ed.setErrors((e) => ({ ...e, end: undefined }));
  };

  const dealPriceFor = (p) => {
    if (!form) return null;
    if (form.mode === 'percent') {
      const pct = Number(form.percent);
      return Number.isFinite(pct) && pct > 0 && pct < 100 ? Math.round(normalPrice(p) * (100 - pct)) / 100 : null;
    }
    const v = Number(form.selected[p.id]);
    return Number.isFinite(v) && v > 0 ? v : null;
  };

  const chosen = form ? products.filter((p) => p.id in form.selected) : [];
  const pickable = form ? products.filter((p) => p.inStock !== false && p.name.toLowerCase().includes(form.search.toLowerCase())) : [];
  const endsAt = form ? new Date(`${form.endDate}T${form.endTime || '23:59'}`) : null;

  const save = async (e) => {
    e.preventDefault();
    const found = {};
    if (!chosen.length) found.products = 'Choose at least one product.';
    if (form.mode === 'percent' && !(Number(form.percent) > 0 && Number(form.percent) < 100)) found.percent = 'Choose a discount between 1% and 99%.';
    const badPrices = {};
    chosen.forEach((p) => {
      const dp = dealPriceFor(p);
      if (form.mode === 'price' && (!dp || dp >= normalPrice(p))) badPrices[p.id] = `Must be below ${money(normalPrice(p))}`;
    });
    if (Object.keys(badPrices).length) found.prices = badPrices;
    if (!form.endDate || Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) found.end = 'Choose an end time in the future.';
    ed.setErrors(found);
    if (Object.keys(found).length) return;

    const items = chosen.map((p) => ({ productId: p.id, dealPrice: dealPriceFor(p) }));
    setSaving(true);
    try {
      await admin.startDeals(endsAt.toISOString(), items);
      showToast(`${items.length} deal${items.length === 1 ? '' : 's'} live until ${dateTime(endsAt)}`, 'success');
      ed.close(true);
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const stop = async (p) => {
    if (!window.confirm(`End the deal on "${p.name}" now? The normal price (${money(normalPrice(p))}) comes back.`)) return;
    try {
      await admin.endDeal(p.id);
      showToast(`Deal on "${p.name}" ended`, 'info');
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const toggle = (p) => {
    ed.setForm((f) => {
      const selected = { ...f.selected };
      if (p.id in selected) delete selected[p.id]; else selected[p.id] = '';
      return { ...f, selected };
    });
    ed.setErrors((e) => ({ ...e, products: undefined }));
  };
  const selectShown = (on) => ed.setForm((f) => {
    const selected = { ...f.selected };
    pickable.forEach((p) => { if (on) { if (!(p.id in selected)) selected[p.id] = ''; } else delete selected[p.id]; });
    return { ...f, selected };
  });
  const setPrice = (id, value) => {
    ed.setForm((f) => ({ ...f, selected: { ...f.selected, [id]: value } }));
    ed.setErrors((e) => (e.prices?.[id] ? { ...e, prices: { ...e.prices, [id]: undefined } } : e));
  };

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{live.length ? `${live.length} deal${live.length === 1 ? '' : 's'} running` : 'No deals running'}</span>
        <button type="button" className="btn btn-primary" onClick={() => openForm()}><Plus size={16} /> New deal</button>
      </div>

      {live.length === 0 ? <Empty>No deals right now. Start one to show it on the home page with a countdown.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table adm-stack">
            <thead><tr><th>Product</th><th>Normal price</th><th>Deal price</th><th>Ends</th><th /></tr></thead>
            <tbody>
              {live.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="adm-product-cell">
                      <SmartImage src={sizedImage(p.image || p.images?.[0] || '', 96)} alt="" className="adm-product-thumb" />
                      <span className="adm-strong">{p.name}</span>
                    </div>
                  </td>
                  <td className="adm-muted" data-label="Normal price">{money(normalPrice(p))}</td>
                  <td className="adm-strong" data-label="Deal price">{money(p.price)} <span className="adm-pill is-warning">−{Math.round((1 - p.price / normalPrice(p)) * 100)}%</span></td>
                  <td data-label="Ends">{dateTime(p.dealEndsAt)}</td>
                  <td className="adm-row-actions">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => openForm([p])}>Change</button>
                    <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => stop(p)}>End now</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="adm-help">During a deal customers pay the deal price, the home page shows a countdown, and the normal price comes back automatically when the deal ends.</p>

      {form && (
        <Modal
          title={form.editing ? 'Change deal' : 'Start a deal'}
          onClose={() => !saving && ed.close()}
          footer={(
            <>
              <DirtyNote dirty={ed.dirty} />
              <button type="button" className="btn btn-outline" onClick={() => ed.close()} disabled={saving}>Cancel</button>
              <button type="submit" form="deal-form" className={`btn btn-primary ${saving ? 'is-loading' : ''}`}>
                {chosen.length > 1 ? `Start ${chosen.length} deals` : 'Start deal'}
              </button>
            </>
          )}
        >
          <form id="deal-form" onSubmit={save} noValidate>
            <div className="form-field">
              <div className="adm-pick-head">
                <span className="form-label">1. Choose products {chosen.length > 0 && <span className="adm-pill is-info">{chosen.length} chosen</span>}</span>
                <span className="adm-inline">
                  <button type="button" className="shop-link-btn" onClick={() => selectShown(true)}>Select all shown</button>
                  {chosen.length > 0 && <button type="button" className="shop-link-btn" onClick={() => selectShown(false)}>Clear</button>}
                </span>
              </div>
              <div className="adm-search" style={{ marginBottom: 8 }}><Search size={16} /><input placeholder="Search products" value={form.search} onChange={(e) => ed.set('search', e.target.value)} /></div>
              <div className="adm-pick-list">
                {pickable.length === 0 && <p className="form-hint">No in-stock products match.</p>}
                {pickable.map((p) => (
                  <label key={p.id} className={`adm-pick ${p.id in form.selected ? 'is-picked' : ''}`}>
                    <input type="checkbox" checked={p.id in form.selected} onChange={() => toggle(p)} />
                    <SmartImage src={sizedImage(p.image || p.images?.[0] || '', 80)} alt="" className="adm-pick-thumb" />
                    <span className="adm-pick-name">{p.name}{p.onDeal && <span className="adm-pill is-warning">On deal</span>}</span>
                    <span className="adm-muted">{money(normalPrice(p))}</span>
                  </label>
                ))}
              </div>
              <FieldError message={ed.errors.products} />
            </div>

            <div className="form-field">
              <span className="form-label">2. Discount</span>
              <div className="segmented" role="tablist" style={{ marginBottom: 10 }}>
                <button type="button" className={form.mode === 'percent' ? 'active' : ''} onClick={() => ed.set('mode', 'percent')}>Same % off for all</button>
                <button type="button" className={form.mode === 'price' ? 'active' : ''} onClick={() => ed.set('mode', 'price')}>Set each price</button>
              </div>
              {form.mode === 'percent' ? (
                <>
                  <div className="adm-inline">
                    <input className="form-input adm-price" type="number" inputMode="numeric" min="1" max="99" step="1" value={form.percent} onChange={(e) => ed.set('percent', e.target.value)} aria-label="Percent off" />
                    <span className="adm-muted">% off</span>
                    {[10, 20, 30, 50].map((n) => (
                      <button key={n} type="button" className={`adm-view ${Number(form.percent) === n ? 'is-active' : ''}`} onClick={() => ed.set('percent', String(n))}>{n}%</button>
                    ))}
                  </div>
                  <FieldError message={ed.errors.percent} />
                </>
              ) : chosen.length === 0 ? <p className="form-hint">Choose products first.</p> : (
                <div className="adm-pick-list">
                  {chosen.map((p) => (
                    <div key={p.id}>
                      <label className="adm-pick">
                        <span className="adm-pick-name">{p.name} <span className="adm-muted">(normal {money(normalPrice(p))})</span></span>
                        <input className="form-input adm-price" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="Deal price" value={form.selected[p.id]} onChange={(e) => setPrice(p.id, e.target.value)} aria-invalid={Boolean(ed.errors.prices?.[p.id])} />
                      </label>
                      <FieldError message={ed.errors.prices?.[p.id]} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-field">
              <span className="form-label">3. When it ends</span>
              <div className="adm-inline" style={{ marginBottom: 8 }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEnd(0)}>Tonight</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEnd(3)}>In 3 days</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEnd(7)}>In 1 week</button>
              </div>
              <div className="form-row">
                <input className="form-input" type="date" min={toDateInput(new Date())} value={form.endDate} onChange={(e) => { ed.set('endDate', e.target.value); ed.setErrors((x) => ({ ...x, end: undefined })); }} aria-label="End date" />
                <input className="form-input" type="time" value={form.endTime} onChange={(e) => { ed.set('endTime', e.target.value); ed.setErrors((x) => ({ ...x, end: undefined })); }} aria-label="End time" />
              </div>
              {!ed.errors.end && endsAt && endsAt > new Date() && <span className="form-hint">Ends {dateTime(endsAt)}</span>}
              <FieldError message={ed.errors.end} />
            </div>

            {chosen.length > 0 && (
              <div className="adm-deal-preview">
                <div className="adm-label">Customers will see</div>
                {chosen.map((p) => {
                  const dp = dealPriceFor(p);
                  const ok = dp && dp < normalPrice(p);
                  return (
                    <div key={p.id} className="adm-deal-row">
                      <span>{p.name}</span>
                      <span>
                        <s className="adm-muted">{money(normalPrice(p))}</s>{' '}
                        <strong className={ok ? '' : 'adm-text-danger'}>{dp ? money(dp) : '—'}</strong>
                        {ok && <span className="adm-pill is-warning">−{Math.round((1 - dp / normalPrice(p)) * 100)}%</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Treasure hunt — hide promo codes around the site
// ---------------------------------------------------------------------------
const discountUsable = (d) =>
  d && d.isActive && (!d.expiresAt || new Date(d.expiresAt) > new Date()) && (!d.usageLimit || (d.usedCount || 0) < d.usageLimit);

// Shown at the bottom of the screen while a tab has unsaved changes.
const SaveBar = ({ dirty, saving, onSave, onDiscard, label = 'Save changes' }) => (dirty ? (
  <div className="adm-savebar" role="region" aria-label="Unsaved changes">
    <span>You have unsaved changes</span>
    <button type="button" className="btn btn-outline btn-sm" onClick={onDiscard} disabled={saving}>Discard</button>
    <button type="button" className={`btn btn-primary btn-sm ${saving ? 'is-loading' : ''}`} onClick={onSave}>{label}</button>
  </div>
) : null);

// Warn before closing or reloading the page with unsaved changes.
const useLeaveWarning = (dirty) => {
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
};

// Which page each hiding spot is on, so the admin can go and look.
const SPOT_PAGE = {
  'home-hero': 'home', 'home-categories': 'home', footer: 'home', 'shop-header': 'shop', 'categories-page': 'categories',
  'about-page': 'about', 'import-tips-page': 'import-tips', 'contact-page': 'contact', 'track-page': 'track-order',
};

const HuntTab = ({ discounts, products }) => {
  const { showToast, refreshHunt, navigate, setSelectedProduct } = useStore();
  const [items, setItems] = useState(null);
  const [saved, setSaved] = useState('[]');
  const [spots, setSpots] = useState({});
  const [saving, setSaving] = useState(false);
  const [problems, setProblems] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    admin.getHunt()
      .then((data) => { setItems(data.items || []); setSaved(JSON.stringify(data.items || [])); setSpots(data.spots || {}); })
      .catch((err) => setError(err.message));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = items !== null && JSON.stringify(items) !== saved;
  useLeaveWarning(dirty);

  const byCode = useMemo(() => new Map(discounts.map((d) => [d.code, d])), [discounts]);
  const productFor = (spot) => products.find((p) => `product:${p.id}` === spot);
  const spotLabel = (spot) => (spot.startsWith('product:') ? `Inside product: ${productFor(spot)?.name || 'deleted product'}` : spots[spot] || spot);

  const update = (i, changes) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...changes } : it)));
    if (problems[i]) setProblems((p) => ({ ...p, [i]: undefined }));
  };
  const add = () => setItems((prev) => [...prev, { code: discounts.find(discountUsable)?.code || '', spot: 'home-hero', clue: '', active: true, finds: 0 }]);
  const remove = (i) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setProblems({});
  };

  const save = async () => {
    const found = {};
    items.forEach((it, i) => { if (!it.code) found[i] = 'Choose a promo code to hide here.'; });
    setProblems(found);
    if (Object.keys(found).length) {
      document.querySelector(`[data-hunt="${Object.keys(found)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const data = await admin.saveHunt(items);
      setItems(data.items);
      setSaved(JSON.stringify(data.items));
      refreshHunt();
      showToast('Treasure hunt saved — the gems are live on the site', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Open the page (or product) where this gem is hidden.
  const goLook = (spot) => {
    if (spot.startsWith('product:')) {
      const p = productFor(spot);
      if (p) { navigate('shop'); setTimeout(() => setSelectedProduct(p), 200); }
      return;
    }
    navigate(SPOT_PAGE[spot] || 'home');
  };

  if (error) return <div className="form-error">{error} <button type="button" className="shop-link-btn" onClick={load}>Try again</button></div>;
  if (!items) {
    return <div className="adm-list">{[0, 1].map((i) => <div key={i} className="adm-card adm-skeleton" aria-hidden="true"><span /><span /><span /></div>)}</div>;
  }

  const liveCount = items.filter((it) => it.active !== false && discountUsable(byCode.get(it.code))).length;

  return (
    <>
      <details className="adm-card adm-hunt-intro" open={items.length === 0}>
        <summary><strong>How the treasure hunt works</strong></summary>
        <p className="adm-muted">
          Hide a promo code somewhere on the site and a small gem appears there. When a customer taps the gem, they get the code.
          A gem disappears by itself when its code is switched off, runs out or expires. If two codes are hidden in the same place, the second appears once the first has been found.
          Create the codes first in <em>Promo codes</em> — tip: give hidden codes a usage limit so only the first finders get them.
        </p>
      </details>

      <div className="adm-toolbar">
        <span className="adm-muted">{items.length} hidden · <strong>{liveCount}</strong> showing on the site now</span>
        <button type="button" className="btn btn-primary" onClick={add} disabled={discounts.length === 0 || items.length >= 30}><Plus size={16} /> Hide a code</button>
      </div>

      {discounts.length === 0 && <Empty>Create a promo code first, then come back here to hide it.</Empty>}

      {items.length === 0 ? (
        discounts.length > 0 && <Empty>Nothing hidden yet. Tap “Hide a code” to start.</Empty>
      ) : (
        <div className="adm-hunt-list">
          {items.map((it, i) => {
            const d = byCode.get(it.code);
            const usable = discountUsable(d);
            const live = it.active !== false && usable;
            const sharedSpot = items.findIndex((x) => x.spot === it.spot) !== i;
            return (
              <div key={it.id || `new-${i}`} className={`adm-card adm-hunt-item ${live ? 'is-live' : ''}`} data-hunt={i}>
                <div className="adm-hunt-top">
                  <span className={`adm-pill is-${live ? 'success' : 'muted'}`}>{live ? 'Showing on the site' : it.active === false ? 'Switched off' : !d ? 'Not showing' : 'Hidden — code is off, used up or expired'}</span>
                  <span className="adm-muted">Found {it.finds || 0}×{d ? ` · code used ${d.usedCount || 0}×` : ''}</span>
                </div>
                <div className="form-row">
                  <div>
                    <Field label="Promo code">
                      <select className="form-input" value={it.code} onChange={(e) => update(i, { code: e.target.value })} aria-invalid={Boolean(problems[i])}>
                        <option value="">Choose a code…</option>
                        {discounts.map((dc) => (
                          <option key={dc.id} value={dc.code}>
                            {dc.code} — {dc.type === 'PERCENTAGE' ? `${dc.value}% off` : `${money(dc.value)} off`}{discountUsable(dc) ? '' : ' (can’t be used now)'}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <FieldError message={problems[i]} />
                    {d && !usable && <p className="adm-note">This code is off, used up or expired, so the gem won't show. Fix it in Promo codes.</p>}
                  </div>
                  <div>
                    <Field label="Hide it on">
                      <select className="form-input" value={it.spot} onChange={(e) => update(i, { spot: e.target.value })}>
                        <optgroup label="Pages">
                          {Object.entries(spots).map(([id, text]) => <option key={id} value={id}>{text}</option>)}
                        </optgroup>
                        <optgroup label="Inside a product">
                          {products.map((p) => <option key={p.id} value={`product:${p.id}`}>{p.name}</option>)}
                        </optgroup>
                      </select>
                    </Field>
                    {sharedSpot && <span className="form-hint">Another code is hidden here too — this one appears after that one is found.</span>}
                  </div>
                </div>
                <Field label="Hint (optional)" hint="Shown when someone hovers over the gem, e.g. “Look where the story begins”">
                  <input className="form-input" maxLength={140} value={it.clue || ''} onChange={(e) => update(i, { clue: e.target.value })} />
                </Field>
                <div className="adm-hunt-foot">
                  <label className="adm-switch"><input type="checkbox" checked={it.active !== false} onChange={() => update(i, { active: !(it.active !== false) })} /><span>{it.active !== false ? 'On' : 'Off'}</span></label>
                  <button type="button" className="shop-link-btn adm-hunt-look" onClick={() => goLook(it.spot)} disabled={dirty} title={dirty ? 'Save first, then go and look' : undefined}>
                    See it on the site: {spotLabel(it.spot)}
                  </button>
                  <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(i)} aria-label="Remove this hidden code"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setItems(JSON.parse(saved)); setProblems({}); }} label="Save treasure hunt" />
    </>
  );
};

// ---------------------------------------------------------------------------
// Phone alerts (web push) for new orders, item requests and reviews
// ---------------------------------------------------------------------------
const keyToBytes = (base64) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};
const deviceName = () => {
  const ua = navigator.userAgent;
  const os = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac' : 'Device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'browser';
  return `${os} · ${browser}`;
};
const isIos = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const isInstalled = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

const AlertsCard = () => {
  const { showToast } = useStore();
  const [status, setStatus] = useState(null);
  const [mySub, setMySub] = useState(null);
  const [busy, setBusy] = useState(false);
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  const swReady = async () => {
    if (!navigator.serviceWorker.controller) await navigator.serviceWorker.register('/sw.js');
    return navigator.serviceWorker.ready;
  };

  const load = async () => {
    try {
      setStatus(await admin.getAlertStatus());
      if (supported) setMySub(await (await swReady()).pushManager.getSubscription());
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const turnOn = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Alerts are blocked. Allow notifications for this site in your browser settings, then try again.');
      const reg = await swReady();
      const sub = (await reg.pushManager.getSubscription())
        || (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(status.publicKey) }));
      await admin.subscribeAlerts(sub.toJSON(), deviceName());
      showToast('Alerts are on for this device', 'success');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async (endpoint) => {
    setBusy(true);
    try {
      await admin.unsubscribeAlerts(endpoint);
      if (mySub && mySub.endpoint === endpoint) await mySub.unsubscribe();
      showToast('Alerts turned off for that device', 'info');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const { sent } = await admin.sendTestAlert();
      showToast(sent ? `Test alert sent to ${sent} device${sent === 1 ? '' : 's'}` : 'No devices have alerts turned on yet', sent ? 'success' : 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!status) return <div className="adm-card adm-settings"><Empty>Loading alerts…</Empty></div>;
  const devices = status.devices || [];
  const thisDeviceOn = Boolean(mySub && devices.some((d) => d.endpoint === mySub.endpoint));

  return (
    <div className="adm-card adm-settings adm-alerts">
      <h3 className="adm-section-title">Alerts on your phone</h3>
      <p className="adm-muted">Get a notification the moment a customer places an order, requests an item or writes a review.</p>

      {!status.pushEnabled ? (
        <div className="form-error">Phone alerts aren’t set up on the server yet. Add the VAPID keys in Render → Environment (see the setup notes).</div>
      ) : !supported ? (
        <div className="adm-alerts-note">
          {isIos() && !isInstalled()
            ? <>On iPhone, first add CHARI to your home screen: tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. Then open CHARI from your home screen, sign in, and come back here.</>
            : 'This browser can’t receive alerts. Try Chrome on Android or a computer, or Safari on an iPhone with CHARI added to the home screen.'}
        </div>
      ) : (
        <div className="adm-inline">
          {thisDeviceOn
            ? <button type="button" className="btn btn-outline" disabled={busy} onClick={() => turnOff(mySub.endpoint)}>Turn off on this device</button>
            : <button type="button" className="btn btn-primary" disabled={busy} onClick={turnOn}>Turn on alerts on this device</button>}
          <button type="button" className="btn btn-outline" disabled={busy || devices.length === 0} onClick={test}>Send a test alert</button>
        </div>
      )}

      {devices.length > 0 && (
        <ul className="adm-alert-devices">
          {devices.map((d) => (
            <li key={d.endpoint}>
              <span><strong>{d.device}</strong>{mySub?.endpoint === d.endpoint ? ' (this device)' : ''}<span className="adm-muted"> · {d.userName} · added {date(d.addedAt)}</span></span>
              <button type="button" className="shop-link-btn" disabled={busy} onClick={() => turnOff(d.endpoint)}>Remove</button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="adm-section-title">Customer emails</h3>
      <p className="adm-muted">
        {status.emailEnabled
          ? 'On. Customers who give an email get an order confirmation, and an update each time you change the order or payment status.'
          : 'Off. Once an email account is connected on the server (SMTP_URL), customers who give an email will get order updates automatically.'}
      </p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const settingsToForm = (s) => ({
  phoneDisplay: s.phoneDisplay || '',
  whatsappNumber: s.whatsappNumber || '',
  momoNumber: s.momoNumber || '',
  momoName: s.momoName || '',
  email: s.email || '',
  location: s.location || '',
  pickupPoint: s.pickupPoint || '',
  openingHours: s.openingHours || '',
  announcementsText: (s.announcements || []).join('\n'),
});

// Same rules as the server (SETTING_RULES), checked before saving.
const settingsProblems = (f) => {
  const found = {};
  const len = (v) => v.trim().length;
  if (len(f.phoneDisplay) < 9 || len(f.phoneDisplay) > 30) found.phoneDisplay = 'Enter the phone number customers should call.';
  const wa = f.whatsappNumber.replace(/\D/g, '');
  if (wa.startsWith('0')) found.whatsappNumber = `Start with the country code instead of 0, e.g. 233${wa.slice(1)}.`;
  else if (wa.length < 10 || wa.length > 15) found.whatsappNumber = 'Use the full number with country code, e.g. 233591440934.';
  if (f.momoNumber.replace(/\D/g, '').length < 9) found.momoNumber = 'Enter the MoMo number customers pay to.';
  if (!len(f.momoName) || f.momoName.length > 60) found.momoName = 'Enter the name customers will see on the MoMo account.';
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) found.email = 'Check this email address, or leave it empty.';
  if (len(f.location) < 2) found.location = 'Enter your business location.';
  if (len(f.pickupPoint) < 2) found.pickupPoint = 'Enter where customers collect orders.';
  if (f.openingHours.length > 120) found.openingHours = 'Keep this under 120 characters.';
  const lines = f.announcementsText.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length > 6) found.announcementsText = 'Up to 6 messages — remove a line.';
  else if (lines.some((l) => l.length > 120)) found.announcementsText = 'Each message must be under 120 characters.';
  return found;
};

const SettingsTab = () => {
  const { showToast, refreshSettings } = useStore();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState('');
  const [problems, setProblems] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Always start from what's saved on the server, never from a page that may still be loading.
  const load = async () => {
    setLoadError('');
    try {
      const data = settingsToForm(await admin.getSettings());
      setForm(data);
      setSaved(JSON.stringify(data));
    } catch (err) {
      setLoadError(err.message);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = form !== null && JSON.stringify(form) !== saved;
  useLeaveWarning(dirty);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (problems[key]) setProblems((p) => ({ ...p, [key]: undefined }));
  };

  const save = async (e) => {
    e?.preventDefault();
    const found = settingsProblems(form);
    setProblems(found);
    const first = Object.keys(found)[0];
    if (first) {
      document.querySelector(`[data-setting="${first}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const updated = await admin.saveSettings({
        phoneDisplay: form.phoneDisplay,
        whatsappNumber: form.whatsappNumber,
        momoNumber: form.momoNumber,
        momoName: form.momoName,
        email: form.email,
        location: form.location,
        pickupPoint: form.pickupPoint,
        openingHours: form.openingHours,
        announcements: form.announcementsText.split('\n').map((l) => l.trim()).filter(Boolean),
      });
      const fresh = settingsToForm(updated);
      setForm(fresh);
      setSaved(JSON.stringify(fresh));
      await refreshSettings();
      showToast('Settings saved — the website is updated', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const field = (key, labelText, hint, input) => (
    <div data-setting={key}>
      <Field label={labelText} hint={problems[key] ? null : hint}>{input}</Field>
      <FieldError message={problems[key]} />
    </div>
  );

  if (loadError) return <div className="form-error">{loadError} <button type="button" className="shop-link-btn" onClick={load}>Try again</button></div>;
  if (!form) return <div className="adm-list">{[0, 1].map((i) => <div key={i} className="adm-card adm-skeleton" aria-hidden="true"><span /><span /><span /></div>)}</div>;

  const banners = form.announcementsText.split('\n').map((l) => l.trim()).filter(Boolean);
  const waDigits = form.whatsappNumber.replace(/\D/g, '');

  return (
    <>
      <form onSubmit={save} className="adm-card adm-settings" noValidate>
        <h3 className="adm-section-title">Contact details</h3>
        <div className="form-row">
          {field('phoneDisplay', 'Phone number shown on the site', 'Shown in the footer and on the Contact page',
            <input className="form-input" type="tel" value={form.phoneDisplay} onChange={set('phoneDisplay')} aria-invalid={Boolean(problems.phoneDisplay)} />)}
          {field('whatsappNumber', 'WhatsApp number', 'With country code, no + or spaces, e.g. 233591440934',
            <div className="adm-inline">
              <input className="form-input" inputMode="numeric" value={form.whatsappNumber} onChange={set('whatsappNumber')} aria-invalid={Boolean(problems.whatsappNumber)} />
              <a className="btn btn-outline btn-sm" href={`https://wa.me/${waDigits}`} target="_blank" rel="noreferrer" aria-disabled={waDigits.length < 10}>Test</a>
            </div>)}
        </div>
        <div className="form-row">
          {field('email', 'Email', 'Leave empty to hide it on the site',
            <input className="form-input" type="email" value={form.email} onChange={set('email')} aria-invalid={Boolean(problems.email)} />)}
          {field('openingHours', 'Opening hours', 'e.g. Monday – Saturday, 8:00 am – 6:30 pm',
            <input className="form-input" value={form.openingHours} onChange={set('openingHours')} />)}
        </div>

        <h3 className="adm-section-title">Location</h3>
        <div className="form-row">
          {field('location', 'Business location', 'e.g. Kumasi, Ghana',
            <input className="form-input" value={form.location} onChange={set('location')} aria-invalid={Boolean(problems.location)} />)}
          {field('pickupPoint', 'Pickup point', 'Where customers collect orders, e.g. Adum, Kumasi',
            <input className="form-input" value={form.pickupPoint} onChange={set('pickupPoint')} aria-invalid={Boolean(problems.pickupPoint)} />)}
        </div>

        <h3 className="adm-section-title">Mobile Money</h3>
        <div className="form-row">
          {field('momoNumber', 'MoMo number customers pay to', null,
            <input className="form-input" type="tel" value={form.momoNumber} onChange={set('momoNumber')} aria-invalid={Boolean(problems.momoNumber)} />)}
          {field('momoName', 'MoMo account name', 'Exactly as it appears when customers send money',
            <input className="form-input" value={form.momoName} onChange={set('momoName')} aria-invalid={Boolean(problems.momoName)} />)}
        </div>
        <p className="adm-preview-line">Customers see: <strong>Send GH₵… to {form.momoNumber || '—'} ({form.momoName || '—'})</strong> with their order code as the reference.</p>

        <h3 className="adm-section-title">Top banner messages</h3>
        {field('announcementsText', 'One message per line (up to 6)', 'These rotate in the blue bar at the top of every page. A deals message is added automatically while a deal is running.',
          <textarea className="form-input" rows={4} value={form.announcementsText} onChange={set('announcementsText')} aria-invalid={Boolean(problems.announcementsText)} />)}
        {banners.length > 0 && (
          <ul className="adm-banner-preview" aria-label="Banner preview">
            {banners.map((line, i) => (
              <li key={i} className={line.length > 120 || i >= 6 ? 'is-bad' : ''}>
                <span>{line}</span>
                <small>{i >= 6 ? 'Over the limit' : `${line.length}/120`}</small>
              </li>
            ))}
          </ul>
        )}

        <div className="adm-inline adm-settings-actions">
          <button type="submit" className={`btn btn-primary ${saving ? 'is-loading' : ''}`} disabled={!dirty}>Save settings</button>
        </div>
      </form>

      <AlertsCard />
      <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setForm(JSON.parse(saved)); setProblems({}); }} label="Save settings" />
    </>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const TABS = [
  ['orders', 'Orders'],
  ['products', 'Products'],
  ['deals', 'Deals'],
  ['categories', 'Categories'],
  ['promos', 'Promo codes'],
  ['hunt', 'Treasure hunt'],
  ['shipments', 'Shipments'],
  ['messages', 'Messages'],
  ['customers', 'Customers'],
  ['settings', 'Settings'],
];

export const AdminPage = () => {
  const { user, openAuth, navigate, showToast, refreshProducts } = useStore();
  const [tab, setTabState] = useState(() => {
    try { return sessionStorage.getItem('chari_admin_tab') || 'orders'; } catch { return 'orders'; }
  });
  const [orderView, setOrderView] = useState('all');
  const [failed, setFailed] = useState([]);
  const tabsRef = useRef(null);
  const setTab = (id) => {
    setTabState(id);
    try { sessionStorage.setItem('chari_admin_tab', id); } catch {}
  };
  // Keep the chosen section visible in the scrolling tab bar on phones.
  useEffect(() => {
    tabsRef.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [tab]);
  const openOrders = (view) => { setOrderView(view); setTab('orders'); };
  // "View orders" on a customer: all orders, searched by their phone or email.
  const [orderSearch, setOrderSearch] = useState(null);
  const viewCustomerOrders = (text) => { setOrderView('all'); setOrderSearch({ text, at: Date.now() }); setTab('orders'); };
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [customers, setCustomers] = useState([]);

  const load = async () => {
    setLoading(true);
    setLoadError('');
    // Each section loads on its own, so one failing (e.g. Shipments) doesn't hide the orders.
    const sections = [
      ['Orders', admin.listOrders, setOrders],
      ['Products', admin.listProducts, setProducts],
      ['Categories', admin.listCategories, setCategories],
      ['Promo codes', admin.listDiscounts, setDiscounts],
      ['Shipments', admin.listBatches, setBatches],
      ['Messages', admin.listMessages, setMessages],
      ['Customers', admin.listCustomers, setCustomers],
    ];
    const results = await Promise.allSettled(sections.map(([, fetcher]) => fetcher()));
    const failedNames = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') sections[i][2](r.value);
      else failedNames.push(sections[i][0]);
    });
    setFailed(failedNames);
    // Everything failed: most likely signed out or offline, so show that message on its own.
    if (failedNames.length === sections.length) setLoadError(results[0].reason?.message || 'Could not load the dashboard.');
    setLoading(false);
  };

  // Product/category changes also refresh the shop the admin sees.
  const onCatalogChange = async () => {
    try {
      const [p, c] = await Promise.all([admin.listProducts(), admin.listCategories()]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      showToast(err.message, 'error');
    }
    if (refreshProducts) refreshProducts();
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const stats = useMemo(() => {
    const live = orders.filter((o) => o.orderStatus !== 'CANCELLED');
    return {
      checkPayment: orders.filter(ORDER_VIEWS.find(([id]) => id === 'check')[2]).length,
      toShip: orders.filter(ORDER_VIEWS.find(([id]) => id === 'toShip')[2]).length,
      paidSales: live.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + (o.total || 0), 0),
      newMessages: messages.filter((m) => (m.status || 'NEW') === 'NEW').length,
    };
  }, [orders, messages]);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="section">
        <div className="container adm-gate">
          <h1>Admin sign-in</h1>
          <p>This area is for the store team. Sign in with an admin account to continue.</p>
          <button type="button" className="btn btn-primary" onClick={() => openAuth('login')}>Sign in</button>
        </div>
      </div>
    );
  }

  const counts = { orders: orders.length, products: products.length, deals: products.filter((p) => p.onDeal).length, categories: categories.length, promos: discounts.length, shipments: batches.length, messages: stats.newMessages, customers: customers.length };

  return (
    <div className="section adm">
      <div className="container">
        <div className="adm-head">
          <div>
            <h1>Admin</h1>
            <p className="adm-muted">Signed in as {user.name}</p>
          </div>
          <div className="adm-inline">
            <button type="button" className="btn btn-outline" onClick={load} disabled={loading}><RefreshCw size={15} /> {loading ? 'Loading…' : 'Refresh'}</button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('home')}>View shop</button>
          </div>
        </div>

        <div className="adm-stats">
          <button type="button" className={stats.checkPayment ? 'needs-action' : ''} onClick={() => openOrders('check')}>
            <strong>{stats.checkPayment}</strong><span>Payments to check</span>
          </button>
          <button type="button" className={stats.toShip ? 'needs-action' : ''} onClick={() => openOrders('toShip')}>
            <strong>{stats.toShip}</strong><span>Ready to ship</span>
          </button>
          <div><strong>{money(stats.paidSales)}</strong><span>Paid sales (all time)</span></div>
          <button type="button" className={stats.newMessages ? 'needs-action' : ''} onClick={() => setTab('messages')}>
            <strong>{stats.newMessages}</strong><span>New messages</span>
          </button>
        </div>

        <nav className="adm-tabs" aria-label="Admin sections" ref={tabsRef}>
          {TABS.map(([id, text]) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {text}{counts[id] ? <span className="adm-count">{counts[id]}</span> : null}
            </button>
          ))}
        </nav>

        {!loading && !loadError && failed.length > 0 && (
          <div className="adm-warning" role="alert">
            <AlertTriangle size={16} />
            <span>Couldn't load: {failed.join(', ')}. Everything else is up to date.</span>
            <button type="button" className="shop-link-btn" onClick={load}>Try again</button>
          </div>
        )}

        {loadError ? (
          <div className="form-error">{loadError} <button type="button" className="shop-link-btn" onClick={load}>Try again</button></div>
        ) : loading ? (
          <div className="adm-list" aria-label="Loading">
            {[0, 1, 2].map((i) => <div key={i} className="adm-card adm-skeleton" aria-hidden="true"><span /><span /><span /></div>)}
          </div>
        ) : (
          <div className="adm-panel">
            {tab === 'orders' && <OrdersTab orders={orders} setOrders={setOrders} view={orderView} setView={setOrderView} searchRequest={orderSearch} />}
            {tab === 'products' && <ProductsTab products={products} setProducts={setProducts} categories={categories} onCatalogChange={onCatalogChange} />}
            {tab === 'categories' && <CategoriesTab categories={categories} products={products} onCatalogChange={onCatalogChange} />}
            {tab === 'promos' && <PromoTab discounts={discounts} setDiscounts={setDiscounts} />}
            {tab === 'hunt' && <HuntTab discounts={discounts} products={products} />}
            {tab === 'shipments' && <ShipmentsTab batches={batches} setBatches={setBatches} />}
            {tab === 'messages' && <MessagesTab messages={messages} setMessages={setMessages} />}
            {tab === 'customers' && <CustomersTab customers={customers} onViewOrders={viewCustomerOrders} />}
            {tab === 'deals' && <DealsTab products={products} onCatalogChange={onCatalogChange} />}
            {tab === 'settings' && <SettingsTab />}
          </div>
        )}
      </div>
    </div>
  );
};
