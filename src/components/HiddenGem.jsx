import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Gem, X, Copy, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { claimHiddenCode } from '../services/api';
import { hasFound, saveFoundCode } from '../utils/hunt';

// A small gem hidden at a spot on the site. If the admin hid a promo code here,
// the gem appears; tapping it reveals the code. Nothing renders otherwise.
export const HiddenGem = ({ spot, className = '', style }) => {
  const { huntSpots, refreshHunt, showToast } = useStore();
  const [found, setFound] = useState(null);
  const [opening, setOpening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  const item = (huntSpots || []).find((h) => h.spot === spot && !hasFound(h.id));
  if (!item && !found) return null;

  const open = async () => {
    if (opening || !item) return;
    setOpening(true);
    try {
      const data = await claimHiddenCode(item.id);
      saveFoundCode({ huntId: item.id, code: data.code, offer: data.offer, expiresAt: data.expiresAt || null });
      setFound(data);
    } catch (err) {
      showToast(err.message, 'error');
      refreshHunt();
    } finally {
      setOpening(false);
    }
  };

  const close = () => {
    setFound(null);
    setCopied(false);
    setTick((t) => t + 1);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(found.code);
      setCopied(true);
    } catch {
      showToast(`Your code is ${found.code}`, 'info');
    }
  };

  const conditions = [];
  if (found?.minOrderAmount > 0) conditions.push(`For orders of GH₵${Number(found.minOrderAmount).toFixed(2)} or more`);
  if (found?.maxDiscount) conditions.push(`Saves up to GH₵${Number(found.maxDiscount).toFixed(2)}`);
  if (found?.expiresAt) conditions.push(`Use it before ${new Date(found.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);

  return (
    <>
      {item && !found && (
        <button
          type="button"
          className={`hidden-gem ${className}`}
          style={style}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          aria-label="You found something hidden — tap to open"
          title={item.clue || 'Tap to open'}
          disabled={opening}
        >
          <Gem size={16} />
        </button>
      )}

      {found && createPortal(
        <div className="modal-overlay" onClick={close}>
          <div className="gem-reveal" role="dialog" aria-label="You found a promo code" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="gem-reveal-close" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
            <div className="gem-reveal-icon"><Gem size={26} /></div>
            <h3>You found a hidden code!</h3>
            <p className="gem-reveal-offer">{found.offer} your order</p>
            <div className="gem-reveal-code">
              <span>{found.code}</span>
              <button type="button" onClick={copy} className="btn btn-dark btn-sm">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            {conditions.length > 0 && (
              <ul className="gem-reveal-terms">
                {conditions.map((c) => <li key={c}>{c}</li>)}
              </ul>
            )}
            <p className="gem-reveal-hint">Enter it in your cart or at checkout. We’ve saved it in your cart for you.</p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default HiddenGem;
