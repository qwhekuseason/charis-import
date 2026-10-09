import React from 'react';
import { useStore } from '../context/StoreContext';
import { Home, ShoppingBag, Package, Grid, User } from 'lucide-react';

export const MobileBottomNav = () => {
  const { currentPage, navigate, cartCount, setCartDrawerOpen, user, openAuth } = useStore();

  const navItems = [
    { label: 'Home', icon: Home, action: () => navigate('home'), page: 'home' },
    { label: 'Shop', icon: Grid, action: () => navigate('shop'), page: 'shop' },
    { label: 'Cart', icon: ShoppingBag, action: () => setCartDrawerOpen(true), page: null, badge: cartCount },
    { label: 'Track', icon: Package, action: () => navigate('track-order'), page: 'track-order' },
    {
      label: user ? user.name.split(' ')[0] : 'Sign In',
      icon: User,
      action: () => (user ? navigate('account') : openAuth('login')),
      page: 'account',
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.page && currentPage === item.page;

        return (
          <button
            key={item.label}
            onClick={item.action}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ position: 'relative' }}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              {item.badge > 0 && (
                <span
                  className="badge-counter"
                  style={{ top: '-6px', right: '-10px' }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: isActive ? 700 : 500,
                maxWidth: '52px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
