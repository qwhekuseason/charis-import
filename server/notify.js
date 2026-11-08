import 'dotenv/config'; // this file reads its keys when loaded, before index.js runs dotenv
import webpush from 'web-push';
import nodemailer from 'nodemailer';

// ---------------------------------------------------------------------------
// Admin phone alerts (web push) and customer emails.
// Both are optional: if the keys aren't set, the shop works exactly the same, just without them.
//
//   VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY  → phone alerts   (create with: npm run push-keys)
//   BREVO_API_KEY + MAIL_FROM             → customer emails over HTTPS (works on Render's free plan,
//                                           which blocks the ports normal email servers use)
//   SMTP_URL + MAIL_FROM                  → customer emails over SMTP (Gmail app password etc. —
//                                           only on hosts that allow outgoing SMTP)
// ---------------------------------------------------------------------------

// The shop customers use — links in emails (track order, reset password) open here.
const SITE_URL = (process.env.SITE_URL || 'https://charis-import.vercel.app').replace(/\/$/, '');

export const pushEnabled = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
if (pushEnabled) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:princessarmah514@gmail.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}
export const pushPublicKey = () => (pushEnabled ? process.env.VAPID_PUBLIC_KEY : null);

const BREVO_API_KEY = (process.env.BREVO_API_KEY || '').trim();
let mailer = null;
if (!BREVO_API_KEY && process.env.SMTP_URL) {
  try {
    const url = new URL(process.env.SMTP_URL);
    const secure = url.protocol === 'smtps:';
    mailer = nodemailer.createTransport({
      host: url.hostname,
      port: Number(url.port) || (secure ? 465 : 587),
      secure,
      auth: url.username ? { user: decodeURIComponent(url.username), pass: decodeURIComponent(url.password) } : undefined,
      // Give up quickly instead of hanging for minutes when the host blocks email ports.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } catch (err) {
    console.error('⚠️  SMTP_URL is not valid — customer emails are off:', err.message);
  }
}
export const emailEnabled = Boolean(BREVO_API_KEY || mailer);
const MAIL_FROM = process.env.MAIL_FROM || 'CHARI <princessarmah514@gmail.com>';
// "CHARI <name@gmail.com>" → { name: 'CHARI', email: 'name@gmail.com' }
const fromParts = (() => {
  const m = /^\s*"?([^"<]*?)"?\s*<\s*([^>\s]+)\s*>\s*$/.exec(MAIL_FROM);
  return m ? { name: m[1] || 'CHARI', email: m[2] } : { name: 'CHARI', email: MAIL_FROM.trim() };
})();

console.log(pushEnabled ? '🔔 Admin phone alerts are on' : '🔕 Admin phone alerts off (set VAPID keys to turn on)');
console.log(BREVO_API_KEY ? '📧 Customer emails are on (Brevo)'
  : mailer ? '📧 Customer emails are on (SMTP)'
    : '📭 Customer emails off (set BREVO_API_KEY or SMTP_URL to turn on)');

// ---------------------------------------------------------------------------
// Push subscriptions — one per admin device, kept in StoreSetting 'adminPushSubscriptions'
// ---------------------------------------------------------------------------
const SUBS_KEY = 'adminPushSubscriptions';

