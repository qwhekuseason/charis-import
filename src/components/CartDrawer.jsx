import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { sizedImage } from '../utils/images';
import { validateDiscountCode } from '../services/api';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  Tag,
  Loader2,
  Lock,
  Anchor,
  Boxes
} from 'lucide-react';

export const CartDrawer = () => {
  const {
    cart,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartSubtotal,
    navigate,
    showToast,
    availableCoupons,
    fxRates,
    activeContainerBatch
  } = useStore();

  const [promoCode, setPromoCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState(null); // { code, type, value, amount }
  const [validatingPromo, setValidatingPromo] = useState(false);

  if (!cartDrawerOpen) return null;

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    setValidatingPromo(true);
    try {
      const res = await validateDiscountCode(code, cartSubtotal);
      if (res.valid) {
        setDiscountInfo({
          code: res.code,
          type: res.type,
          value: res.value,
          amount: res.discountAmount
        });
        showToast(res.message || `Coupon "${res.code}" applied!`, 'success');
        setPromoCode('');
      }
    } catch (err) {
      showToast(err.message || 'Invalid promo code', 'error');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscountInfo(null);
    showToast('Promo code removed', 'info');
  };

  const discountAmount = discountInfo
    ? discountInfo.type === 'PERCENTAGE'
      ? (cartSubtotal * discountInfo.value) / 100
      : Math.min(discountInfo.value || 0, cartSubtotal)
    : 0;
  const grandTotal = Math.max(0, cartSubtotal - discountAmount);

  const totalCbm = cart.reduce((sum, item) => sum + (item.product.cbm || 0.035) * item.quantity, 0);
  const totalWeight = cart.reduce((sum, item) => sum + (item.product.weightKg || 2.5) * item.quantity, 0);
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    navigate('checkout', { discountAmount, appliedPromo: discountInfo?.code || '' });
  };

  return (
    <>
      <div className="drawer-overlay" onClick={() => setCartDrawerOpen(false)} />
      <div
        className="cart-drawer glass-panel"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-primary)',
          borderLeft: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          className="drawer-header"
          style={{
            borderBottom: '1px solid var(--border-light)',
            backgroundColor: 'var(--bg-card)'
          }}
        >
          <div className="drawer-title" style={{ color: 'var(--text-primary)' }}>
            <ShoppingBag size={22} color="#2563eb" />
            <span>Your cart ({totalItemCount})</span>
          </div>
          <button
            onClick={() => setCartDrawerOpen(false)}
            style={{
              padding: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-main)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-light)',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="drawer-body" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {cart.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--text-secondary)'
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                  color: '#2563eb'
                }}
              >
                <ShoppingBag size={40} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 800 }}>
                Your cart is empty
              </h3>
              <p style={{ fontSize: '0.88rem', marginBottom: '24px', color: 'var(--text-secondary)' }}>
                Browse our products and add what you like.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setCartDrawerOpen(false);
                  navigate('shop');
                }}
              >
                Start shopping
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="glass-panel"
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '14px',
                    border: '1px solid var(--border-light)',
                    position: 'relative'
                  }}
                >
                  <img
                    src={sizedImage(item.product.images?.[0] || item.product.image || '', 160)}
                    alt={item.product.name}
                    style={{
                      width: '74px',
                      height: '74px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1px solid var(--border-light)'
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: 0
                        }}
                      >
                        {item.product.name}
                      </h4>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        style={{ color: 'var(--text-muted)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-secondary)',
                        margin: '4px 0'
                      }}
                    >
                      GH₵{item.unitPrice.toFixed(2)} each
                    </div>

                    {/* Stepper & Total */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '8px'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: 'var(--bg-main)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '8px',
                          padding: '3px 6px'
                        }}
                      >
                        <button
                          onClick={() => {
                            updateCartQuantity(item.product.id, item.quantity - 1);
                          }}
                          style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Minus size={13} />
                        </button>
                        <span
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            minWidth: '24px',
                            textAlign: 'center',
                            color: 'var(--text-primary)'
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity + 1)
                          }
                          style={{ color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div
                        style={{
                          fontSize: '1rem',
                          fontWeight: 900,
                          color: 'var(--text-primary)'
                        }}
                      >
                        <span className="currency-ghc">GH₵</span>
                        {item.total.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Package Summary */}
              <div
                className="glass-panel"
                style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  
                  <span>Items: <strong>{totalItemCount}</strong></span>
                </div>
                <div>
                  <span>Approx. weight: <strong style={{ color: 'var(--text-primary)' }}>{totalWeight.toFixed(1)} kg</strong></span>
                </div>
              </div>

              {/* Promo code box */}
              <div
                className="glass-panel"
                style={{
                  marginTop: '4px',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <form
                  onSubmit={handleApplyPromo}
                  style={{ display: 'flex', gap: '8px' }}
                >
                  <input
                    type="text"
                    placeholder="Enter promo coupon"
                    value={promoCode}
                    disabled={validatingPromo}
                    onChange={(e) => setPromoCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      textTransform: 'uppercase',
                      fontWeight: 700
                    }}
                  />
                  <button
                    type="submit"
                    disabled={validatingPromo || !promoCode.trim()}
                    className="btn btn-dark btn-sm"
                    style={{ minWidth: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                  >
                    {validatingPromo ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                  </button>
                </form>

                {/* Available Promo Chips */}
                {!discountInfo && availableCoupons && availableCoupons.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                      Active Coupons:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {availableCoupons.map((coupon) => (
                        <button
                          key={coupon.code}
                          type="button"
                          onClick={() => setPromoCode(coupon.code)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            border: '1px dashed #2563eb',
                            borderRadius: '6px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            cursor: 'pointer'
                          }}
                          title={coupon.description}
                        >
                           {coupon.code} • {coupon.badge}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {discountInfo && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.8rem',
                      color: '#10b981',
                      fontWeight: 600,
                      marginTop: '8px',
                      padding: '6px 10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      borderRadius: '8px',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      
                      <span>
                        Coupon <strong>{discountInfo.code}</strong> applied (
                        {discountInfo.type === 'PERCENTAGE'
                          ? `${discountInfo.value}% OFF`
                          : `GH₵${discountInfo.value} OFF`}
                        )
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePromo}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0 4px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            className="drawer-footer"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-light)',
              padding: '16px 20px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              <span>Subtotal:</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                GH₵{cartSubtotal.toFixed(2)}
              </span>
            </div>

            {discountAmount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.88rem',
                  color: '#10b981',
                  marginBottom: '6px'
                }}
              >
                <span>
                  Discount ({discountInfo?.code}):
                </span>
                <span style={{ fontWeight: 700 }}>
                  - GH₵{discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.3rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                paddingTop: '10px',
                borderTop: '1px dashed var(--border-light)',
                marginBottom: '16px'
              }}
            >
              <span>Landed Total:</span>
              <span style={{ color: '#2563eb' }}>
                <span className="currency-ghc">GH₵</span>
                {grandTotal.toFixed(2)}
              </span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '8px', borderRadius: '12px', padding: '12px' }}
              onClick={handleProceedToCheckout}
            >
              Go to checkout <ArrowRight size={18} />
            </button>

            <button
              onClick={clearCart}
              style={{
                width: '100%',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '4px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Clear Bag
            </button>
          </div>
        )}
      </div>
    </>
  );
};
