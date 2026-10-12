// Admin dashboard API — every call sends the login token and surfaces the server's own error message.
import { getAuthToken } from './api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: isForm ? body : body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Could not reach the server. Check your internet connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) throw new Error('Your session has expired. Please sign in again.');
  if (!res.ok) throw new Error(data.error || `Something went wrong (error ${res.status}).`);
  return data;
}

// Orders
export const listOrders = async () => (await request('/orders')).data || [];
export const setOrderStatus = async (id, { orderStatus, paymentStatus }) =>
  (await request(`/orders/${id}/status`, { method: 'PATCH', body: { orderStatus, paymentStatus } })).data;

// Products
export const listProducts = async () => (await request('/products')).data || [];
export const addProduct = async (product) => (await request('/products', { method: 'POST', body: product })).data;
export const editProduct = async (id, changes) => (await request(`/products/${id}`, { method: 'PUT', body: changes })).data;
export const removeProduct = async (id) => request(`/products/${id}`, { method: 'DELETE' });

// Categories
export const listCategories = async () => (await request('/categories')).data || [];
export const addCategory = async (category) => (await request('/categories', { method: 'POST', body: category })).data;
export const editCategory = async (id, changes) => (await request(`/categories/${id}`, { method: 'PUT', body: changes })).data;
export const removeCategory = async (id) => request(`/categories/${id}`, { method: 'DELETE' });

// Promo codes
export const listDiscounts = async () => (await request('/discounts')).data || [];
export const addDiscount = async (discount) => (await request('/discounts', { method: 'POST', body: discount })).data;
export const editDiscount = async (id, changes) => (await request(`/discounts/${id}`, { method: 'PUT', body: changes })).data;
export const removeDiscount = async (id) => request(`/discounts/${id}`, { method: 'DELETE' });

// Shipments
export const listBatches = async () => (await request('/batches')).data || [];
export const addBatch = async (batch) => (await request('/batches', { method: 'POST', body: batch })).data;
export const editBatch = async (id, changes) => (await request(`/batches/${id}`, { method: 'PUT', body: changes })).data;
export const removeBatch = async (id) => request(`/batches/${id}`, { method: 'DELETE' });

// Messages & customers
export const listMessages = async () => (await request('/inquiries')).data || [];
export const setMessageStatus = async (id, status) => (await request(`/inquiries/${id}`, { method: 'PATCH', body: { status } })).data;
export const listCustomers = async () => (await request('/auth/users')).data || [];

// Photos
export const uploadPhoto = async (file) => {
  const form = new FormData();
  form.append('image', file);
  return (await request('/upload', { method: 'POST', body: form, isForm: true })).url;
};
