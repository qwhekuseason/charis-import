import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Rotating banner at the top of every page. Messages come from Admin → Settings;
// while a deal is running, a deals message is added automatically.
export const AnnouncementBar = () => {
  const { navigate, products, settings } = useStore();
  const [visible, setVisible] = useState(true);
  const [index, setIndex] = useState(0);

  const dealCount = products.filter((p) => p.onDeal).length;
  const messages = [
    ...(dealCount > 0 ? [`${dealCount} deal${dealCount === 1 ? '' : 's'} on now — limited time`] : []),
    ...(settings.announcements || []),
  ].filter(Boolean);

  useEffect(() => {
    if (messages.length < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => i + 1), 5000);
    return () => clearInterval(timer);
  }, [messages.length]);

  if (!visible || messages.length === 0) return null;
  const message = messages[index % messages.length];
  const isDeal = dealCount > 0 && index % messages.length === 0;

  return (
    <div className="announce" role="region" aria-label="Announcements">
      <div className="container announce-inner">
        <button type="button" className="announce-text" onClick={() => navigate('shop', isDeal ? { filter: 'deals' } : undefined)}>
          {message}
        </button>
        <button type="button" className="announce-close" onClick={() => setVisible(false)} aria-label="Hide announcement">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
