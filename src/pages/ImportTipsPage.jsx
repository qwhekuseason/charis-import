import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import {
  ShoppingBag,
  CreditCard,
  Package,
  Truck,
  Search,
  MessageCircle,
  ShieldCheck,
  Ship,
  Plane,
  Info,
  PackagePlus,
  Send,
  Smartphone
} from 'lucide-react';
import './InfoPages.css';

// The delivery choices at checkout (DELIVERY_OPTIONS in server/index.js). Costs differ by item,
// so no prices here — the team confirms the shipping cost after the order.
const DELIVERY = [
  { icon: Ship, name: 'Sea shipping', time: '35–45 working days', best: 'Heavy or bulky items — mannequins, furniture, bulk orders. Usually the cheapest.' },
  { icon: Plane, name: 'Air shipping', time: '7–12 working days', best: 'Light or urgent items — clothes, samples, small electronics.' },
  { icon: Truck, name: 'Local delivery (Kumasi)', time: '1–2 working days', best: 'Items already in stock in Kumasi.' },
];

export const ImportTipsPage = () => {
  const { openQuote, navigate, WHATSAPP_NUMBER, settings } = useStore();
  const [path, setPath] = useState('shop'); // 'shop' | 'request'

  const SHOP_STEPS = [
    [ShoppingBag, 'Add items to your cart', 'Browse the shop and add what you want. The price you see is fixed in cedis.'],
    [Truck, 'Choose delivery at checkout', 'Pick sea, air or local delivery. Shipping costs differ by item, so we confirm the cost with you after you order. Customs is included.'],
    [Smartphone, 'Pay by Mobile Money', `Send the total to ${settings.momoNumber} (${settings.momoName}) with your order code as the reference. Pre-orders are paid in full before we buy.`],
    [ShieldCheck, 'We buy and check it', 'Our team orders from the supplier, checks the items for faults and packs them for shipping.'],
    [Package, 'Track it', 'Follow your order with your code on the Track order page. We also message you on WhatsApp.'],
    [Truck, 'Collect or receive it', `Free pickup in ${settings.pickupPoint}, or delivery to your door or nearest VIP/STC bus station.`],
  ];
  const REQUEST_STEPS = [
    [Search, 'Find what you want', 'Seen it on 1688, Alibaba, Shein, TikTok or Instagram? Copy the link or take a screenshot. Note sizes, colours and quantity.'],
    [Send, 'Send us a request', 'Use “Request an item” (you can attach the photo) or send it on WhatsApp.'],
    [CreditCard, 'Get a price in cedis', 'We reply with the full cost — item, shipping and customs — usually within a day.'],
    [Smartphone, 'Pay to confirm', 'If you’re happy with the price, pay by Mobile Money and we place the order with the supplier.'],
    [Truck, 'We ship and deliver', 'We check it, ship it, clear customs and deliver it — just like a shop order.'],
  ];
  const steps = path === 'shop' ? SHOP_STEPS : REQUEST_STEPS;

  return (
    <div className="section ip-page">
      <div className="container ip-narrow">
        <header className="ip-hero">
          <span className="ip-eyebrow">Buying guide</span>
          <h1>How ordering works <HiddenGem spot="import-tips-page" /></h1>
          <p>Everything you need to know before you order from overseas with CHARI — in a few steps.</p>
        </header>

        <section aria-label="Steps">
          <div className="ip-switch" role="tablist" aria-label="How are you buying?">
            <button type="button" role="tab" aria-selected={path === 'shop'} className={path === 'shop' ? 'is-active' : ''} onClick={() => setPath('shop')}>
              <ShoppingBag size={16} /> Buying from our shop
            </button>
            <button type="button" role="tab" aria-selected={path === 'request'} className={path === 'request' ? 'is-active' : ''} onClick={() => setPath('request')}>
              <PackagePlus size={16} /> Something not in the shop
            </button>
          </div>

          <ol className="ip-steps">
            {steps.map(([Icon, title, text], i) => (
              <li key={title} className="ip-step">
                <span className="ip-step-num" aria-hidden="true">{i + 1}</span>
                <div>
                  <h3><Icon size={17} aria-hidden="true" /> {title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="ip-steps-cta">
            {path === 'shop'
              ? <button type="button" className="btn btn-primary" onClick={() => navigate('shop')}><ShoppingBag size={16} /> Start shopping</button>
              : <button type="button" className="btn btn-primary" onClick={() => openQuote()}><PackagePlus size={16} /> Request an item</button>}
          </div>
        </section>

        <section aria-label="Delivery options">
          <h2 className="ip-section-title">Delivery options</h2>
          <p className="ip-section-sub">Shipping costs differ by size and weight, so we work out the cost for your order and message it to you before it ships.</p>
          <div className="ip-delivery">
            {DELIVERY.map(({ icon: Icon, name, time, best }) => (
              <div key={name} className="ip-delivery-card">
                <span className="ip-value-icon" aria-hidden="true"><Icon size={20} /></span>
                <h3>{name}</h3>
                <dl>
                  <div><dt>Cost</dt><dd>We confirm it</dd></div>
                  <div><dt>Takes</dt><dd>{time}</dd></div>
                </dl>
                <p>{best}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ip-good-to-know" aria-label="Good to know">
          <h2 className="ip-section-title">Good to know</h2>
          <ul>
            <li><Info size={16} aria-hidden="true" /> Pre-orders are paid in full before we buy from the supplier, so they usually can’t be changed once placed.</li>
            <li><Info size={16} aria-hidden="true" /> The price is fixed in cedis when you order — exchange rate changes don’t affect you.</li>
            <li><Info size={16} aria-hidden="true" /> Customs clearance is included. For regulated items like food, medicine and cosmetics, check the rules with the GRA Customs Division or the FDA first.</li>
          </ul>
        </section>

        <section className="ip-cta">
          <h2>Have a specific product in mind?</h2>
          <p>Send us a link or photo and we’ll reply with a price and delivery time.</p>
          <div className="ip-cta-actions">
            <button type="button" className="btn btn-primary" onClick={() => openQuote()}><PackagePlus size={16} /> Request an item</button>
            <a className="btn btn-whatsapp" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hello CHARI, I would like advice on importing an item into Ghana.')}`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} /> Chat on WhatsApp
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};