export const createNotifier = (prisma) => {
  const loadSubs = async () => {
    const row = await prisma.storeSetting.findUnique({ where: { key: SUBS_KEY } });
    return Array.isArray(row?.value) ? row.value : [];
  };
  const saveSubs = (subs) =>
    prisma.storeSetting.upsert({ where: { key: SUBS_KEY }, update: { value: subs }, create: { key: SUBS_KEY, value: subs } });

  const addSubscription = async (subscription, user, deviceName) => {
    const subs = (await loadSubs()).filter((s) => s.endpoint !== subscription.endpoint);
    subs.push({
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      userId: user.id,
      userName: user.name,
      device: String(deviceName || 'Device').slice(0, 60),
      addedAt: new Date().toISOString(),
    });
    await saveSubs(subs.slice(-20));
  };

  const removeSubscription = async (endpoint) => {
    const subs = await loadSubs();
    await saveSubs(subs.filter((s) => s.endpoint !== endpoint));
  };

  const listDevices = async () => (await loadSubs()).map(({ endpoint, device, userName, addedAt }) => ({ endpoint, device, userName, addedAt }));

  // Never throws — a failed alert must not break placing an order.
  const alertAdmins = async ({ title, body, url = '/#/admin', tag }) => {
    if (!pushEnabled) return { sent: 0 };
    let subs;
    try {
      subs = await loadSubs();
    } catch {
      return { sent: 0 };
    }
    const payload = JSON.stringify({ title, body, url, tag });
    const dead = [];
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 60 * 60 * 24 });
        sent++;
      } catch (err) {
        // 404/410 → the phone unsubscribed or the app was removed; forget it.
        if (err.statusCode === 404 || err.statusCode === 410) dead.push(s.endpoint);
        else console.warn('Push alert failed:', err.statusCode || err.message);
      }
    }));
    if (dead.length) {
      saveSubs(subs.filter((s) => !dead.includes(s.endpoint))).catch(() => {});
    }
    return { sent };
  };

  return { addSubscription, removeSubscription, listDevices, alertAdmins };
};

// ---------------------------------------------------------------------------
// Customer emails
// ---------------------------------------------------------------------------
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || 'there';

const ORDER_STATUS_TEXT = {
  PROCESSING: { subject: 'We received your order', line: 'We have received your order and will confirm it shortly.' },
  CONFIRMED: { subject: 'Your order is confirmed', line: 'Good news — your order is confirmed and we are getting it ready.' },
  SHIPPED: { subject: 'Your order is on the way', line: 'Your order has been shipped and is on its way to Ghana.' },
  DELIVERED: { subject: 'Your order has been delivered', line: 'Your order has been delivered. Thank you for shopping with CHARI!' },
  CANCELLED: { subject: 'Your order was cancelled', line: 'Your order has been cancelled. If you paid, we will contact you about your refund. Any store credit used has been returned to your account.' },
};
const PAYMENT_STATUS_TEXT = {
  PAID: { subject: 'Payment received', line: 'We have received your payment. Thank you!' },
  REFUNDED: { subject: 'Your refund has been sent', line: 'Your payment has been refunded.' },
};

