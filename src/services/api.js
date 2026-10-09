// CHARI - API Client Service

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Auth Token Helpers
export const getAuthToken = () => {
  return localStorage.getItem('charis_jwt_token');
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('charis_jwt_token', token);
  } else {
    localStorage.removeItem('charis_jwt_token');
  }
};

export const removeAuthToken = () => {
  localStorage.removeItem('charis_jwt_token');
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// ---------------------------------------------------------------------------
// Authentication API
// ---------------------------------------------------------------------------

/**
 * Register a new user account
 */
export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to register account');
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Login user
 */
export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Invalid email or password');
  }
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
}

/**
 * Get current logged in user profile with orders
 */
export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      removeAuthToken();
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch (error) {
    console.warn('Failed to fetch authenticated user:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(profileData) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(profileData),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }
  return data.user;
}

// ---------------------------------------------------------------------------
// Products & Categories API
// ---------------------------------------------------------------------------

/**
 * Fetch all products from PostgreSQL database
 */
export async function getProducts(queryParams = {}) {
  try {
    const params = new URLSearchParams();
    if (queryParams.category && queryParams.category !== 'all') {
      params.append('category', queryParams.category);
    }
    if (queryParams.search) params.append('search', queryParams.search);
    if (queryParams.sort) params.append('sort', queryParams.sort);
    if (queryParams.featured) params.append('featured', 'true');

    const res = await fetch(`${API_BASE}/products?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('API error fetching products, using fallback:', error);
    return null;
  }
}

/**
 * Fetch single product by ID or Slug
 */
export async function getProduct(idOrSlug) {
  try {
    const res = await fetch(`${API_BASE}/products/${idOrSlug}`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data;
  } catch (error) {
    console.warn('API error fetching product:', error);
    return null;
  }
}

/**
 * Fetch categories with product counts
 */
export async function getCategories() {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('API error fetching categories:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

/**
 * Place a new checkout order into PostgreSQL
 */
export async function createOrder(orderPayload) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderPayload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }
    return await res.json();
  } catch (error) {
    console.error('API error creating order:', error);
    throw error;
  }
}

/**
 * Track an order by tracking code (e.g. CHR-2026-7841)
 */
export async function trackOrder(orderCode) {
  try {
    const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(orderCode.trim())}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Order not found');
    }
    return data.data;
  } catch (error) {
    console.error('API error tracking order:', error);
    throw error;
  }
}

/**
 * Submit contact inquiry to PostgreSQL
 */
export async function submitInquiry(inquiryData) {
  try {
    const res = await fetch(`${API_BASE}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit inquiry');
    return data;
  } catch (error) {
    console.error('API error submitting inquiry:', error);
    throw error;
  }
}

/**
 * Backend health check
 */
export async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

// ---------------------------------------------------------------------------
// Store Owner / Admin Dashboard API
// ---------------------------------------------------------------------------

/**
 * Fetch all orders for admin
 */
export async function getAllOrders() {
  const res = await fetch(`${API_BASE}/orders`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch orders');
  const data = await res.json();
  return data.data || [];
}

/**
 * Update order status (e.g. PROCESSING -> SHIPPED -> DELIVERED)
 */
export async function updateOrderStatus(orderId, orderStatus, paymentStatus) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderStatus, paymentStatus }),
  });
  if (!res.ok) throw new Error('Failed to update order status');
  const data = await res.json();
  return data.data;
}

/**
 * Create a new product in the database
 */
export async function createProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create product');
  return data.data;
}

/**
 * Update existing product details
 */
export async function updateProduct(productId, productData) {
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(productData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update product');
  return data.data;
}

/**
 * Delete a product from catalog
 */
export async function deleteProduct(productId) {
  const res = await fetch(`${API_BASE}/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return await res.json();
}

/**
 * Fetch all contact form inquiries
 */
export async function getAllInquiries() {
  const res = await fetch(`${API_BASE}/inquiries`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch inquiries');
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch all registered users (Admin only)
 */
export async function getAllUsers() {
  const res = await fetch(`${API_BASE}/auth/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  const data = await res.json();
  return data.data || [];
}

/**
 * Upload an image file to server (Admin)
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);

  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload image file');
  }

  return data.url;
}

/**
 * Fetch all discounts (Admin)
 */
export async function getAllDiscounts() {
  const res = await fetch(`${API_BASE}/discounts`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch discounts');
  const data = await res.json();
  return data.data || [];
}

/**
 * Create a new discount (Admin)
 */
export async function createDiscount(discountData) {
  const res = await fetch(`${API_BASE}/discounts`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(discountData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create discount');
  return data.data;
}

/**
 * Update or toggle discount status (Admin)
 */
export async function updateDiscount(id, discountData) {
  const res = await fetch(`${API_BASE}/discounts/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(discountData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update discount');
  return data.data;
}

/**
 * Delete a discount (Admin)
 */
export async function deleteDiscount(id) {
  const res = await fetch(`${API_BASE}/discounts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete discount');
  return data;
}

/**
 * Validate promo code against current subtotal (Customer / Checkout)
 */
export async function validateDiscountCode(code, subtotal) {
  const res = await fetch(`${API_BASE}/discounts/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid promo code');
  return data;
}

// ---------------------------------------------------------------------------
// Logistics & Container Batches API
// ---------------------------------------------------------------------------

/**
 * Fetch all container & air cargo batches
 */
export async function getAllBatches() {
  try {
    const res = await fetch(`${API_BASE}/batches`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('API error fetching batches:', error);
    return [];
  }
}

/**
 * Fetch active sea and air batches
 */
export async function getActiveBatches() {
  try {
    const res = await fetch(`${API_BASE}/batches/active`);
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.warn('API error fetching active batches:', error);
    return null;
  }
}

/**
 * Create a new container or air cargo batch (Admin)
 */
export async function createBatch(batchData) {
  const res = await fetch(`${API_BASE}/batches`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(batchData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create batch');
  return data.data;
}

/**
 * Update an existing container batch or advance stage (Admin)
 */
export async function updateBatch(batchId, batchData) {
  const res = await fetch(`${API_BASE}/batches/${batchId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(batchData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update batch');
  return data.data;
}

/**
 * Delete a batch (Admin)
 */
export async function deleteBatch(batchId) {
  const res = await fetch(`${API_BASE}/batches/${batchId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to delete batch');
  return data;
}

// ---------------------------------------------------------------------------
// Active Discounts & Public Coupons
// ---------------------------------------------------------------------------

/**
 * Fetch active discount codes available for customers
 */
export async function getActiveDiscounts() {
  try {
    const res = await fetch(`${API_BASE}/discounts/active`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('Could not fetch active discounts:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Product Reviews API
// ---------------------------------------------------------------------------

/**
 * Fetch reviews for a specific product or all products
 */
export async function getReviews(productId) {
  try {
    const url = productId ? `${API_BASE}/reviews?productId=${encodeURIComponent(productId)}` : `${API_BASE}/reviews`;
    const res = await fetch(url);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.warn('Could not fetch reviews:', error);
    return [];
  }
}

/**
 * Submit a customer review (persisted to Neon PostgreSQL)
 */
export async function submitReview(reviewData) {
  const res = await fetch(`${API_BASE}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit review');
  return data.data;
}



