import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  X,
  Gift,
  Copy,
  Check,
  MessageCircle,
  Share2,
  Users,
  Wallet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const ReferralModal = () => {
  const {
    referralModalOpen,
    setReferralModalOpen,
    referralCode,
    referralWallet,
    referralStats,
    applyReferralCreditToCart,
    showToast,
    user
  } = useStore();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!referralModalOpen) return null;

  const shareLink = `https://chari.com/?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    showToast(`Referral code "${referralCode}" copied to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showToast('Referral invitation link copied!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Check out CHARI for direct-imported home appliances, electronics, fashion & mannequins in Ghana.\n\nUse my personal referral code *${referralCode}* at checkout to get *GH₵25 OFF* your first purchase!\n\nShop here: ${shareLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => setReferralModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="modal-content-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 0
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setReferralModalOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'background-color 0.2s ease'
          }}
        >
          <X size={18} />
        </button>

        {/* Hero Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #ea580c 100%)',
            padding: '36px 28px 28px',
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.78rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '14px',
              color: '#ffffff'
            }}
          >
            <Gift size={14} color="#ffffff" />
            CHARI Rewards Program
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
            Give GH₵25, Get GH₵25
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            Invite your friends to shop quality imports on CHARI. They get <strong style={{ color: '#fff' }}>GH₵25 OFF</strong> their first order, and you earn <strong style={{ color: '#D4AF37' }}>GH₵25 Store Credit</strong>!
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* Referral Code Box */}
          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Your Unique Referral Code
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'var(--accent-subtle)',
                border: '2px dashed rgba(212, 175, 55, 0.4)',
                borderRadius: '12px',
                padding: '8px 12px 8px 18px',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.1em' }}>
                {referralCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="btn btn-sm"
                style={{
                  backgroundColor: copiedCode ? '#10b981' : '#D4AF37',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Instant Share Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            <button
              onClick={handleShareWhatsApp}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#25D366',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)'
              }}
            >
              <MessageCircle size={18} />
              Share on WhatsApp
            </button>

            <button
              onClick={handleCopyLink}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                backgroundColor: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {copiedLink ? <Check size={18} color="#10b981" /> : <Share2 size={18} />}
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Referral Wallet & Stats */}
          <div
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '18px',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wallet size={18} color="#D4AF37" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                  Your CHARI Rewards Wallet
                </span>
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                <span style={{ fontSize: '0.9rem', color: '#D4AF37' }}>GH₵ </span>
                {referralWallet.toFixed(2)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Users size={16} color="#6366f1" />
                <span>Invites sent: <strong style={{ color: '#0f172a' }}>{referralStats.invites}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Gift size={16} color="#10b981" />
                <span>Completed orders: <strong style={{ color: '#0f172a' }}>{referralStats.completedOrders}</strong></span>
              </div>
            </div>

            {referralWallet > 0 && (
              <button
                onClick={() => {
                  applyReferralCreditToCart();
                  setReferralModalOpen(false);
                }}
                className="btn btn-sm"
                style={{
                  width: '100%',
                  marginTop: '14px',
                  backgroundColor: 'var(--accent)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                Apply GH₵{referralWallet.toFixed(2)} to Current Cart <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* How It Works Steps */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              How It Works
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#B8860B', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  1
                </div>
                <span>Send your link or code to friends, family, or business partners.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#B8860B', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  2
                </div>
                <span>They enter your code at checkout and receive an instant <strong>GH₵25 discount</strong>.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#B8860B', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  3
                </div>
                <span>Once their delivery is dispatched, <strong>GH₵25</strong> is credited to your CHARI wallet automatically!</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
