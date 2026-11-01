import React from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from '../components/HiddenGem';
import { ShieldCheck, Factory, MapPin, Truck, Smartphone, MessageCircle, ArrowRight, Phone, Clock, PackagePlus } from 'lucide-react';
import './InfoPages.css';

export const AboutPage = () => {
  const { navigate, openQuote, settings, WHATSAPP_NUMBER } = useStore();

  const VALUES = [
    [Factory, 'Straight from the supplier', 'We buy from trusted suppliers in Yiwu, Guangzhou and Istanbul, so you pay close to factory prices.'],
    [ShieldCheck, 'Checked before it ships', 'Our team checks items for faults and counts them before they leave the supplier.'],
    [Truck, 'Customs handled for you', 'We ship to Ghana and clear customs at the port. You just collect or receive it.'],
    [MapPin, `Free pickup in ${settings.pickupPoint}`, 'Or we deliver to your door or your nearest VIP/STC bus station, anywhere in Ghana.'],
    [Smartphone, 'Pay with Mobile Money', 'MTN, Telecel or AT — use your order code as the reference and we match it straight away.'],
    [MessageCircle, 'Real people on WhatsApp', 'Questions about sizes, bulk prices or your order? We reply every day.'],
  ];

  return (
    <div className="section ip-page">
      <div className="container ip-narrow">
        <header className="ip-hero">
          <span className="ip-eyebrow">About CHARI</span>
          <h1>Quality imports, delivered across Ghana <HiddenGem spot="about-page" /></h1>
          <p>
            CHARI helps shoppers and small businesses in Ghana buy directly from suppliers in China, Turkey and Dubai —
            without the middlemen, high markups or customs stress.
          </p>
          <dl className="ip-facts">
            <div><dt>16</dt><dd>Regions we deliver to</dd></div>
            <div><dt>3</dt><dd>Countries we buy from</dd></div>
            <div><dt>Included</dt><dd>Customs clearance</dd></div>
          </dl>
        </header>

        <section aria-label="Why shop with us">
          <h2 className="ip-section-title">Why shop with us</h2>
          <div className="ip-values">
            {VALUES.map(([Icon, title, text]) => (
              <div key={title} className="ip-value">
                <span className="ip-value-icon" aria-hidden="true"><Icon size={20} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ip-visit" aria-label="Find us">
          <div>
            <h2>Find us</h2>
            <ul>
              <li><MapPin size={16} aria-hidden="true" /> {settings.location} · pickup at {settings.pickupPoint}</li>
              <li><Clock size={16} aria-hidden="true" /> {settings.openingHours}</li>
              <li><Phone size={16} aria-hidden="true" /> <a href={`tel:+${String(settings.whatsappNumber || '').replace(/\D/g, '')}`}>{settings.phoneDisplay}</a></li>
            </ul>
          </div>
          <div className="ip-visit-actions">
            <a className="btn btn-whatsapp" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Chat on WhatsApp</a>
            <button type="button" className="btn btn-outline" onClick={() => navigate('import-tips')}>How ordering works</button>
          </div>
        </section>

        <section className="ip-cta">
          <h2>Ready to stock your shop or home?</h2>
          <p>Shop online, or send us anything you've seen elsewhere and we'll get it for you.</p>
          <div className="ip-cta-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('shop')}>Shop now <ArrowRight size={16} /></button>
            <button type="button" className="btn ip-btn-ghost" onClick={() => openQuote()}><PackagePlus size={16} /> Request an item</button>
          </div>
        </section>
      </div>
    </div>
  );
};
