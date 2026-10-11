import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { X, Copy, Check, MessageCircle, Gift } from 'lucide-react';

const HISTORY_LABELS = {
  REFERRAL_REWARD: 'Friend’s order paid',
  ORDER_PAYMENT: 'Used on an order',
  ORDER_REFUND: 'Returned from a cancelled order',
};

export const ReferralModal = () => {
  const { setReferralModalOpen, user, openAuth, referralInfo, refreshReferrals, showToast } = useStore();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    refreshReferrals().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const close = () => setReferralModalOpen(false);
  const reward = referralInfo?.rewardAmount ?? 25;
  const welcome = referralInfo?.welcomeDiscount ?? 25;
  const shareLink = referralInfo ? `${window.location.origin}/?ref=${referralInfo.referralCode}` : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(shareLink, 'info');
    }
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `I shop on CHARI for quality items delivered anywhere in Ghana. Sign up with my link and get GH₵${welcome} off your first order:\n${shareLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener');
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="referral-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 id="referral-title" className="modal-title">Invite friends, earn GH₵{reward}</h2>
            <p className="modal-subtitle">
              Your friend gets GH₵{welcome} off their first order. You get GH₵{reward} store credit when they pay.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={close} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {!user ? (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <Gift size={36} color="var(--accent)" style={{ marginBottom: '10px' }} />
              <p style={{ color: 'var(--text-secondary)', margin: '0 0 18px' }}>
                Sign in or create a free account to get your personal invite link.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={() => { close(); openAuth('register'); }}>
                  Create account
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { close(); openAuth('login'); }}>
                  Sign in
                </button>
              </div>
            </div>
          ) : loading && !referralInfo ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</p>
          ) : !referralInfo ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              We couldn’t load your invite link. Please try again in a moment.
            </p>
          ) : (
            <>
              <div className="referral-balance">
                <span>Your store credit</span>
                <strong>GH₵{referralInfo.creditBalance.toFixed(2)}</strong>
                <small>You can use it at checkout.</small>
              </div>

              <label className="form-label" htmlFor="referral-link">Your invite link</label>
              <div className="referral-link-row">
                <input id="referral-link" className="form-input" readOnly value={shareLink} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn btn-outline" onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="form-hint">Or share your code: <strong>{referralInfo.referralCode}</strong></p>

              <button type="button" className="btn btn-whatsapp" style={{ width: '100%', margin: '14px 0 20px' }} onClick={shareOnWhatsApp}>
                <MessageCircle size={18} /> Share on WhatsApp
              </button>

              <div className="referral-stats">
                <div><strong>{referralInfo.invitedCount}</strong><span>friends joined</span></div>
                <div><strong>{referralInfo.rewardedCount}</strong><span>rewards earned</span></div>
              </div>

              {referralInfo.history.length > 0 && (
                <div style={{ marginTop: '18px' }}>
                  <h3 className="form-label" style={{ marginBottom: '8px' }}>Credit history</h3>
                  <ul className="referral-history">
                    {referralInfo.history.map((item) => (
                      <li key={item.id}>
                        <span>
                          {HISTORY_LABELS[item.type] || item.type}
                          <small>{new Date(item.createdAt).toLocaleDateString('en-GB')}</small>
                        </span>
                        <strong style={{ color: item.amount > 0 ? '#059669' : 'var(--text-primary)' }}>
                          {item.amount > 0 ? '+' : '−'}GH₵{Math.abs(item.amount).toFixed(2)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="referral-steps">
                <h3 className="form-label">How it works</h3>
                <ol>
                  <li>Send your link to a friend.</li>
                  <li>They create an account with it and get GH₵{welcome} off their first order.</li>
                  <li>When we confirm their payment, GH₵{reward} is added to your store credit.</li>
                </ol>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
