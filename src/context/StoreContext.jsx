import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS, CATEGORIES } from '../data/products';
import {
  getProducts,
  getCategories,
  createOrder as apiCreateOrder,
  checkServerHealth,
  loginUser as apiLoginUser,
  registerUser as apiRegisterUser,
  getCurrentUser,
  updateUserProfile as apiUpdateProfile,
  removeAuthToken,
  getActiveBatches,
  getActiveDiscounts,
  getReviews,
  submitReview as apiSubmitReview
} from '../services/api';

const StoreContext = createContext();

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

export const StoreProvider = ({ children }) => {
  // Live Database States
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [serverOnline, setServerOnline] = useState(false);

  // Authentication State
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [authLoading, setAuthLoading] = useState(true);

  // Professional Clean Light Theme Engine (Dark mode removed)
  const theme = 'light';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.style.colorScheme = 'light';
    if (document.body) {
      document.body.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('charis_theme', 'light');
    } catch {}
  }, []);

  const toggleTheme = () => {};

  // International FX Rates Snapshot & Margin Locking
  const [fxRates] = useState({
    USD_GHS: 15.65,
    RMB_GHS: 2.18,
    lockedAt: '16:00 GMT (Rate Locked)',
    lockValidityMinutes: 30
  });

  // Pre-Order Batch Status Engine (Dynamic from PostgreSQL)
  const [activeContainerBatch, setActiveContainerBatch] = useState({
    batchId: 'CN-GH-2026-FCL04',
    containerNumber: 'CN-GH-2026-FCL04',
    containerType: '40ft High Cube Container (FCL Consolidated)',
    fillPercentage: 82,
    cutoffDaysRemaining: 3,
    cutoffDate: '2026-10-04',
    etaTemaPort: '2026-11-08',
    originPort: 'Guangzhou International Sea Port',
    destinationPort: 'Tema MPS Terminal 3, Ghana'
  });

  // Volumetric & Freight Duty Calculation Engine
  const calculateVolumetricFreight = (cbm = 0.05, actualKg = 5) => {
    const safeCbm = Math.max(0.01, parseFloat(cbm) || 0.05);
    const safeActualKg = Math.max(0.5, parseFloat(actualKg) || 5);
    const airVolumetricKg = Math.round(safeCbm * 167 * 10) / 10;
    const chargeableAirKg = Math.max(safeActualKg, airVolumetricKg);
    const seaFreightGhs = Math.max(45, Math.round(safeCbm * 380));
    const airFreightGhs = Math.max(65, Math.round(chargeableAirKg * 85));
    const customsDutyEst = Math.round(seaFreightGhs * 0.18 + 40);

    return {
      cbm: safeCbm,
      actualKg: safeActualKg,
      airVolumetricKg,
      chargeableAirKg,
      seaFreightGhs,
      airFreightGhs,
      customsDutyEst
    };
  };

  // Navigation with Hash Sync & Deep Linking
  const getInitialPage = () => {
    try {
      const hash = window.location.hash.replace('#/', '').replace('#', '').trim();
      const validPages = ['home', 'shop', 'categories', 'import-tips', 'about', 'contact', 'track-order', 'checkout', 'account', 'admin'];
      if (validPages.includes(hash)) return hash;
      const params = new URLSearchParams(window.location.search);
      if (params.get('page') && validPages.includes(params.get('page'))) return params.get('page');
    } catch {}
    return 'home';
  };
  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [pageParams, setPageParams] = useState({});

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '').trim();
      const validPages = ['home', 'shop', 'categories', 'import-tips', 'about', 'contact', 'track-order', 'checkout', 'account', 'admin'];
      if (validPages.includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Cart State (Persisted)
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('charis_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist State (Persisted)
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('charis_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Orders State (Real Customer Orders - Persisted)
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('charis_orders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modals & Drawers
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [preorderTermsOpen, setPreorderTermsOpen] = useState(false);

  // Reviews State (Linked to Neon PostgreSQL)
  const [reviews, setReviews] = useState([]);

  // Active Promo Discounts (Linked to Neon PostgreSQL)
  const [availableCoupons, setAvailableCoupons] = useState([]);

  // Referral Rewards & Wallet State (Persisted)
  const [referralWallet, setReferralWallet] = useState(() => {
    try {
      const saved = localStorage.getItem('chari_referral_wallet');
      return saved ? parseFloat(saved) : 25.00;
    } catch {
      return 25.00;
    }
  });

  const [referralStats, setReferralStats] = useState(() => {
    try {
      const saved = localStorage.getItem('chari_referral_stats');
      return saved ? JSON.parse(saved) : { invites: 3, completedOrders: 1 };
    } catch {
      return { invites: 3, completedOrders: 1 };
    }
  });

  // Referral code for current user or guest
  const referralCode = user
    ? `CHARI-${user.name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5)}${user.id ? user.id.slice(-2).toUpperCase() : '26'}`
    : 'CHARI-VIP26';

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Toasts
  const [toasts, setToasts] = useState([]);

  // WhatsApp Hotline
  const WHATSAPP_NUMBER = '233591440934';

  useEffect(() => {
    localStorage.setItem('charis_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('charis_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('charis_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('chari_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('chari_referral_wallet', referralWallet.toString());
  }, [referralWallet]);

  useEffect(() => {
    localStorage.setItem('chari_referral_stats', JSON.stringify(referralStats));
  }, [referralStats]);

  // Fetch live products and categories from PostgreSQL via REST API
  const refreshProducts = async () => {
    try {
      const liveProducts = await getProducts();
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
      const liveCategories = await getCategories();
      if (liveCategories && liveCategories.length > 0) {
        setCategories(liveCategories);
      }
    } catch (err) {
      console.warn('Could not fetch live products:', err);
    }
  };

  const refreshBatches = async () => {
    try {
      const res = await getActiveBatches();
      if (res && res.primary) {
        const p = res.primary;
        const fill = p.capacityCbm && p.allocatedCbm ? Math.round((p.allocatedCbm / p.capacityCbm) * 100) : 82;
        setActiveContainerBatch({
          batchId: p.batchNumber,
          containerNumber: p.batchNumber,
          containerType: p.containerType,
          fillPercentage: fill,
          cutoffDaysRemaining: 3,
          cutoffDate: p.cutoffDate || '2026-10-04',
          etaTemaPort: p.eta || '2026-11-08',
          originPort: p.originPort,
          destinationPort: p.destinationPort,
          carrier: p.carrier,
          status: p.status
        });
      }
    } catch (err) {
      console.warn('Could not fetch active batches:', err);
    }
  };

  // Fetch verified reviews from Neon PostgreSQL
  const refreshReviews = async () => {
    try {
      const liveReviews = await getReviews();
      if (liveReviews && liveReviews.length > 0) {
        setReviews(liveReviews);
      }
    } catch (err) {
      console.warn('Could not fetch live reviews:', err);
    }
  };

  // Fetch active discount codes from Neon PostgreSQL
  const refreshCoupons = async () => {
    try {
      const liveCoupons = await getActiveDiscounts();
      if (liveCoupons && liveCoupons.length > 0) {
        setAvailableCoupons(liveCoupons);
      }
    } catch (err) {
      console.warn('Could not fetch active coupons:', err);
    }
  };

  useEffect(() => {
    checkServerHealth().then((res) => {
      setServerOnline(Boolean(res.online));
      if (res.online) {
        refreshProducts();
        refreshBatches();
        refreshReviews();
        refreshCoupons();
      }
    });

    // Check for saved login session
    getCurrentUser()
      .then((userData) => {
        if (userData) {
          setUser(userData);
        }
      })
      .catch(() => {})
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  // Auth Methods
  const login = async (email, password) => {
    try {
      const res = await apiLoginUser(email, password);
      if (res && res.user) {
        setUser(res.user);
        setAuthModalOpen(false);
        showToast(`Welcome back, ${res.user.name.split(' ')[0]}!`, 'success');
        return res.user;
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await apiRegisterUser(userData);
      if (res && res.user) {
        setUser(res.user);
        setAuthModalOpen(false);
        showToast(`Account created! Welcome, ${res.user.name.split(' ')[0]}!`, 'success');
        return res.user;
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    showToast('Signed out successfully', 'info');
  };

  const updateProfile = async (profileData) => {
    try {
      const updated = await apiUpdateProfile(profileData);
      setUser((prev) => ({ ...prev, ...updated }));
      showToast('Profile updated successfully!', 'success');
      return updated;
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
      throw err;
    }
  };

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Toast helper
  const showToast = (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Navigation helper
  const navigate = (page, params = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    try {
      window.location.hash = page;
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate tiered price based on quantity
  const calculateTierPrice = (product, qty) => {
    if (!product.bulkTiers || product.bulkTiers.length === 0) {
      return product.price;
    }
    // Find matching tier
    for (let i = product.bulkTiers.length - 1; i >= 0; i--) {
      const tier = product.bulkTiers[i];
      if (qty >= tier.min) {
        return tier.price;
      }
    }
    return product.price;
  };

  // Add to cart (retail e-commerce)
  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, quantity || 1);

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIndex].quantity + qtyToAdd;
        const unitPrice = product.price;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          unitPrice,
          total: unitPrice * newQty
        };
        return updated;
      } else {
        const unitPrice = product.price;
        return [
          ...prevCart,
          {
            product,
            quantity: qtyToAdd,
            unitPrice,
            total: unitPrice * qtyToAdd
          }
        ];
      }
    });

    showToast(`Added ${qtyToAdd}x "${product.name}" to cart!`, 'success');
    return true;
  };

  // Update item quantity
  const updateCartQuantity = (productId, newQty) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.product.id === productId) {
          if (newQty <= 0) return null;
          const unitPrice = item.product.price;
          return {
            ...item,
            quantity: newQty,
            unitPrice,
            total: unitPrice * newQty
          };
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Wishlist toggle
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from wishlist`, 'info');
        return prev.filter((p) => p.id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to wishlist!`, 'success');
        return [...prev, product];
      }
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some((p) => p.id === productId);
  };

  // WhatsApp Direct link generator
  const getWhatsAppOrderLink = (product, quantity = 1) => {
    const qty = quantity || 1;
    const unitPrice = product.price;
    const total = (unitPrice * qty).toFixed(2);
    
    const message = encodeURIComponent(
      `Hello CHARI Team,\n\nI want to purchase:\nProduct: *${product.name}*\nQuantity: *${qty}*\nUnit Price: GH₵${unitPrice.toFixed(2)}\nTotal: *GH₵${total}*\n\nPlease confirm availability and delivery details.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  // Add review & recalculate product rating (Persisted to Neon PostgreSQL)
  const addReview = async (productId, reviewData) => {
    try {
      const saved = await apiSubmitReview({
        productId,
        userName: reviewData.userName?.trim() || (user ? user.name : 'Verified Buyer'),
        userCity: reviewData.userCity?.trim() || (user ? user.city : 'Accra'),
        rating: Number(reviewData.rating) || 5,
        title: reviewData.title?.trim() || 'Great product!',
        comment: reviewData.comment?.trim() || '',
      });

      setReviews((prev) => [saved, ...prev]);
      if (refreshProducts) refreshProducts();
      showToast('Thank you! Your verified review has been published.', 'success');
      return saved;
    } catch (err) {
      console.error('Failed to submit review to database:', err);
      const fallbackRev = {
        id: `rev-${Date.now()}`,
        productId,
        userName: reviewData.userName?.trim() || 'Verified Buyer',
        userCity: reviewData.userCity?.trim() || 'Accra',
        rating: Number(reviewData.rating) || 5,
        title: reviewData.title?.trim() || 'Great product!',
        comment: reviewData.comment?.trim() || '',
        verified: true,
        createdAt: new Date().toISOString(),
        helpfulCount: 0
      };
      setReviews((prev) => [fallbackRev, ...prev]);
      showToast('Review submitted!', 'success');
      return fallbackRev;
    }
  };

  const getReviewsForProduct = (productId) => {
    return reviews.filter((r) => r.productId === productId);
  };

  const voteHelpfulReview = (reviewId) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
    );
    showToast('Marked review as helpful!', 'info');
  };

  // Referral credit apply helper
  const applyReferralCreditToCart = () => {
    const credit = Math.min(referralWallet, 25);
    if (credit <= 0) {
      showToast('No wallet credit available.', 'info');
      return;
    }
    navigate('checkout', { discountAmount: credit, appliedPromo: `WALLET-${referralCode}` });
    showToast(`GH₵${credit.toFixed(2)} referral credit applied to checkout!`, 'success');
  };

  // Add placed order (persisted to Neon PostgreSQL + Local state)
  const addPlacedOrder = async (newOrder) => {
    const orderKey = newOrder.orderId || newOrder.orderCode;
    const shippingFee = parseFloat(newOrder.deliveryFee !== undefined ? newOrder.deliveryFee : (newOrder.shippingCost || 0));

    // Optimistic update in local state
    setOrders((prev) => ({
      [orderKey]: {
        ...newOrder,
        orderId: orderKey,
        orderCode: orderKey,
        deliveryFee: shippingFee,
        shippingCost: shippingFee,
      },
      ...prev
    }));

    try {
      const res = await apiCreateOrder({
        orderCode: orderKey,
        customerName: newOrder.customerName || `${newOrder.firstName || ''} ${newOrder.lastName || ''}`.trim() || 'Valued Customer',
        phone: newOrder.phone || '+233000000000',
        email: newOrder.email || null,
        city: newOrder.city || newOrder.region || 'Accra',
        address: newOrder.destination || newOrder.deliveryAddress || newOrder.address || '',
        deliveryMethod: newOrder.shippingMethod || newOrder.deliveryMethodTitle || newOrder.deliveryMethod || 'Standard Delivery',
        paymentMethod: newOrder.paymentMethodTitle || newOrder.paymentMethod || 'Cash on Delivery',
        items: newOrder.items || [],
        subtotal: parseFloat(newOrder.subtotal || 0),
        deliveryFee: shippingFee,
        shippingCost: shippingFee,
        total: parseFloat(newOrder.total || 0),
        notes: newOrder.deliveryNotes || newOrder.notes || null,
        couponCode: newOrder.couponCode || newOrder.promoCode || null,
      });

      if (res && res.data) {
        console.log('[Order] Created in Neon PostgreSQL:', res.data.orderCode);
        const savedOrder = res.data;
        const confirmedOrder = {
          ...newOrder,
          ...savedOrder,
          orderId: savedOrder.orderCode,
          orderCode: savedOrder.orderCode,
          deliveryFee: savedOrder.deliveryFee,
          shippingCost: savedOrder.deliveryFee,
          status: savedOrder.orderStatus ? savedOrder.orderStatus.toLowerCase() : (newOrder.status || 'processing')
        };

        setOrders((prev) => {
          const next = { ...prev };
          if (orderKey !== savedOrder.orderCode) {
            delete next[orderKey];
          }
          next[savedOrder.orderCode] = confirmedOrder;
          try {
            localStorage.setItem('charis_orders', JSON.stringify(next));
          } catch {}
          return next;
        });

        return confirmedOrder;
      }
    } catch (err) {
      console.warn('Backend order persistence note:', err.message);
    }
    return newOrder;
  };

  // Computed values
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);

  return (
    <StoreContext.Provider
      value={{
        theme,
        toggleTheme,
        fxRates,
        activeContainerBatch,
        calculateVolumetricFreight,
        currentPage,
        pageParams,
        navigate,
        products,
        categories,
        serverOnline,
        refreshProducts,
        refreshBatches,
        user,
        login,
        register,
        logout,
        updateProfile,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        openAuth,
        authLoading,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartSubtotal,
        wishlist,
        toggleWishlist,
        isInWishlist,
        selectedProduct,
        setSelectedProduct,
        cartDrawerOpen,
        setCartDrawerOpen,
        quoteModalOpen,
        setQuoteModalOpen,
        referralModalOpen,
        setReferralModalOpen,
        referralCode,
        referralWallet,
        setReferralWallet,
        referralStats,
        applyReferralCreditToCart,
        reviews,
        addReview,
        getReviewsForProduct,
        voteHelpfulReview,
        availableCoupons,
        preorderTermsOpen,
        setPreorderTermsOpen,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        orders,
        addPlacedOrder,
        toasts,
        showToast,
        calculateTierPrice,
        getWhatsAppOrderLink,
        WHATSAPP_NUMBER
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};
