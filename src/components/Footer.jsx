import React from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from './HiddenGem';
import { MtnMomoIcon, TelecelCashIcon, AtMoneyIcon } from './PaymentIcons';
import { MessageCircle, Phone, Mail, MapPin, Clock, ArrowUp } from 'lucide-react';

export const Footer = () => {
  const { navigate, setQuoteModalOpen, WHATSAPP_NUMBER, settings } = useStore();

  const columns = [
    {
      title: 'Shop',
      links: [
        { label: 'All products', action: () => navigate('shop') },
        { label: 'Categories', action: () => navigate('categories') },
        { label: 'Deals', action: () => navigate('shop', { filter: 'deals' }) },
        { label: 'Request an item', action: () => setQuoteModalOpen(true) },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Track my order', action: () => navigate('track-order') },
        { label: 'How ordering works', action: () => navigate('import-tips') },
        { label: 'Contact us', action: () => navigate('contact') },
        { label: 'WhatsApp support', href: `https://wa.me/${WHATSAPP_NUMBER}` },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About CHARI', action: () => navigate('about') },
        { label: 'Bulk & wholesale orders', action: () => navigate('contact') },
      ],
    },
  ];

  const phoneDigits = String(settings.whatsappNumber || '').replace(/\D/g, '');

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div className="site-footer-about-col">
            <a href="#/home" className="site-footer-brand" onClick={(e) => { e.preventDefault(); navigate('home'); }}>
              <img src="/chari-mark.jpg" alt="" width="44" height="44" />
              <span>CHARI</span>
            </a>
            <p className="site-footer-about">
              Quality products bought from overseas suppliers and delivered anywhere in Ghana.
            </p>
            <ul className="site-footer-contact">
              <li><MapPin size={15} aria-hidden="true" /> {settings.location}</li>
              <li><Phone size={15} aria-hidden="true" /> <a href={`tel:+${phoneDigits}`}>{settings.phoneDisplay}</a></li>
              {settings.email && <li><Mail size={15} aria-hidden="true" /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>}
              {settings.openingHours && <li><Clock size={15} aria-hidden="true" /> {settings.openingHours}</li>}
            </ul>
            <a className="site-footer-wa" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
              <MessageCircle size={16} /> Chat on WhatsApp
            </a>
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="site-footer-heading">{col.title}</h4>
              <ul className="site-footer-links">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <a href={link.href} target="_blank" rel="noreferrer">{link.label}</a>
                    ) : (
                      <button type="button" onClick={link.action}>{link.label}</button>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="site-footer-bottom">
          <span>© {new Date().getFullYear()} CHARI. All rights reserved. <HiddenGem spot="footer" /></span>
          <div className="site-footer-pay" aria-label="Payment methods we accept">
            <span>We accept</span>
            <MtnMomoIcon />
            <TelecelCashIcon />
            <AtMoneyIcon />
          </div>
          <button type="button" className="site-footer-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <ArrowUp size={15} /> Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};