const layout = ({ heading, intro, order, extra = '' }) => {
  const rows = (Array.isArray(order.items) ? order.items : [])
    .map((i) => {
      // The buyer's choices (size, colour…) under the item name.
      const picked = Object.entries(i.options || {}).map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ');
      return `<tr><td style="padding:6px 0;color:#334155">${esc(i.name)} × ${esc(i.qty)}${picked ? `<br><span style="font-size:12px;color:#6f675b">${picked}</span>` : ''}</td><td style="padding:6px 0;text-align:right;color:#0f172a">${money(i.price * i.qty)}</td></tr>`;
    })
    .join('');
  const extraRow = (text, amount) => `<tr><td style="padding:6px 0;color:#64748b">${text}</td><td style="padding:6px 0;text-align:right;color:#64748b">${amount}</td></tr>`;
  const summary = [
    // Shipping is quoted after ordering; until then the email says so instead of showing GH₵0.
    extraRow(`Shipping${order.deliveryMethod ? ` (${esc(order.deliveryMethod)})` : ''}`, order.deliveryFee ? money(order.deliveryFee) : "We'll confirm the cost"),
    order.discountAmount ? extraRow('Discount', `−${money(order.discountAmount)}`) : '',
    order.creditUsed ? extraRow('Store credit', `−${money(order.creditUsed)}`) : '',
  ].join('');
  const trackUrl = `${SITE_URL}/#/track-order`;
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:16px">CHARI</div>
    <div style="background:#fff;border-radius:14px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px;color:#0f172a">${esc(heading)}</h1>
      <p style="margin:0 0 16px;color:#475569;line-height:1.5">${intro}</p>
      <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;margin-bottom:16px">
        <div style="font-size:13px;color:#64748b">Order code</div>
        <div style="font-size:18px;font-weight:800;color:#0f172a;letter-spacing:1px">${esc(order.orderCode)}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}${summary}
        <tr><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;font-weight:700">Total</td><td style="padding:10px 0 0;border-top:1px solid #e2e8f0;text-align:right;font-weight:700">${money(order.total)}</td></tr>
      </table>
      ${extra}
      <a href="${trackUrl}" style="display:inline-block;margin-top:20px;background:#17140f;color:#d4af5a;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Track your order</a>
      <p style="margin:16px 0 0;font-size:13px;color:#64748b">To track, enter your order code and the phone number you used.</p>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:center;margin-top:16px">You are getting this email because you placed an order with CHARI.</p>
  </div></body></html>`;
};

const send = async (to, subject, html) => {
  if (!emailEnabled || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return false;
  try {
    if (BREVO_API_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: fromParts, to: [{ email: to }], subject, htmlContent: html }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`Brevo replied ${res.status}: ${(await res.text()).slice(0, 300)}`);
    } else {
      await mailer.sendMail({ from: MAIL_FROM, to, subject, html });
    }
    return true;
  } catch (err) {
    console.warn('Email failed:', err.message);
    return false;
  }
};

// Link a customer opens to choose a new password.
export const passwordResetUrl = (token) => `${SITE_URL}/?page=reset-password&token=${encodeURIComponent(token)}`;

// Sent when someone asks to reset their password. Returns true if the email went out.
export const emailPasswordReset = (user, link) => send(user.email, 'Reset your CHARI password', `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px 16px">
    <div style="font-size:22px;font-weight:800;color:#0f172a;margin-bottom:16px">CHARI</div>
    <div style="background:#fff;border-radius:14px;padding:24px">
      <h1 style="font-size:20px;margin:0 0 8px;color:#0f172a">Reset your password</h1>
      <p style="margin:0 0 20px;color:#475569;line-height:1.5">Hi ${esc(firstName(user.name))}, we got a request to reset the password for your CHARI account. Tap the button to choose a new one.</p>
      <a href="${esc(link)}" style="display:inline-block;background:#17140f;color:#d4af5a;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">Choose a new password</a>
      <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5">This link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email — your password won't change.</p>
      <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;word-break:break-all">Button not working? Copy this link: ${esc(link)}</p>
    </div>
  </div></body></html>`);

// Sent when an order is placed.
export const emailOrderPlaced = (order, settings = {}) => {
  const payNote = order.paymentStatus === 'PAID'
    ? ''
    : `<p style="margin:16px 0 0;color:#475569;line-height:1.5"><strong>How to pay:</strong> send ${money(order.total)} by MoMo to <strong>${esc(settings.momoNumber || '')}</strong>${settings.momoName ? ` (${esc(settings.momoName)})` : ''} and use <strong>${esc(order.orderCode)}</strong> as the reference.</p>`;
  return send(order.email, `Order ${order.orderCode} received`, layout({
    heading: `Thanks for your order, ${esc(firstName(order.customerName))}!`,
    intro: ORDER_STATUS_TEXT.PROCESSING.line,
    order,
    extra: payNote,
  }));
};

// Sent when the admin changes an order's status or payment status.
export const emailOrderUpdate = (before, after) => {
  const msgs = [];
  if (after.orderStatus !== before.orderStatus && ORDER_STATUS_TEXT[after.orderStatus]) msgs.push(ORDER_STATUS_TEXT[after.orderStatus]);
  if (after.paymentStatus !== before.paymentStatus && PAYMENT_STATUS_TEXT[after.paymentStatus]) msgs.push(PAYMENT_STATUS_TEXT[after.paymentStatus]);
  if (!msgs.length) return Promise.resolve(false);
  return send(after.email, `${msgs[0].subject} — ${after.orderCode}`, layout({
    heading: msgs[0].subject,
    intro: `Hi ${esc(firstName(after.customerName))}, ${msgs.map((m) => m.line).join(' ')}`,
    order: after,
  }));
};
