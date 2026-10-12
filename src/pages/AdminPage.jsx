import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import * as admin from '../services/adminApi';
import { sizedImage } from '../utils/images';
import { X, Plus, Trash2, RefreshCw, Search, Upload, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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
const Modal = ({ title, onClose, children, footer }) => (
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

const Field = ({ label: text, hint, children }) => (
  <label className="form-field adm-field">
    <span className="form-label">{text}</span>
    {children}
    {hint && <span className="form-hint">{hint}</span>}
  </label>
);

const Empty = ({ children }) => <div className="adm-empty">{children}</div>;

// Photo picker used for products and categories: upload files or paste links, reorder, remove.
const PhotoManager = ({ photos, onChange, max = 8, single = false }) => {
  const { showToast } = useStore();
  const [uploading, setUploading] = useState(false);
  const [link, setLink] = useState('');

  const addFiles = async (files) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setUploading(true);
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
            <img src={sizedImage(url, 200)} alt="" />
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
const OrdersTab = ({ orders, setOrders }) => {
  const { showToast } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [payment, setPayment] = useState('all');
  const [saving, setSaving] = useState(null);

  const shown = orders.filter((o) => {
    if (status !== 'all' && o.orderStatus !== status) return false;
    if (payment !== 'all' && o.paymentStatus !== payment) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return [o.orderCode, o.customerName, o.phone, o.city, o.email].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const update = async (order, changes) => {
    setSaving(order.id);
    try {
      const updated = await admin.setOrderStatus(order.id, changes);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      showToast(`Order ${order.orderCode} updated`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search code, name, phone or city" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <select className="form-input adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by order status">
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className="form-input adm-select" value={payment} onChange={(e) => setPayment(e.target.value)} aria-label="Filter by payment">
          <option value="all">All payments</option>
          {PAYMENT_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {shown.length === 0 ? <Empty>No orders match.</Empty> : (
        <div className="adm-list">
          {shown.map((o) => {
            const items = Array.isArray(o.items) ? o.items : [];
            return (
              <article key={o.id} className={`adm-card ${saving === o.id ? 'is-saving' : ''}`}>
                <header className="adm-card-head">
                  <div>
                    <strong className="adm-code">{o.orderCode}</strong>
                    <span className="adm-muted"> · {date(o.createdAt)}</span>
                  </div>
                  <strong className="adm-total">{money(o.total)}</strong>
                </header>

                <div className="adm-order-grid">
                  <div>
                    <div className="adm-label">Customer</div>
                    <div>{o.customerName}</div>
                    <div className="adm-muted">{o.phone}{o.email ? ` · ${o.email}` : ''}</div>
                    <div className="adm-muted">{[o.address, o.city].filter(Boolean).join(', ')}</div>
                  </div>
                  <div>
                    <div className="adm-label">Items</div>
                    <ul className="adm-items">
                      {items.map((it, i) => <li key={i}>{it.qty} × {it.name} <span className="adm-muted">@ {money(it.price)}</span></li>)}
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
                    <MessageCircle size={16} /> WhatsApp customer
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
const emptyProduct = (category) => ({ name: '', category, price: '', originalPrice: '', inStock: true, isNew: false, photos: [], description: '' });

const ProductsTab = ({ products, setProducts, categories, onCatalogChange }) => {
  const { showToast } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(null); // form state, id = null for a new product
  const [saving, setSaving] = useState(false);
  const [priceDrafts, setPriceDrafts] = useState({});

  const shown = products.filter((p) => (category === 'all' || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase()));

  const openNew = () => setEditing({ id: null, ...emptyProduct(categories[0]?.name || '') });
  const openEdit = (p) => setEditing({
    id: p.id,
    name: p.name,
    category: p.category,
    price: String(p.listPrice ?? p.price),
    originalPrice: (p.listWasPrice ?? p.originalPrice) ? String(p.listWasPrice ?? p.originalPrice) : '',
    inStock: p.inStock !== false,
    isNew: p.badge === 'New',
    photos: (p.gallery && p.gallery.length ? p.gallery : [p.image]).filter(Boolean),
    description: p.description || '',
  });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
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

  const savePrice = async (p) => {
    const draft = priceDrafts[p.id];
    if (draft === undefined || Number(draft) === (p.listPrice ?? p.price)) return;
    if (await quickUpdate(p, { price: draft }, `${p.name}: price now GH₵${Number(draft).toFixed(2)}`)) {
      setPriceDrafts((prev) => { const next = { ...prev }; delete next[p.id]; return next; });
    }
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

      {shown.length === 0 ? <Empty>No products found.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr><th>Product</th><th>Price (GH₵)</th><th>Was</th><th>In stock</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="adm-product-cell">
                      <img src={sizedImage(p.image, 96)} alt="" />
                      <div>
                        <div className="adm-strong">{p.name}</div>
                        <div className="adm-muted">{p.category}{p.badge === 'New' ? ' · New' : ''}{p.onDeal ? ` · On deal: ${money(p.price)}` : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="adm-price-cell">
                      <input
                        className="form-input adm-price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        aria-label={`Price of ${p.name}`}
                        value={priceDrafts[p.id] ?? (p.listPrice ?? p.price)}
                        onChange={(e) => setPriceDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && savePrice(p)}
                      />
                      {priceDrafts[p.id] !== undefined && Number(priceDrafts[p.id]) !== (p.listPrice ?? p.price) && (
                        <>
                          <button type="button" className="btn btn-primary btn-sm" onClick={() => savePrice(p)}>Save</button>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            aria-label="Undo price change"
                            onClick={() => setPriceDrafts((prev) => { const next = { ...prev }; delete next[p.id]; return next; })}
                          >
                            <X size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="adm-muted">{(p.listWasPrice ?? p.originalPrice) ? money(p.listWasPrice ?? p.originalPrice) : '—'}</td>
                  <td>
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
                    <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="adm-help">Change a price in the list, then press Save (or Enter). Out-of-stock products stay visible but can't be ordered.</p>

      {editing && (
        <Modal
          title={editing.id ? 'Edit product' : 'Add product'}
          onClose={() => !saving && setEditing(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="product-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save product'}</button>
            </>
          )}
        >
          <form id="product-form" onSubmit={save}>
            <Field label="Name"><input className="form-input" required maxLength={120} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Category">
              <select className="form-input" required value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                {!categories.some((c) => c.name === editing.category) && editing.category && <option value={editing.category}>{editing.category}</option>}
                {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <div className="form-row">
              <Field label="Price (GH₵)"><input className="form-input" type="number" min="0.01" step="0.01" required value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></Field>
              <Field label="Was price (GH₵)" hint="Optional. Shows a discount when higher than the price."><input className="form-input" type="number" min="0.01" step="0.01" value={editing.originalPrice} onChange={(e) => setEditing({ ...editing, originalPrice: e.target.value })} /></Field>
            </div>
            <div className="adm-checks">
              <label className="shop-check"><input type="checkbox" checked={editing.inStock} onChange={(e) => setEditing({ ...editing, inStock: e.target.checked })} /> In stock</label>
              <label className="shop-check"><input type="checkbox" checked={editing.isNew} onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })} /> Show "New" label</label>
            </div>
            <Field label="Photos" hint="The first photo is the main one. Up to 8."><PhotoManager photos={editing.photos} onChange={(photos) => setEditing({ ...editing, photos })} /></Field>
            <Field label="Description"><textarea className="form-input" rows={4} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></Field>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
const CategoriesTab = ({ categories, products, onCatalogChange }) => {
  const { showToast } = useStore();
  const [editing, setEditing] = useState(null); // { id?, name, photos }
  const [saving, setSaving] = useState(false);
  const countFor = (name) => products.filter((p) => p.category === name).length;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name: editing.name, image: editing.photos[0] || '' };
      if (editing.id) await admin.editCategory(editing.id, body);
      else await admin.addCategory(body);
      showToast(`Category "${editing.name}" saved`, 'success');
      setEditing(null);
      onCatalogChange();
    } catch (err) {
      showToast(err.message, 'error');
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

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{categories.length} categories</span>
        <button type="button" className="btn btn-primary" onClick={() => setEditing({ name: '', photos: [] })}><Plus size={16} /> Add category</button>
      </div>
      <div className="adm-cat-grid">
        {categories.map((c) => (
          <div key={c.id} className="adm-card adm-cat">
            {c.image ? <img src={sizedImage(c.image, 240)} alt="" /> : <div className="img-fallback" style={{ position: 'static', aspectRatio: '1' }}>No photo</div>}
            <div className="adm-strong">{c.name}</div>
            <div className="adm-muted">{countFor(c.name)} products</div>
            <div className="adm-row-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing({ id: c.id, name: c.name, photos: c.image ? [c.image] : [] })}>Edit</button>
              <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(c)} aria-label={`Delete ${c.name}`}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="adm-help">Renaming a category moves its products along with it. A category can only be deleted when no products use it.</p>

      {editing && (
        <Modal
          title={editing.id ? 'Edit category' : 'Add category'}
          onClose={() => !saving && setEditing(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="category-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
            </>
          )}
        >
          <form id="category-form" onSubmit={save}>
            <Field label="Name"><input className="form-input" required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
            <Field label="Photo"><PhotoManager single photos={editing.photos} onChange={(photos) => setEditing({ ...editing, photos })} /></Field>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
const PromoTab = ({ discounts, setDiscounts }) => {
  const { showToast } = useStore();
  const blank = { code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', expiresAt: '' };
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await admin.addDiscount({
        code: form.code.trim().toUpperCase(),
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
        expiresAt: form.expiresAt || null,
        isActive: true,
      });
      setDiscounts((prev) => [created, ...prev]);
      setForm(null);
      showToast(`Promo code ${created.code} created`, 'success');
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
    if (!window.confirm(`Delete promo code ${d.code}?`)) return;
    try {
      await admin.removeDiscount(d.id);
      setDiscounts((prev) => prev.filter((x) => x.id !== d.id));
      showToast(`${d.code} deleted`, 'info');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{discounts.length} promo codes</span>
        <button type="button" className="btn btn-primary" onClick={() => setForm(blank)}><Plus size={16} /> New promo code</button>
      </div>
      {discounts.length === 0 ? <Empty>No promo codes yet.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Code</th><th>Discount</th><th>Rules</th><th>Used</th><th>On</th><th /></tr></thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.id}>
                  <td><div className="adm-strong adm-code">{d.code}</div><div className="adm-muted">{d.description}</div></td>
                  <td>{d.type === 'PERCENTAGE' ? `${d.value}% off` : `${money(d.value)} off`}{d.maxDiscount ? <div className="adm-muted">max {money(d.maxDiscount)}</div> : null}</td>
                  <td className="adm-muted">
                    {d.minOrderAmount ? `Min order ${money(d.minOrderAmount)}` : 'Any order'}
                    {d.expiresAt ? <div>Ends {date(d.expiresAt)}</div> : null}
                  </td>
                  <td>{d.usedCount || 0}{d.usageLimit ? ` / ${d.usageLimit}` : ''}</td>
                  <td><label className="adm-switch"><input type="checkbox" checked={d.isActive} onChange={() => toggle(d)} /><span>{d.isActive ? 'On' : 'Off'}</span></label></td>
                  <td className="adm-row-actions"><button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(d)} aria-label={`Delete ${d.code}`}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal
          title="New promo code"
          onClose={() => !saving && setForm(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="promo-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create code'}</button>
            </>
          )}
        >
          <form id="promo-form" onSubmit={save}>
            <div className="form-row">
              <Field label="Code"><input className="form-input" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="e.g. EASTER15" /></Field>
              <Field label="Type">
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="PERCENTAGE">Percentage off</option>
                  <option value="FIXED">Fixed amount off (GH₵)</option>
                </select>
              </Field>
            </div>
            <div className="form-row">
              <Field label={form.type === 'PERCENTAGE' ? 'Percent off' : 'Amount off (GH₵)'}><input className="form-input" type="number" min="0.01" step="0.01" max={form.type === 'PERCENTAGE' ? 100 : undefined} required value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></Field>
              <Field label="Minimum order (GH₵)" hint="Optional"><input className="form-input" type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></Field>
            </div>
            <div className="form-row">
              <Field label="Most it can take off (GH₵)" hint="Optional, for % codes"><input className="form-input" type="number" min="0" step="0.01" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} /></Field>
              <Field label="How many times it can be used" hint="Optional"><input className="form-input" type="number" min="1" step="1" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></Field>
            </div>
            <div className="form-row">
              <Field label="Ends on" hint="Optional"><input className="form-input" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></Field>
              <Field label="Note for yourself" hint="Optional"><input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
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

const ShipmentsTab = ({ batches, setBatches }) => {
  const { showToast, refreshBatches } = useStore();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const afterChange = () => { if (refreshBatches) refreshBatches(); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isSea = form.type === 'SEA_FCL';
    const body = {
      batchNumber: form.batchNumber,
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
      setForm(null);
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

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">The newest shipment marked "Show on website" appears on the home page.</span>
        <button type="button" className="btn btn-primary" onClick={() => setForm({ ...blankBatch })}><Plus size={16} /> New shipment</button>
      </div>
      {batches.length === 0 ? <Empty>No shipments yet.</Empty> : (
        <div className="adm-list">
          {batches.map((b) => {
            const isSea = b.type === 'SEA_FCL';
            const cap = isSea ? b.capacityCbm : b.capacityKg;
            const used = isSea ? b.allocatedCbm : b.allocatedKg;
            const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : null;
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
                <div className="adm-order-grid">
                  <div><div className="adm-label">Route</div><div>{b.originPort} → {b.destinationPort}</div></div>
                  <div><div className="adm-label">Dates</div><div>Order cut-off: {b.cutoffDate || '—'}</div><div>Arrives: {b.eta || '—'}</div></div>
                  <div><div className="adm-label">Space used</div><div>{used ?? 0} / {cap ?? '—'} {isSea ? 'CBM' : 'kg'}{pct !== null ? ` (${pct}%)` : ''}</div><div className="adm-muted">{b.totalOrders || 0} orders</div></div>
                </div>
                <footer className="adm-card-actions">
                  <label className="adm-mini-field">
                    <span>Stage</span>
                    <select className="form-input" value={b.status} onChange={(e) => quick(b, { status: e.target.value }, `${b.batchNumber}: ${label(BATCH_STAGES, e.target.value)}`)}>
                      {BATCH_STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <button type="button" className="btn btn-outline" onClick={() => setForm(toForm(b))}>Edit</button>
                  <button type="button" className="btn btn-outline adm-danger" onClick={() => remove(b)}><Trash2 size={14} /> Delete</button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {form && (
        <Modal
          title={form.id ? 'Edit shipment' : 'New shipment'}
          onClose={() => !saving && setForm(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="batch-form" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save shipment'}</button>
            </>
          )}
        >
          <form id="batch-form" onSubmit={save}>
            <div className="form-row">
              <Field label="Shipment number"><input className="form-input" required value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} placeholder="e.g. CN-GH-2026-FCL05" /></Field>
              <Field label="Type">
                <select className="form-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="SEA_FCL">Sea</option>
                  <option value="AIR_CARGO">Air</option>
                </select>
              </Field>
            </div>
            <Field label="Shipping line / airline"><input className="form-input" required value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} /></Field>
            <div className="form-row">
              <Field label="From"><input className="form-input" value={form.originPort} onChange={(e) => setForm({ ...form, originPort: e.target.value })} /></Field>
              <Field label="To"><input className="form-input" value={form.destinationPort} onChange={(e) => setForm({ ...form, destinationPort: e.target.value })} /></Field>
            </div>
            <div className="form-row">
              <Field label="Last day to order"><input className="form-input" type="date" value={form.cutoffDate} onChange={(e) => setForm({ ...form, cutoffDate: e.target.value })} /></Field>
              <Field label="Expected arrival"><input className="form-input" type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} /></Field>
            </div>
            {form.type === 'SEA_FCL' ? (
              <div className="form-row">
                <Field label="Container space (CBM)"><input className="form-input" type="number" min="0" step="0.1" value={form.capacityCbm} onChange={(e) => setForm({ ...form, capacityCbm: e.target.value })} /></Field>
                <Field label="Space already used (CBM)"><input className="form-input" type="number" min="0" step="0.1" value={form.allocatedCbm} onChange={(e) => setForm({ ...form, allocatedCbm: e.target.value })} /></Field>
              </div>
            ) : (
              <div className="form-row">
                <Field label="Weight limit (kg)"><input className="form-input" type="number" min="0" step="1" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: e.target.value })} /></Field>
                <Field label="Weight already used (kg)"><input className="form-input" type="number" min="0" step="1" value={form.allocatedKg} onChange={(e) => setForm({ ...form, allocatedKg: e.target.value })} /></Field>
              </div>
            )}
            <div className="form-row">
              <Field label="Number of orders"><input className="form-input" type="number" min="0" step="1" value={form.totalOrders} onChange={(e) => setForm({ ...form, totalOrders: e.target.value })} /></Field>
              <Field label="Stage">
                <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {BATCH_STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </Field>
            </div>
            <label className="shop-check"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Show on website</label>
          </form>
        </Modal>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
const MessagesTab = ({ messages, setMessages }) => {
  const { showToast } = useStore();
  const [filter, setFilter] = useState('NEW');
  const shown = messages.filter((m) => filter === 'all' || (m.status || 'NEW') === filter);

  const setStatus = async (m, status) => {
    try {
      const updated = await admin.setMessageStatus(m.id, status);
      setMessages((prev) => prev.map((x) => (x.id === m.id ? updated : x)));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <>
      <div className="adm-toolbar">
        <div className="segmented segmented-inline" role="tablist">
          {[['NEW', 'New'], ['REPLIED', 'Replied'], ['CLOSED', 'Closed'], ['all', 'All']].map(([v, l]) => (
            <button key={v} type="button" role="tab" aria-selected={filter === v} className={filter === v ? 'active' : ''} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? <Empty>No messages here.</Empty> : (
        <div className="adm-list">
          {shown.map((m) => (
            <article key={m.id} className="adm-card">
              <header className="adm-card-head">
                <div><strong>{m.subject}</strong><span className="adm-muted"> · {date(m.createdAt)}</span></div>
                <select className="form-input adm-select" value={m.status || 'NEW'} onChange={(e) => setStatus(m, e.target.value)} aria-label="Message status">
                  {MESSAGE_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </header>
              <p className="adm-message">{m.message}</p>
              <footer className="adm-card-actions">
                <span className="adm-muted">{m.name} · {m.phone || 'no phone'}{m.email ? ` · ${m.email}` : ''}</span>
                {m.phone && (
                  <a className="btn btn-whatsapp btn-sm" target="_blank" rel="noreferrer" href={waLink(m.phone, `Hello ${m.name}, this is CHARI replying to your message.`)} onClick={() => (m.status || 'NEW') === 'NEW' && setStatus(m, 'REPLIED')}>
                    <MessageCircle size={14} /> Reply on WhatsApp
                  </a>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
const CustomersTab = ({ customers }) => {
  const [query, setQuery] = useState('');
  const shown = customers.filter((c) => [c.name, c.email, c.phone, c.city].some((v) => String(v || '').toLowerCase().includes(query.toLowerCase())));
  return (
    <>
      <div className="adm-toolbar">
        <div className="adm-search"><Search size={16} /><input placeholder="Search name, email, phone or city" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>
      {shown.length === 0 ? <Empty>No customers found.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Name</th><th>Contact</th><th>City</th><th>Joined</th><th>Orders</th><th>Invited</th><th>Store credit</th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td><div className="adm-strong">{c.name}</div>{c.role === 'ADMIN' && <div className="adm-muted">Admin</div>}</td>
                  <td><div>{c.email}</div><div className="adm-muted">{c.phone || '—'}</div></td>
                  <td>{c.city || '—'}</td>
                  <td>{date(c.createdAt)}</td>
                  <td>{c._count?.orders ?? 0}</td>
                  <td>{c._count?.referrals ?? 0}</td>
                  <td>{money(c.creditBalance)}</td>
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
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const normalPrice = (p) => p.listPrice ?? p.price;
  const live = products.filter((p) => p.onDeal).sort((a, b) => new Date(a.dealEndsAt) - new Date(b.dealEndsAt));

  const openForm = (preselect = []) => {
    const end = new Date(Date.now() + 7 * 86400000);
    setForm({
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
    setForm((f) => ({ ...f, endDate: toDateInput(d), endTime: '23:59' }));
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

  const save = async (e) => {
    e.preventDefault();
    const chosen = products.filter((p) => p.id in form.selected);
    if (!chosen.length) { showToast('Choose at least one product.', 'error'); return; }
    const items = chosen.map((p) => ({ productId: p.id, dealPrice: dealPriceFor(p) }));
    const bad = chosen.find((p, i) => !items[i].dealPrice || items[i].dealPrice >= normalPrice(p));
    if (bad) { showToast(`Deal price for "${bad.name}" must be below GH₵${normalPrice(bad).toFixed(2)}.`, 'error'); return; }
    const endsAt = new Date(`${form.endDate}T${form.endTime || '23:59'}`);
    setSaving(true);
    try {
      await admin.startDeals(endsAt.toISOString(), items);
      showToast(`${items.length} deal${items.length === 1 ? '' : 's'} live until ${dateTime(endsAt)}`, 'success');
      setForm(null);
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

  const toggle = (p) => setForm((f) => {
    const selected = { ...f.selected };
    if (p.id in selected) delete selected[p.id]; else selected[p.id] = '';
    return { ...f, selected };
  });

  const pickable = form ? products.filter((p) => p.inStock !== false && p.name.toLowerCase().includes(form.search.toLowerCase())) : [];
  const chosen = form ? products.filter((p) => p.id in form.selected) : [];

  return (
    <>
      <div className="adm-toolbar">
        <span className="adm-muted">{live.length ? `${live.length} deal${live.length === 1 ? '' : 's'} running` : 'No deals running'}</span>
        <button type="button" className="btn btn-primary" onClick={() => openForm()}><Plus size={16} /> New deal</button>
      </div>

      {live.length === 0 ? <Empty>No deals right now. Start one to show it on the home page with a countdown.</Empty> : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead><tr><th>Product</th><th>Normal price</th><th>Deal price</th><th>Ends</th><th /></tr></thead>
            <tbody>
              {live.map((p) => (
                <tr key={p.id}>
                  <td><div className="adm-product-cell"><img src={sizedImage(p.image, 96)} alt="" /><div className="adm-strong">{p.name}</div></div></td>
                  <td className="adm-muted">{money(normalPrice(p))}</td>
                  <td className="adm-strong">{money(p.price)} <span className="adm-muted">(−{Math.round((1 - p.price / normalPrice(p)) * 100)}%)</span></td>
                  <td>{dateTime(p.dealEndsAt)}</td>
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
          title="Deal"
          onClose={() => !saving && setForm(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="submit" form="deal-form" className="btn btn-primary" disabled={saving || chosen.length === 0}>
                {saving ? 'Saving…' : `Start deal${chosen.length > 1 ? `s (${chosen.length})` : ''}`}
              </button>
            </>
          )}
        >
          <form id="deal-form" onSubmit={save}>
            <Field label="1. Choose products">
              <div className="adm-search" style={{ marginBottom: 8 }}><Search size={16} /><input placeholder="Search products" value={form.search} onChange={(e) => setForm({ ...form, search: e.target.value })} /></div>
              <div className="adm-pick-list">
                {pickable.map((p) => (
                  <label key={p.id} className="adm-pick">
                    <input type="checkbox" checked={p.id in form.selected} onChange={() => toggle(p)} />
                    <span className="adm-pick-name">{p.name}</span>
                    <span className="adm-muted">{money(normalPrice(p))}</span>
                  </label>
                ))}
              </div>
            </Field>

            <div className="form-field">
              <span className="form-label">2. Discount</span>
              <div className="segmented" role="tablist" style={{ marginBottom: 10 }}>
                <button type="button" className={form.mode === 'percent' ? 'active' : ''} onClick={() => setForm({ ...form, mode: 'percent' })}>% off</button>
                <button type="button" className={form.mode === 'price' ? 'active' : ''} onClick={() => setForm({ ...form, mode: 'price' })}>Set each price</button>
              </div>
              {form.mode === 'percent' ? (
                <input className="form-input" type="number" min="1" max="95" step="1" value={form.percent} onChange={(e) => setForm({ ...form, percent: e.target.value })} aria-label="Percent off" />
              ) : chosen.length === 0 ? <p className="form-hint">Choose products first.</p> : (
                <div className="adm-pick-list">
                  {chosen.map((p) => (
                    <label key={p.id} className="adm-pick">
                      <span className="adm-pick-name">{p.name} <span className="adm-muted">(normal {money(normalPrice(p))})</span></span>
                      <input className="form-input adm-price" type="number" min="0.01" step="0.01" placeholder="Deal price" value={form.selected[p.id]} onChange={(e) => setForm({ ...form, selected: { ...form.selected, [p.id]: e.target.value } })} />
                    </label>
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
                <input className="form-input" type="date" required min={toDateInput(new Date())} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} aria-label="End date" />
                <input className="form-input" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} aria-label="End time" />
              </div>
            </div>

            {chosen.length > 0 && (
              <div className="adm-deal-preview">
                <div className="adm-label">Customers will see</div>
                {chosen.map((p) => {
                  const dp = dealPriceFor(p);
                  return (
                    <div key={p.id} className="adm-deal-row">
                      <span>{p.name}</span>
                      <span><s className="adm-muted">{money(normalPrice(p))}</s> <strong>{dp ? money(dp) : '—'}</strong></span>
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

const HuntTab = ({ discounts, products }) => {
  const { showToast, refreshHunt } = useStore();
  const [items, setItems] = useState(null);
  const [spots, setSpots] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    admin.getHunt()
      .then((data) => { setItems(data.items || []); setSpots(data.spots || {}); })
      .catch((err) => setError(err.message));
  }, []);

  const byCode = useMemo(() => new Map(discounts.map((d) => [d.code, d])), [discounts]);
  const productName = (spot) => products.find((p) => `product:${p.id}` === spot)?.name;
  const spotLabel = (spot) => (spot.startsWith('product:') ? `Inside product: ${productName(spot) || 'deleted product'}` : spots[spot] || spot);

  const update = (i, changes) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...changes } : it)));
    setDirty(true);
  };
  const add = () => {
    setItems((prev) => [...prev, { code: discounts.find(discountUsable)?.code || '', spot: 'home-hero', clue: '', active: true, finds: 0 }]);
    setDirty(true);
  };
  const remove = (i) => {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
    setDirty(true);
  };

  const save = async () => {
    if (items.some((it) => !it.code)) { showToast('Pick a promo code for every hidden spot', 'error'); return; }
    setSaving(true);
    try {
      const data = await admin.saveHunt(items);
      setItems(data.items);
      setDirty(false);
      refreshHunt();
      showToast('Treasure hunt saved — the gems are live on the site', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="form-error">{error}</div>;
  if (!items) return <Empty>Loading…</Empty>;

  return (
    <>
      <div className="adm-card adm-hunt-intro">
        <strong>How it works</strong>
        <p className="adm-muted">
          Promo codes are no longer shown to everyone. Hide a code somewhere on the site and a small gem appears there.
          When a customer taps the gem, they get the code. A gem disappears by itself when its code is switched off, runs out or expires.
          Create the codes first in <em>Promo codes</em> — tip: give hidden codes a usage limit so only the first finders get them.
        </p>
      </div>

      <div className="adm-toolbar">
        <span className="adm-muted">{items.length} hidden {items.length === 1 ? 'code' : 'codes'}</span>
        <div className="adm-inline">
          <button type="button" className="btn btn-outline" onClick={add} disabled={discounts.length === 0 || items.length >= 30}><Plus size={16} /> Hide a code</button>
          <button type="button" className="btn btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>

      {discounts.length === 0 && <Empty>Create a promo code first, then come back here to hide it.</Empty>}

      {items.length === 0 ? (
        discounts.length > 0 && <Empty>Nothing hidden yet. Tap “Hide a code” to start.</Empty>
      ) : (
        <div className="adm-hunt-list">
          {items.map((it, i) => {
            const d = byCode.get(it.code);
            const live = it.active && discountUsable(d);
            return (
              <div key={it.id || `new-${i}`} className="adm-card adm-hunt-item">
                <div className="form-row">
                  <Field label="Promo code">
                    <select className="form-input" value={it.code} onChange={(e) => update(i, { code: e.target.value })}>
                      <option value="">Choose a code…</option>
                      {discounts.map((dc) => (
                        <option key={dc.id} value={dc.code}>
                          {dc.code} — {dc.type === 'PERCENTAGE' ? `${dc.value}% off` : `${money(dc.value)} off`}{discountUsable(dc) ? '' : ' (not usable)'}
                        </option>
                      ))}
                    </select>
                  </Field>
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
                </div>
                <Field label="Hint (optional)" hint="Shown when someone hovers over the gem, e.g. “Look where the story begins”">
                  <input className="form-input" maxLength={140} value={it.clue || ''} onChange={(e) => update(i, { clue: e.target.value })} />
                </Field>
                <div className="adm-hunt-foot">
                  <label className="adm-switch"><input type="checkbox" checked={it.active !== false} onChange={() => update(i, { active: !(it.active !== false) })} /><span>{it.active !== false ? 'On' : 'Off'}</span></label>
                  <span className={live ? 'adm-pill adm-pill-ok' : 'adm-pill'}>{live ? 'Showing on the site' : d ? 'Hidden — code is off, used up or expired' : 'Not showing'}</span>
                  <span className="adm-muted">Found {it.finds || 0}×{d ? ` · code used ${d.usedCount || 0}×` : ''}</span>
                  <span className="adm-muted adm-hunt-where">{spotLabel(it.spot)}</span>
                  <button type="button" className="btn btn-outline btn-sm adm-danger" onClick={() => remove(i)} aria-label="Remove this hidden code"><Trash2 size={14} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {dirty && <p className="adm-muted" style={{ textAlign: 'right' }}>You have unsaved changes.</p>}
    </>
  );
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
const SettingsTab = () => {
  const { showToast, settings, refreshSettings } = useStore();
  const [form, setForm] = useState(() => ({ ...settings, announcementsText: (settings.announcements || []).join('\n') }));
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { announcementsText, ...rest } = form;
      await admin.saveSettings({
        phoneDisplay: rest.phoneDisplay,
        whatsappNumber: rest.whatsappNumber,
        momoNumber: rest.momoNumber,
        momoName: rest.momoName,
        email: rest.email,
        location: rest.location,
        pickupPoint: rest.pickupPoint,
        openingHours: rest.openingHours,
        announcements: announcementsText.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, 6),
      });
      await refreshSettings();
      showToast('Settings saved — the website is updated', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="adm-card adm-settings">
      <h3 className="adm-section-title">Contact details</h3>
      <div className="form-row">
        <Field label="Phone number shown on the site" hint="Shown in the footer and on the Contact page"><input className="form-input" required value={form.phoneDisplay} onChange={set('phoneDisplay')} /></Field>
        <Field label="WhatsApp number" hint="With country code, e.g. 233591440934"><input className="form-input" required inputMode="numeric" value={form.whatsappNumber} onChange={set('whatsappNumber')} /></Field>
      </div>
      <div className="form-row">
        <Field label="Email" hint="Leave empty to hide"><input className="form-input" type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Opening hours"><input className="form-input" value={form.openingHours} onChange={set('openingHours')} /></Field>
      </div>

      <h3 className="adm-section-title">Location</h3>
      <div className="form-row">
        <Field label="Business location" hint="e.g. Kumasi, Ghana"><input className="form-input" required value={form.location} onChange={set('location')} /></Field>
        <Field label="Pickup point" hint="Where customers collect orders, e.g. Adum, Kumasi"><input className="form-input" required value={form.pickupPoint} onChange={set('pickupPoint')} /></Field>
      </div>

      <h3 className="adm-section-title">Mobile Money</h3>
      <div className="form-row">
        <Field label="MoMo number customers pay to"><input className="form-input" required value={form.momoNumber} onChange={set('momoNumber')} /></Field>
        <Field label="MoMo account name"><input className="form-input" required value={form.momoName} onChange={set('momoName')} /></Field>
      </div>

      <h3 className="adm-section-title">Top banner messages</h3>
      <Field label="One message per line (up to 6)" hint="These rotate in the blue bar at the top of every page. A deals message is added automatically while a deal is running.">
        <textarea className="form-input" rows={4} value={form.announcementsText} onChange={set('announcementsText')} />
      </Field>

      <div className="adm-inline" style={{ justifyContent: 'flex-end' }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
      </div>
    </form>
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
  const [tab, setTab] = useState('orders');
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
    try {
      const [o, p, c, d, b, m, u] = await Promise.all([
        admin.listOrders(), admin.listProducts(), admin.listCategories(), admin.listDiscounts(),
        admin.listBatches(), admin.listMessages(), admin.listCustomers(),
      ]);
      setOrders(o); setProducts(p); setCategories(c); setDiscounts(d); setBatches(b); setMessages(m); setCustomers(u);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
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
      awaitingPayment: live.filter((o) => o.paymentStatus !== 'PAID' && o.paymentStatus !== 'REFUNDED').length,
      toShip: live.filter((o) => o.paymentStatus === 'PAID' && ['PROCESSING', 'CONFIRMED'].includes(o.orderStatus)).length,
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
          <button type="button" onClick={() => setTab('orders')}><strong>{stats.awaitingPayment}</strong><span>Waiting for payment</span></button>
          <button type="button" onClick={() => setTab('orders')}><strong>{stats.toShip}</strong><span>Paid, not yet shipped</span></button>
          <div><strong>{money(stats.paidSales)}</strong><span>Paid sales (all time)</span></div>
          <button type="button" onClick={() => setTab('messages')}><strong>{stats.newMessages}</strong><span>New messages</span></button>
        </div>

        <nav className="adm-tabs" aria-label="Admin sections">
          {TABS.map(([id, text]) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
              {text}{counts[id] ? <span className="adm-count">{counts[id]}</span> : null}
            </button>
          ))}
        </nav>

        {loadError ? (
          <div className="form-error">{loadError} <button type="button" className="shop-link-btn" onClick={load}>Try again</button></div>
        ) : loading ? (
          <Empty>Loading…</Empty>
        ) : (
          <div className="adm-panel">
            {tab === 'orders' && <OrdersTab orders={orders} setOrders={setOrders} />}
            {tab === 'products' && <ProductsTab products={products} setProducts={setProducts} categories={categories} onCatalogChange={onCatalogChange} />}
            {tab === 'categories' && <CategoriesTab categories={categories} products={products} onCatalogChange={onCatalogChange} />}
            {tab === 'promos' && <PromoTab discounts={discounts} setDiscounts={setDiscounts} />}
            {tab === 'hunt' && <HuntTab discounts={discounts} products={products} />}
            {tab === 'shipments' && <ShipmentsTab batches={batches} setBatches={setBatches} />}
            {tab === 'messages' && <MessagesTab messages={messages} setMessages={setMessages} />}
            {tab === 'customers' && <CustomersTab customers={customers} />}
            {tab === 'deals' && <DealsTab products={products} onCatalogChange={onCatalogChange} />}
            {tab === 'settings' && <SettingsTab />}
          </div>
        )}
      </div>
    </div>
  );
};
