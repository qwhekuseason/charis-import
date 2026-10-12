import React from 'react';
import { useStore } from '../context/StoreContext';
import { HiddenGem } from './HiddenGem';
import { MtnMomoIcon, TelecelCashIcon, AtMoneyIcon, CashOnDeliveryIcon } from './PaymentIcons';

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

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer-grid">
          <div>
            <button type="button" className="site-footer-brand" onClick={() => navigate('home')}>
              <img src="/chari-mark.jpg" alt="" width="44" height="44" />
              <span>CHARI</span>
            </button>
            <p className="site-footer-about">
              Quality products bought from overseas suppliers and delivered anywhere in Ghana.
            </p>
            <p className="site-footer-contact">
              {settings.location}
              <br />
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">{settings.phoneDisplay}</a>
            </p>
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
            <CashOnDeliveryIcon />
          </div>
        </div>
      </div>
    </footer>
  );
};
