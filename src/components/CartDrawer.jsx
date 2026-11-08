import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { SmartImage } from './SmartImage';
import { getFoundCodes } from '../utils/hunt';
import { validateDiscountCode } from '../services/api';
import { lineIdOf, optionsLabel } from '../utils/options';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag, Check, AlertTriangle, Lock, Truck } from 'lucide-react';

const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
// The applied promo code survives closing the cart (for this browser tab).
const PROMO_KEY = 'chari_cart_promo';
const readSavedPromo = () => { try { return sessionStorage.getItem(PROMO_KEY) || ''; } catch { return ''; } };
const savePromo = (code) => { try { if (code) sessionStorage.setItem(PROMO_KEY, code); else sessionStorage.removeItem(PROMO_KEY); } catch {} };

export const CartDrawer = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    emptyCartWithUndo,
    cartSubtotal,
    navigate,
    setSelectedProduct
  } = useStore();
  const foundCodes = cartDrawerOpen ? getFoundCodes() : [];

  const [promoInput, setPromoInput] = useState('');
  const [promoCode, setPromoCode] = useState(readSavedPromo); // the code the shopper applied
  const [promo, setPromo] = useState(null); // { code, amount, label } — as worked out by the server
  const [promoNote, setPromoNote] = useState(''); // why the code isn't giving a discount right now
  const [checking, setChecking] = useState(false);
  const [inputError, setInputError] = useState('');
  const requestId = useRef(0);

  // The server works out the discount (with its minimum order and maximum caps) and is asked
  // again whenever the cart total changes, so the number here always matches checkout.
  useEffect(() => {
    if (!promoCode || cart.length === 0) { setPromo(null); setPromoNote(''); return undefined; }
    const id = ++requestId.current;
    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await validateDiscountCode(promoCode, cartSubtotal);
        if (id !== requestId.current) return;
        setPromo({
          code: res.code,
          amount: res.discountAmount,
          label: res.type === 'PERCENTAGE' ? `${res.value}% off` : `${money(res.value)} off`,
        });
        setPromoNote('');
      } catch (err) {
        if (id !== requestId.current) return;
        setPromo(null);
        setPromoNote(err.message || 'This code can’t be used right now.');
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [promoCode, cartSubtotal, cart.length]);

  if (!cartDrawerOpen) return null;
  const close = () => setCartDrawerOpen(false);

  const applyPromo = (e) => {
    e.preventDefault();
    const code = promoInput.trim().toUpperCase();
    if (!code) { setInputError('Enter a promo code.'); return; }
    setInputError('');
    setPromoCode(code);
    savePromo(code);
    setPromoInput('');
  };

  const removePromo = () => {
    setPromoCode('');
    savePromo('');
    setPromo(null);
    setPromoNote('');
  };

  const discountAmount = promo ? Math.min(promo.amount, cartSubtotal) : 0;
  const total = Math.max(0, cartSubtotal - discountAmount);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  // What shoppers save versus the "was" prices on the products themselves.
  const productSavings = cart.reduce((sum, item) => {
    const was = Number(item.product.originalPrice);
    return was > item.unitPrice ? sum + (was - item.unitPrice) * item.quantity : sum;
  }, 0);
  const unavailable = cart.filter((item) => item.product.inStock === false);

  const goToCheckout = () => {
    close();
    navigate('checkout', promo ? { discountAmount, appliedPromo: promo.code } : {});
  };

  const openProduct = (product) => { close(); setSelectedProduct(product); };

  return (
    <>
      <div className="drawer-overlay" onClick={close} />
      <aside className="cart-drawer cd" role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <header className="cd-head">
          <h2 id="cd-title"><ShoppingBag size={20} /> Your cart {itemCount > 0 && <span className="cd-count">{itemCount}</span>}</h2>
          <button type="button" className="cd-close" onClick={close} aria-label="Close cart"><X size={20} /></button>
        </header>

        <div className="cd-body">
          {cart.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><ShoppingBag size={34} /></div>
              <h3>Your cart is empty</h3>
              <p>Browse the shop and add what you like — or ask us to find something for you.</p>
              <button type="button" className="btn btn-primary" onClick={() => { close(); navigate('shop'); }}>
                Start shopping <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {unavailable.length > 0 && (
                <div className="cd-alert" role="alert">
                  <AlertTriangle size={16} />
                  <span>{unavailable.length === 1 ? 'One item is' : `${unavailable.length} items are`} out of stock. Remove {unavailable.length === 1 ? 'it' : 'them'} to check out.</span>
                </div>
              )}

              <ul className="cd-items">
                {cart.map((item) => {
                  const p = item.product;
                  const out = p.inStock === false;
                  const was = Number(p.originalPrice);
                  const line = lineIdOf(item);
                  return (
                    <li key={line} className={`cd-item ${out ? 'is-out' : ''}`}>
                      <button type="button" className="cd-thumb-btn" onClick={() => openProduct(p)} aria-label={`View ${p.name}`}>
                        <SmartImage src={sizedImage(p.images?.[0] || p.image || '', 160)} alt="" className="cart-thumb cd-thumb" />
                      </button>
                      <div className="cd-item-main">
                        <div className="cd-item-top">
                          <button type="button" className="cd-item-name" onClick={() => openProduct(p)}>{p.name}</button>
                          <button type="button" className="cd-remove" onClick={() => removeFromCart(line)} aria-label={`Remove ${p.name}`} title="Remove"><Trash2 size={16} /></button>
                        </div>
                        {item.options && <span className="cd-item-options">{optionsLabel(item.options)}</span>}
                        <div className="cd-item-price">
                          {money(item.unitPrice)} each
                          {was > item.unitPrice && <s>{money(was)}</s>}
                          {out && <span className="cd-out">Out of stock</span>}
                        </div>
                        <div className="cd-item-bottom">
                          <div className="cd-qty" role="group" aria-label={`Quantity of ${p.name}`}>
                            {item.quantity > 1 ? (
                              <button type="button" onClick={() => updateCartQuantity(line, item.quantity - 1)} aria-label="One less"><Minus size={16} /></button>
                            ) : (
                              // At 1, the left button removes the item (with Undo) instead of silently deleting it.
                              <button type="button" onClick={() => removeFromCart(line)} aria-label={`Remove ${p.name}`} className="is-remove"><Trash2 size={15} /></button>
                            )}
                            <span aria-live="polite">{item.quantity}</span>
                            <button type="button" onClick={() => updateCartQuantity(line, Math.min(999, item.quantity + 1))} aria-label="One more" disabled={out}><Plus size={16} /></button>
                          </div>
                          <strong className="cd-line-total">{money(item.total)}</strong>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Promo code */}
              <section className="cd-promo" aria-label="Promo code">
                {promoCode ? (
                  <div className={`cd-promo-applied ${promo ? 'is-ok' : promoNote ? 'is-warn' : ''}`}>
                    <span className="cd-promo-icon">{promo ? <Check size={16} /> : <Tag size={16} />}</span>
                    <span className="cd-promo-text">
                      <strong>{promoCode}</strong>
                      <small>
                        {checking ? 'Checking…' : promo ? `${promo.label} · you save ${money(discountAmount)}` : promoNote}
                      </small>
                    </span>
                    <button type="button" onClick={removePromo} aria-label={`Remove code ${promoCode}`}><X size={16} /></button>
                  </div>
                ) : (
                  <>
                    <form className="cd-promo-form" onSubmit={applyPromo}>
                      <Tag size={16} aria-hidden="true" />
                      <input
                        type="text"
                        placeholder="Promo code"
                        aria-label="Promo code"
                        autoCapitalize="characters"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setInputError(''); }}
                      />
                      <button type="submit" className="btn btn-dark btn-sm">Apply</button>
                    </form>
                    {inputError && <span className="cd-input-error" role="alert">{inputError}</span>}
                    {/* Only codes this shopper found in the treasure hunt — never a public list */}
                    {foundCodes.length > 0 ? (
                      <div className="cd-found">
                        <span>Codes you found:</span>
                        {foundCodes.map((coupon) => (
                          <button key={coupon.code} type="button" onClick={() => { setPromoCode(coupon.code); savePromo(coupon.code); }} title={coupon.offer}>
                            {coupon.code} · {coupon.offer}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="cd-hint">No code? Some are hidden around the site — keep an eye out.</p>
                    )}
                  </>
                )}
              </section>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="cd-foot">
            <dl className="cd-totals">
              <div><dt>Items ({itemCount})</dt><dd>{money(cartSubtotal)}</dd></div>
              {discountAmount > 0 && <div className="is-saving"><dt>Promo {promo.code}</dt><dd>−{money(discountAmount)}</dd></div>}
              <div className="cd-delivery"><dt><Truck size={14} /> Shipping</dt><dd>We confirm it after you order</dd></div>
              <div className="cd-grand"><dt>Total</dt><dd>{money(total)}</dd></div>
            </dl>
            {(productSavings + discountAmount) > 0 && (
              <p className="cd-savings">You're saving {money(productSavings + discountAmount)} on this order</p>
            )}
            <button type="button" className="btn btn-primary btn-block cd-checkout" onClick={goToCheckout} disabled={unavailable.length > 0 || checking}>
              <Lock size={16} /> Checkout · {money(total)}
            </button>
            <div className="cd-foot-links">
              <button type="button" onClick={() => { close(); navigate('shop'); }}>Keep shopping</button>
              <button type="button" onClick={emptyCartWithUndo}>Empty cart</button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
};
