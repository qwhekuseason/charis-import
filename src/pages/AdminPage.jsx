import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  getAllOrders,
  updateOrderStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllInquiries,
  getAllUsers,
  uploadImage,
  getAllDiscounts,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getAllBatches,
  createBatch,
  updateBatch,
  deleteBatch
} from '../services/api';
import {
  Shield,
  Package,
  ShoppingBag,
  Users,
  MessageCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle,
  Clock,
  Truck,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  X,
  AlertCircle,
  Upload,
  Check,
  Loader2,
  Tag,
  Percent,
  ToggleLeft,
  ToggleRight,
  Calendar,
  Anchor,
  Plane,
  Layers,
  Globe,
  Activity,
  FileCheck,
  Lock,
  Boxes,
  Cpu,
  ArrowUpRight
} from 'lucide-react';

export const AdminPage = () => {
  const { user, openAuth, navigate, showToast, refreshProducts, refreshBatches, categories, login } = useStore();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'discounts' | 'inquiries' | 'users' | 'logistics'
  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [discountsList, setDiscountsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // International Pre-Order Batches & Logistics
  const [batches, setBatches] = useState([
    {
      id: 'batch-fcl-04',
      batchNumber: 'CN-GH-2026-FCL04',
      type: 'SEA_FCL',
      containerType: '40ft High Cube Container',
      carrier: 'MSC Tema Voyager (Vessel MSC-992)',
      originPort: 'Guangzhou Port, China',
      destinationPort: 'Port of Tema (MPS Terminal 3)',
      capacityCbm: 68.0,
      allocatedCbm: 55.8,
      totalOrders: 38,
      status: 'HIGH_SEAS',
      cutoffDate: '2026-10-05',
      eta: '2026-10-24',
      lockedFxRate: '15.65'
    },
    {
      id: 'batch-air-12',
      batchNumber: 'EK-9821-EXP',
      type: 'AIR_CARGO',
      containerType: 'ULD Palletized Air Freight',
      carrier: 'Emirates SkyCargo Flight EK-9821',
      originPort: 'Yiwu International Cargo Terminal',
      destinationPort: 'Kotoka International Airport (KIA), Accra',
      capacityKg: 2500,
      allocatedKg: 1850,
      totalOrders: 19,
      status: 'CUSTOMS_CLEARANCE',
      cutoffDate: '2026-10-01',
      eta: '2026-10-03',
      lockedFxRate: '15.65'
    }
  ]);

  const [simulatedFxRates, setSimulatedFxRates] = useState({
    usdGhs: '15.65',
    rmbGhs: '2.18',
    seaRatePerCbmUsd: '280',
    airRatePerKgUsd: '12.50'
  });

  const [simCbm, setSimCbm] = useState(1.5);
  const [simKg, setSimKg] = useState(65);

  const [webhookLogs] = useState([
    {
      id: 'wh-001',
      provider: 'Paystack MoMo',
      idempotencyKey: 'idemp_live_99a81c0e-44bc',
      event: 'charge.success',
      reference: 'CHR-SEA-8821',
      amount: 'GH₵3,250.00',
      status: 'PROCESSED',
      timestamp: '2026-09-30 20:25:12',
      replayBlocked: true
    },
    {
      id: 'wh-002',
      provider: 'Hubtel Ghana',
      idempotencyKey: 'idemp_live_b722d3e1-11fd',
      event: 'payment.received',
      reference: 'CHR-AIR-9402',
      amount: 'GH₵1,850.00',
      status: 'PROCESSED',
      timestamp: '2026-09-30 20:35:40',
      replayBlocked: true
    },
    {
      id: 'wh-003',
      provider: 'Flutterwave MoMo',
      idempotencyKey: 'idemp_live_99a81c0e-44bc',
      event: 'charge.success (REPLAY)',
      reference: 'CHR-SEA-8821',
      amount: 'GH₵3,250.00',
      status: 'REPLAY_REJECTED (409 Conflict)',
      timestamp: '2026-09-30 20:36:01',
      replayBlocked: true
    }
  ]);

  const advanceBatchStatus = async (batchId) => {
    const stageOrder = ['CONFIRMED', 'QC_BATCHING', 'HIGH_SEAS', 'CUSTOMS_CLEARANCE', 'ACCRA_HUB', 'DELIVERY_READY'];
    const target = batches.find((b) => b.id === batchId);
    if (!target) return;
    const curIdx = stageOrder.indexOf(target.status);
    const nextIdx = (curIdx + 1) % stageOrder.length;
    const nextStatus = stageOrder[nextIdx];

    try {
      await updateBatch(batchId, { status: nextStatus });
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, status: nextStatus } : b))
      );
      showToast(`Batch ${target.batchNumber} transitioned to: ${nextStatus}`, 'success');
      if (refreshBatches) refreshBatches();
    } catch (err) {
      showToast(err.message || 'Failed to update batch status', 'error');
    }
  };

  const handleDeleteBatch = async (batchId, batchNumber) => {
    if (!window.confirm(`Are you sure you want to delete container batch ${batchNumber}?`)) return;
    try {
      await deleteBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      showToast(`Batch ${batchNumber} deleted from database`, 'info');
      if (refreshBatches) refreshBatches();
    } catch (err) {
      showToast(err.message || 'Failed to delete batch', 'error');
    }
  };

  // Add batch modal state
  const [addBatchModalOpen, setAddBatchModalOpen] = useState(false);
  const [submittingBatch, setSubmittingBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    type: 'SEA_FCL',
    containerType: '40ft High Cube Container',
    carrier: '',
    originPort: 'Guangzhou Port, China',
    destinationPort: 'Port of Tema (MPS Terminal 3)',
    capacityCbm: 68,
    allocatedCbm: 0,
    capacityKg: 2500,
    allocatedKg: 0,
    totalOrders: 0,
    status: 'CONFIRMED',
    cutoffDate: '',
    eta: '',
    lockedFxRate: '15.65'
  });

  const handleCreateBatchSubmit = async (e) => {
    e.preventDefault();
    if (!newBatch.batchNumber || !newBatch.carrier) {
      showToast('Please provide a batch number and carrier name', 'error');
      return;
    }

    setSubmittingBatch(true);
    try {
      const created = await createBatch({
        ...newBatch,
        capacityCbm: newBatch.type === 'SEA_FCL' ? parseFloat(newBatch.capacityCbm || 68) : null,
        allocatedCbm: newBatch.type === 'SEA_FCL' ? parseFloat(newBatch.allocatedCbm || 0) : 0,
        capacityKg: newBatch.type === 'AIR_CARGO' ? parseFloat(newBatch.capacityKg || 2500) : null,
        allocatedKg: newBatch.type === 'AIR_CARGO' ? parseFloat(newBatch.allocatedKg || 0) : 0,
        totalOrders: parseInt(newBatch.totalOrders || 0, 10),
      });

      setBatches((prev) => [created, ...prev]);
      setAddBatchModalOpen(false);
      setNewBatch({
        batchNumber: '',
        type: 'SEA_FCL',
        containerType: '40ft High Cube Container',
        carrier: '',
        originPort: 'Guangzhou Port, China',
        destinationPort: 'Port of Tema (MPS Terminal 3)',
        capacityCbm: 68,
        allocatedCbm: 0,
        capacityKg: 2500,
        allocatedKg: 0,
        totalOrders: 0,
        status: 'CONFIRMED',
        cutoffDate: '',
        eta: '',
        lockedFxRate: '15.65'
      });
      showToast(`Batch ${created.batchNumber} created in PostgreSQL!`, 'success');
      if (refreshBatches) refreshBatches();
    } catch (err) {
      showToast(err.message || 'Failed to create batch', 'error');
    } finally {
      setSubmittingBatch(false);
    }
  };

  // Add discount modal state
  const [addDiscountModalOpen, setAddDiscountModalOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true
  });
  const [submittingDiscount, setSubmittingDiscount] = useState(false);

  // Orders filter & search
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Add product modal state
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Kitchen Appliances',
    price: '',
    originalPrice: '',
    inStock: true,
    image: '',
    description: ''
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);

  // Edit product modal state
  const [editProductModalOpen, setEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [updatingProduct, setUpdatingProduct] = useState(false);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editDragOver, setEditDragOver] = useState(false);
  const [editShowUrlFallback, setEditShowUrlFallback] = useState(false);

  const handleImageFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP, etc.)', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'error');
      return;
    }

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setNewProduct((prev) => ({ ...prev, image: url }));
      showToast('Image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [ordData, inqData, usrData, prodRes, discData, batchData] = await Promise.all([
        getAllOrders().catch(() => []),
        getAllInquiries().catch(() => []),
        getAllUsers().catch(() => []),
        fetch('/api/products').then((r) => r.json()).then((d) => d.data || []).catch(() => []),
        getAllDiscounts().catch(() => []),
        getAllBatches().catch(() => [])
      ]);

      setOrders(ordData);
      setInquiries(inqData);
      setUsersList(usrData);
      setProductsList(prodRes);
      setDiscountsList(discData);
      if (batchData && batchData.length > 0) {
        setBatches(batchData);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user]);

  // If user is not logged in or not an admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ backgroundColor: 'var(--bg-main)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div
          className="glass-panel"
          style={{
            maxWidth: '540px',
            width: '100%',
            textAlign: 'center',
            padding: '40px 32px',
            borderRadius: '24px',
            border: '1px solid var(--border-light)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            <Shield size={36} />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Store Admin Access Required
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '28px', lineHeight: 1.6 }}>
            This portal manages live container shipments, pre-order batch transitions, FX margin locking, and financial webhooks. Restricted to authorized administrators.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => openAuth('login')}
              className="btn btn-primary"
              style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 800 }}
            >
              Sign In with Admin Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // KPI Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const processingCount = orders.filter((o) => o.orderStatus === 'PROCESSING').length;

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter !== 'all' && o.orderStatus !== orderFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      const code = (o.orderCode || '').toLowerCase();
      const name = (o.customerName || '').toLowerCase();
      const phone = (o.phone || '').toLowerCase();
      const city = (o.city || '').toLowerCase();
      return code.includes(q) || name.includes(q) || phone.includes(q) || city.includes(q);
    }
    return true;
  });

  // Handle Order Status Change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
      );
      showToast(`Order status updated to ${newStatus}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error');
    }
  };

  // Handle Add Product Submit
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) {
      showToast('Please provide product name and price', 'error');
      return;
    }

    if (uploadingImage) {
      showToast('Please wait for the image upload to complete', 'info');
      return;
    }

    setSubmittingProduct(true);
    try {
      const created = await createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        originalPrice: newProduct.originalPrice ? parseFloat(newProduct.originalPrice) : null,
        image: newProduct.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
        gallery: [newProduct.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80']
      });

      setProductsList((prev) => [created, ...prev]);
      setAddProductModalOpen(false);
      setNewProduct({
        name: '',
        category: 'Kitchen Appliances',
        price: '',
        originalPrice: '',
        inStock: true,
        image: '',
        description: ''
      });
      setShowUrlFallback(false);
      showToast(`Product "${created.name}" added to the catalogue!`, 'success');
      refreshProducts();
    } catch (err) {
      showToast(err.message || 'Failed to add product', 'error');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (prodId, prodName) => {
    if (!window.confirm(`Are you sure you want to delete "${prodName}" from the store catalog?`)) {
      return;
    }

    try {
      await deleteProduct(prodId);
      setProductsList((prev) => prev.filter((p) => p.id !== prodId));
      showToast(`Product deleted successfully`, 'info');
      refreshProducts();
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error');
    }
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod) => {
    setEditingProduct({
      id: prod.id,
      name: prod.name || '',
      category: prod.category || 'Kitchen Appliances',
      price: prod.price !== undefined ? prod.price.toString() : '',
      originalPrice: prod.originalPrice !== null && prod.originalPrice !== undefined ? prod.originalPrice.toString() : '',
      inStock: prod.inStock ?? true,
      badge: prod.badge || '',
      image: prod.image || (prod.images && prod.images[0]) || '',
      description: prod.description || ''
    });
    setEditShowUrlFallback(false);
    setEditProductModalOpen(true);
  };

  // Handle Edit Image File Upload
  const handleEditImageFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP, etc.)', 'error');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'error');
      return;
    }

    setEditUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setEditingProduct((prev) => ({ ...prev, image: url }));
      showToast('Product image uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setEditUploadingImage(false);
    }
  };

  // Handle Update Product Submit
  const handleUpdateProductSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct.name || !editingProduct.price) {
      showToast('Please provide product name and price', 'error');
      return;
    }

    if (editUploadingImage) {
      showToast('Please wait for the image upload to complete', 'info');
      return;
    }

    setUpdatingProduct(true);
    try {
      const updated = await updateProduct(editingProduct.id, {
        name: editingProduct.name.trim(),
        category: editingProduct.category,
        price: parseFloat(editingProduct.price),
        originalPrice: editingProduct.originalPrice ? parseFloat(editingProduct.originalPrice) : null,
        inStock: Boolean(editingProduct.inStock),
        badge: editingProduct.badge ? editingProduct.badge.trim() : null,
        image: editingProduct.image,
        gallery: editingProduct.image ? [editingProduct.image] : [],
        description: editingProduct.description || ''
      });

      setProductsList((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
      );
      setEditProductModalOpen(false);
      setEditingProduct(null);
      showToast(`Product "${updated.name}" updated successfully!`, 'success');
      refreshProducts();
    } catch (err) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setUpdatingProduct(false);
    }
  };

  // Handle Add Discount Submit
  const handleAddDiscountSubmit = async (e) => {
    e.preventDefault();
    if (!newDiscount.code || newDiscount.value === '') {
      showToast('Please provide a discount code and value', 'error');
      return;
    }

    setSubmittingDiscount(true);
    try {
      const created = await createDiscount({
        ...newDiscount,
        code: newDiscount.code.trim().toUpperCase(),
        value: parseFloat(newDiscount.value),
        minOrderAmount: newDiscount.minOrderAmount ? parseFloat(newDiscount.minOrderAmount) : 0,
        maxDiscount: newDiscount.maxDiscount ? parseFloat(newDiscount.maxDiscount) : null,
        usageLimit: newDiscount.usageLimit ? parseInt(newDiscount.usageLimit, 10) : null,
        expiresAt: newDiscount.expiresAt ? newDiscount.expiresAt : null
      });

      setDiscountsList((prev) => [created, ...prev]);
      setAddDiscountModalOpen(false);
      setNewDiscount({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: '',
        isActive: true
      });
      showToast(`Promo code "${created.code}" created successfully!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to create promo code', 'error');
    } finally {
      setSubmittingDiscount(false);
    }
  };

  // Handle Toggle Discount Status
  const handleToggleDiscount = async (discount) => {
    try {
      const updated = await updateDiscount(discount.id, { isActive: !discount.isActive });
      setDiscountsList((prev) =>
        prev.map((d) => (d.id === discount.id ? updated : d))
      );
      showToast(`Code "${discount.code}" is now ${updated.isActive ? 'Active' : 'Inactive'}`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to update discount status', 'error');
    }
  };

  // Handle Delete Discount
  const handleDeleteDiscount = async (discountId, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete promo code "${code}"?`)) {
      return;
    }
    try {
      await deleteDiscount(discountId);
      setDiscountsList((prev) => prev.filter((d) => d.id !== discountId));
      showToast(`Promo code "${code}" deleted`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete promo code', 'error');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', minHeight: '100vh', padding: '40px 0 80px' }}>
      <div className="container" style={{ maxWidth: '1240px' }}>
        {/* Admin Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: '20px',
            padding: '32px 36px',
            color: '#ffffff',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  backgroundColor: '#3b82f6',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  letterSpacing: '0.5px'
                }}
              >
                ADMIN DASHBOARD
              </span>
              <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ● All Systems Operational
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
              CHARIS Store Control Center
            </h1>
            <p style={{ margin: '6px 0 0', color: 'var(--text-light)', fontSize: '0.92rem' }}>
              Welcome back, {user.name} · Managing orders, inventory & customers across Ghana
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={loadAdminData}
              className="btn btn-outline"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px'
              }}
              title="Refresh data"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={() => navigate('home')}
              className="btn btn-primary"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                padding: '10px 20px',
                borderRadius: '8px'
              }}
            >
              View Storefront <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* KPI Metrics Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          {/* Revenue */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Total Store Revenue
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              GH₵{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px', fontWeight: 600 }}>
              Across {orders.length} total orders
            </div>
          </div>

          {/* Orders */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Customer Orders
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {orders.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: processingCount > 0 ? '#D4AF37' : 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              {processingCount > 0 ? `${processingCount} orders need processing` : 'All caught up!'}
            </div>
          </div>

          {/* Products */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Catalog Products
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBag size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {productsList.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              In {categories.length} active categories
            </div>
          </div>

          {/* Users */}
          <div
            className="glass-panel"
            style={{
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Registered Users
              </span>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'rgba(124, 58, 237, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={20} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {usersList.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {inquiries.length} contact messages
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '2px solid #e2e8f0',
            marginBottom: '24px'
          }}
        >
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'orders' ? 'var(--accent)' : '#64748b',
              borderBottom: activeTab === 'orders' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Package size={17} /> Orders Management ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'products' ? 'var(--accent)' : '#64748b',
              borderBottom: activeTab === 'products' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShoppingBag size={17} /> Products Catalog ({productsList.length})
          </button>
          <button
            onClick={() => setActiveTab('discounts')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'discounts' ? 'var(--accent)' : '#64748b',
              borderBottom: activeTab === 'discounts' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Tag size={17} /> Discounts & Coupons ({discountsList.length})
          </button>
          <button
            onClick={() => setActiveTab('inquiries')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'inquiries' ? 'var(--accent)' : '#64748b',
              borderBottom: activeTab === 'inquiries' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Mail size={17} /> Customer Inquiries ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'users' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'users' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={17} /> Registered Users ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('logistics')}
            style={{
              padding: '12px 24px',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: activeTab === 'logistics' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'logistics' ? '3px solid var(--accent)' : '3px solid transparent',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Anchor size={17} /> Container Batches & FX ({batches.length})
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter & Search Toolbar */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid var(--border-light)',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              {/* Search */}
              <div style={{ position: 'relative', minWidth: '280px' }}>
                <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  placeholder="Search order #, customer, phone, city..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-medium)',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'PROCESSING', label: 'Processing' },
                  { id: 'CONFIRMED', label: 'Confirmed' },
                  { id: 'SHIPPED', label: 'Shipped' },
                  { id: 'DELIVERED', label: 'Delivered' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setOrderFilter(st.id)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: orderFilter === st.id ? '#0f172a' : '#f1f5f9',
                      color: orderFilter === st.id ? '#ffffff' : '#475569'
                    }}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List / Table */}
            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading orders...</p>
            ) : filteredOrders.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No orders found matching your search.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id || ord.orderCode}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid var(--border-light)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '14px',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '16px',
                        marginBottom: '16px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          ORDER ID
                        </span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                          #{ord.orderCode}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                          {new Date(ord.createdAt).toLocaleDateString('en-GB')} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {ord.customerName}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={14} /> {ord.phone}
                        </div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={14} /> {ord.city} ({ord.address})
                        </div>
                      </div>

                      {/* Total */}
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          TOTAL
                        </span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#D4AF37' }}>
                          GH₵{ord.total?.toFixed(2)}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {ord.paymentMethod}
                        </span>
                      </div>

                      {/* Status Selector & WhatsApp */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                            UPDATE STATUS
                          </label>
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '0.85rem',
                              border: '1.5px solid #cbd5e1',
                              backgroundColor:
                                ord.orderStatus === 'DELIVERED'
                                  ? '#dcfce7'
                                  : ord.orderStatus === 'SHIPPED'
                                  ? '#e0f2fe'
                                  : 'rgba(212, 175, 55, 0.12)',
                              color:
                                ord.orderStatus === 'DELIVERED'
                                  ? '#166534'
                                  : ord.orderStatus === 'SHIPPED'
                                  ? '#0369a1'
                                  : '#B8860B'
                            }}
                          >
                            <option value="PROCESSING">Processing</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </div>

                        {/* WhatsApp Customer */}
                        <a
                          href={`https://wa.me/${(ord.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${ord.customerName},\n\nThis is CHARI regarding your order #${ord.orderCode} (GH₵${ord.total}). Status: ${ord.orderStatus}.\n\nPlease let us know if you have any questions!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ecfdf5',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            borderRadius: '8px',
                            padding: '10px',
                            cursor: 'pointer',
                            marginTop: '16px'
                          }}
                          title="Message customer on WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </a>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                      <span style={{ fontWeight: 700 }}>Items Ordered: </span>
                      {ord.items && Array.isArray(ord.items) ? (
                        ord.items.map((it, idx) => (
                          <span key={idx} style={{ marginRight: '10px' }}>
                            • {it.quantity}x {it.name || it.product?.name} (GH₵{it.price || it.unitPrice})
                          </span>
                        ))
                      ) : (
                        <span>Details recorded in database</span>
                      )}
                      {ord.notes && (
                        <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#D4AF37', fontWeight: 600 }}>
                          Customer Note: "{ord.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG */}
        {activeTab === 'products' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Store Products ({productsList.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Add, edit prices, or manage your product catalogue.
                </p>
              </div>

              <button
                onClick={() => setAddProductModalOpen(true)}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700
                }}
              >
                <Plus size={18} /> Add New Product
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px'
              }}
            >
              {productsList.map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={prod.image || (prod.images && prod.images[0])}
                      alt={prod.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditProduct(prod)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          color: '#0f172a',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          transition: 'transform 0.15s ease'
                        }}
                        title="Edit product"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                        title="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                        {prod.category}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {prod.inStock === false ? (
                          <span style={{ fontSize: '0.68rem', color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Out of Stock
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            In Stock
                          </span>
                        )}
                        {prod.badge && (
                          <span style={{ fontSize: '0.68rem', color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            {prod.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 8px' }}>
                      {prod.name}
                    </h4>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: 'auto', marginBottom: '12px' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        GH₵{prod.price?.toFixed(2)}
                      </span>
                      {prod.originalPrice && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                          GH₵{prod.originalPrice?.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenEditProduct(prod)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-medium)',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit2 size={13} /> Edit Details & Pricing
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INQUIRIES */}
        {activeTab === 'inquiries' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Customer Messages & Sourcing Requests ({inquiries.length})
            </h3>
            {inquiries.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No contact inquiries received yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{inq.name}</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '12px' }}>
                          {inq.email} {inq.phone ? `· ${inq.phone}` : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {new Date(inq.createdAt).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#D4AF37', marginBottom: '6px' }}>
                      Subject: {inq.subject}
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                      "{inq.message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: REGISTERED USERS */}
        {activeTab === 'users' && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Registered Shoppers & Accounts ({usersList.length})
            </h3>
            <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '16px 20px', backgroundColor: 'var(--bg-subtle)', fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <div>Name & Role</div>
                <div>Email & Phone</div>
                <div>City</div>
                <div>Joined</div>
              </div>
              {usersList.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr',
                    padding: '16px 20px',
                    borderTop: '1px solid #f1f5f9',
                    alignItems: 'center',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</span>
                    {u.role === 'ADMIN' && (
                      <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 800 }}>
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    {u.email} {u.phone ? `· ${u.phone}` : ''}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>{u.city || 'Ghana'}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.82rem' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-GB')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DISCOUNTS & PROMO CODES */}
        {activeTab === 'discounts' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Store Discounts & Promo Codes ({discountsList.length})
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Create and control customer coupon codes with percentage or fixed GH₵ savings.
                </p>
              </div>

              <button
                onClick={() => setAddDiscountModalOpen(true)}
                className="btn btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700
                }}
              >
                <Plus size={18} /> Create Promo Code
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading discount codes...</p>
            ) : discountsList.length === 0 ? (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', padding: '48px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
                <Tag size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>No discount codes created yet</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Create your first discount code to offer savings to shoppers.</p>
                <button
                  onClick={() => setAddDiscountModalOpen(true)}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)' }}
                >
                  <Plus size={16} /> Create Promo Code
                </button>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 1.2fr 1fr',
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-subtle)',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    gap: '12px'
                  }}
                >
                  <div>Code & Note</div>
                  <div>Discount Value</div>
                  <div>Requirements</div>
                  <div>Redemptions</div>
                  <div>Status</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {discountsList.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1.5fr 1.5fr 1.2fr 1.2fr 1fr',
                      padding: '18px 20px',
                      borderTop: '1px solid #f1f5f9',
                      alignItems: 'center',
                      fontSize: '0.9rem',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-subtle)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1'
                        }}
                      >
                        {d.code}
                      </span>
                      {d.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {d.description}
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1rem' }}>
                        {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `GH₵${d.value.toFixed(2)} OFF`}
                      </span>
                      {d.maxDiscount && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          Max cap: GH₵{d.maxDiscount.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {d.minOrderAmount > 0 ? `Min spend: GH₵${d.minOrderAmount.toFixed(2)}` : 'No minimum spend'}
                      {d.expiresAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
                          Expires: {new Date(d.expiresAt).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </div>

                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {d.usedCount}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {d.usageLimit ? ` / ${d.usageLimit} limit` : ' uses'}
                      </span>
                    </div>

                    <div>
                      <button
                        onClick={() => handleToggleDiscount(d)}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          backgroundColor: d.isActive ? '#ecfdf5' : '#f1f5f9',
                          color: d.isActive ? '#059669' : '#64748b',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        title={d.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.isActive ? '#10b981' : '#94a3b8' }}></span>
                        {d.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleDeleteDiscount(d.id, d.code)}
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        title="Delete promo code"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: INTERNATIONAL CONTAINER BATCHES, LOGISTICS & FX */}
        {activeTab === 'logistics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Toolbar */}
            <div
              className="glass-panel"
              style={{
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Anchor size={20} color="#D4AF37" />
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    International Pre-Order Batches & Supply Chain Engine
                  </h3>
                </div>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                  Guangzhou / Yiwu consolidation, vessel milestones, volumetric CBM rates & idempotent webhooks.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span className="badge-fx">
                  <Lock size={12} /> Active Peg: $1 = GH₵{simulatedFxRates.usdGhs}
                </span>
                <span className="badge-sea">
                  <Anchor size={12} /> FCL Ocean Line: MPS Tema
                </span>
                <button
                  onClick={() => setAddBatchModalOpen(true)}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Plus size={16} /> New Container Batch
                </button>
              </div>
            </div>

            {/* Live Container Batches Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
              {batches.map((batch) => {
                const isSea = batch.type === 'SEA_FCL';
                const fillPercent = isSea
                  ? Math.round(((batch.allocatedCbm || 0) / (batch.capacityCbm || 1)) * 100)
                  : Math.round(((batch.allocatedKg || 0) / (batch.capacityKg || 1)) * 100);

                return (
                  <div
                    key={batch.id}
                    className="glass-panel"
                    style={{
                      borderRadius: '18px',
                      padding: '24px',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={isSea ? 'badge-sea' : 'badge-air'}>
                            {isSea ? <Anchor size={12} /> : <Plane size={12} />} {batch.type}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            Cutoff: {batch.cutoffDate || 'Open'}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)', margin: '6px 0 2px' }}>
                          {batch.batchNumber}
                        </h4>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {batch.containerType} • {batch.carrier}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                          Current Milestone
                        </span>
                        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#D4AF37' }}>
                          {(batch.status || 'CONFIRMED').replace(/_/g, ' ')}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                          ETA: {batch.eta || 'TBD'}
                        </span>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-main)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      <div>
                        <strong>Origin:</strong> {batch.originPort}
                      </div>
                      <div style={{ color: '#D4AF37', fontWeight: 900 }}>➔</div>
                      <div>
                        <strong>Destination:</strong> {batch.destinationPort}
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                          Container Capacity Utilization:
                        </span>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                          {isSea
                            ? `${batch.allocatedCbm || 0} / ${batch.capacityCbm || 68} CBM (${fillPercent}%)`
                            : `${batch.allocatedKg || 0} / ${batch.capacityKg || 2500} KG (${fillPercent}%)`}
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--bg-main)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.min(100, fillPercent)}%`,
                            background: fillPercent > 80 ? 'linear-gradient(90deg, #D4AF37, #10b981)' : '#D4AF37',
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>

                    {/* Interactive Stage Transition Controls */}
                    <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Orders Allocated: <strong style={{ color: 'var(--text-primary)' }}>{batch.totalOrders || 0} Pre-orders</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.78rem',
                            fontWeight: 700
                          }}
                          title="Delete container batch"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                        <button
                          onClick={() => advanceBatchStatus(batch.id)}
                          className="btn btn-sm"
                          style={{
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <RefreshCw size={13} /> Advance Lifecycle Stage
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Volumetric Freight & Landed Margin Simulator */}
            <div
              className="glass-panel"
              style={{
                borderRadius: '18px',
                padding: '24px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Boxes size={20} color="#D4AF37" />
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Volumetric Freight & Customs Duty Margin Engine
                  </h4>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Interactive Landed Cost Simulator
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Simulated Volume (CBM)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={simCbm}
                    onChange={(e) => setSimCbm(parseFloat(e.target.value) || 0.1)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)', fontWeight: 800
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Gross Cargo Weight (KG)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={simKg}
                    onChange={(e) => setSimKg(parseFloat(e.target.value) || 1)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)', fontWeight: 800
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    USD / GHS Peg Rate
                  </label>
                  <input
                    type="text"
                    value={simulatedFxRates.usdGhs}
                    onChange={(e) => setSimulatedFxRates({ ...simulatedFxRates, usdGhs: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)', fontWeight: 800
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Ocean Freight / CBM ($)
                  </label>
                  <input
                    type="text"
                    value={simulatedFxRates.seaRatePerCbmUsd}
                    onChange={(e) => setSimulatedFxRates({ ...simulatedFxRates, seaRatePerCbmUsd: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)',
                      border: '1px solid var(--border-light)', fontWeight: 800
                    }}
                  />
                </div>
              </div>

              {/* Calculation Results */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginTop: '6px' }}>
                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.08)', border: '1.5px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ fontSize: '0.76rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>
                    Sea Freight Landed (CBM Based)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>
                    GH₵{(simCbm * parseFloat(simulatedFxRates.seaRatePerCbmUsd || 280) * parseFloat(simulatedFxRates.usdGhs || 15.65)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Est. Tema Port clearance: ~GH₵{(simCbm * 450).toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '1.5px solid rgba(212, 175, 55, 0.3)' }}>
                  <div style={{ fontSize: '0.76rem', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>
                    Air Cargo Expedited (KG Based)
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '4px 0' }}>
                    GH₵{(simKg * parseFloat(simulatedFxRates.airRatePerKgUsd || 12.5) * parseFloat(simulatedFxRates.usdGhs || 15.65)).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Est. KIA Airport handling: ~GH₵{(simKg * 35).toFixed(2)}
                  </div>
                </div>

                <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ fontSize: '0.76rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>
                    FX Margin Shield
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
                    100% PROTECTED
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Locked at checkout initialization
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Idempotency Webhook Monitor */}
            <div
              className="glass-panel"
              style={{
                borderRadius: '18px',
                padding: '24px',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} color="#10b981" />
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
                    Mobile Money & Card Idempotency Webhook Inspector
                  </h4>
                </div>
                <span className="badge-fx">
                  <Shield size={12} /> Double-Credit Prevention: Active
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '8px 12px' }}>Provider</th>
                      <th style={{ padding: '8px 12px' }}>Idempotency Key</th>
                      <th style={{ padding: '8px 12px' }}>Event</th>
                      <th style={{ padding: '8px 12px' }}>Order Reference</th>
                      <th style={{ padding: '8px 12px' }}>Amount</th>
                      <th style={{ padding: '8px 12px' }}>Status</th>
                      <th style={{ padding: '8px 12px' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhookLogs.map((log) => (
                      <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {log.provider}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6366f1' }}>
                          {log.idempotencyKey}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                          {log.event}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: '#D4AF37' }}>
                          #{log.reference}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          {log.amount}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              backgroundColor: log.status.includes('REJECTED') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: log.status.includes('REJECTED') ? '#ef4444' : '#10b981'
                            }}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE PROMO CODE MODAL */}
      {addDiscountModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddDiscountModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '22px 28px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Tag size={20} style={{ color: '#D4AF37' }} />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>Create New Promo Code</h3>
              </div>
              <button onClick={() => setAddDiscountModalOpen(false)} style={{ color: '#ffffff', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDiscountSubmit} style={{ padding: '24px 28px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Promo Code Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20, EASTER10"
                  value={newDiscount.code}
                  onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', textTransform: 'uppercase', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Discount Type *
                  </label>
                  <select
                    value={newDiscount.type}
                    onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="PERCENTAGE">Percentage (% OFF)</option>
                    <option value="FIXED">Fixed Amount (GH₵ OFF)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Value ({newDiscount.type === 'PERCENTAGE' ? '%' : 'GH₵'}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={newDiscount.type === 'PERCENTAGE' ? 'e.g. 15' : 'e.g. 25.00'}
                    value={newDiscount.value}
                    onChange={(e) => setNewDiscount({ ...newDiscount, value: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Minimum Order Amount (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50.00 (optional)"
                    value={newDiscount.minOrderAmount}
                    onChange={(e) => setNewDiscount({ ...newDiscount, minOrderAmount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Max Discount Cap (GH₵)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 100.00 (optional)"
                    value={newDiscount.maxDiscount}
                    onChange={(e) => setNewDiscount({ ...newDiscount, maxDiscount: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100 uses (optional)"
                    value={newDiscount.usageLimit}
                    onChange={(e) => setNewDiscount({ ...newDiscount, usageLimit: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={newDiscount.expiresAt}
                    onChange={(e) => setNewDiscount({ ...newDiscount, expiresAt: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Internal Description / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Easter promotional campaign for Instagram followers"
                  value={newDiscount.description}
                  onChange={(e) => setNewDiscount({ ...newDiscount, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
                <input
                  type="checkbox"
                  id="discountIsActive"
                  checked={newDiscount.isActive}
                  onChange={(e) => setNewDiscount({ ...newDiscount, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#D4AF37', cursor: 'pointer' }}
                />
                <label htmlFor="discountIsActive" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Activate promo code immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingDiscount}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: submittingDiscount ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingDiscount ? 'Saving to Database...' : 'Save Promo Code'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {addProductModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddProductModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '24px 28px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff' }}>Add New Product</h3>
              <button onClick={() => setAddProductModalOpen(false)} style={{ color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} style={{ padding: '24px 28px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stainless Steel Air Fryer 6L"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Selling Price (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 200.00"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Stock Availability
                  </label>
                  <select
                    value={newProduct.inStock ? 'true' : 'false'}
                    onChange={(e) => setNewProduct({ ...newProduct, inStock: e.target.value === 'true' })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Product Image Upload */}
              <div style={{ marginBottom: '18px' }}>
                {/* ⚠️ Ephemeral Upload Warning */}
                <div style={{
                  marginBottom: '10px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(212, 175, 55, 0.08)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  fontSize: '0.78rem',
                  color: '#B8860B',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  lineHeight: 1.5
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>
                    <strong>Local uploads are temporary.</strong> Files saved to <code>/public/uploads/</code> are wiped on server restart (cloud hosts like Railway/Render). For production, paste an external image URL (Cloudinary, Imgur, Unsplash, etc.) using "Paste link instead" below.
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                    Product Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {showUrlFallback ? '← Switch to file upload' : 'Paste link instead'}
                  </button>
                </div>

                {showUrlFallback ? (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0' }}>
                      Enter a direct image URL (e.g. Unsplash or Cloudinary)
                    </p>
                  </div>
                ) : (
                  <div>
                    {newProduct.image ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1.5px solid var(--border-medium)',
                          borderRadius: '10px'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#e2e8f0',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={newProduct.image}
                            alt="Uploaded preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.82rem', fontWeight: 700 }}>
                            <Check size={16} /> Photo Uploaded
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}
                          >
                            {newProduct.image}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid #cbd5e1',
                                padding: '4px 10px',
                                borderRadius: '6px'
                              }}
                            >
                              <Upload size={12} /> Replace
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleImageFileUpload(e.target.files[0]);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setNewProduct({ ...newProduct, image: '' })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleImageFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px 16px',
                          border: `2px dashed ${dragOver ? '#D4AF37' : '#cbd5e1'}`,
                          backgroundColor: dragOver ? 'rgba(212, 175, 55, 0.08)' : '#f8fafc',
                          borderRadius: '12px',
                          cursor: uploadingImage ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingImage}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageFileUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {uploadingImage ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={30} className="animate-spin" style={{ color: '#D4AF37' }} />
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Uploading image to server...
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Please wait a moment</span>
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                color: '#D4AF37',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px'
                              }}
                            >
                              <Upload size={22} />
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                              Click to choose image or drag & drop here
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              JPG, PNG, WEBP, or GIF (max 15MB)
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the product features, sizes, or specifications..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.98rem',
                  fontWeight: 700,
                  cursor: submittingProduct ? 'not-allowed' : 'pointer'
                }}
              >
                {submittingProduct ? 'Saving to Database...' : 'Save Product to Store'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editProductModalOpen && editingProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditProductModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '580px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '22px 28px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 size={20} color="#D4AF37" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                  Edit Product Details
                </h3>
              </div>
              <button onClick={() => setEditProductModalOpen(false)} style={{ color: '#ffffff', cursor: 'pointer', background: 'none', border: 'none' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateProductSubmit} style={{ padding: '24px 28px', maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stainless Steel Air Fryer 6L"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Category *
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Selling Price (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Original Price (Optional Strike-through)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 200.00"
                    value={editingProduct.originalPrice}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Stock Availability
                  </label>
                  <select
                    value={editingProduct.inStock ? 'true' : 'false'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="true">In Stock (Available to Order)</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Badge / Ribbon (Optional)
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['', 'Featured', 'Trending', 'New', 'Best Seller', 'Pre-Order'].map((b) => (
                    <button
                      type="button"
                      key={b}
                      onClick={() => setEditingProduct({ ...editingProduct, badge: b })}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        border: '1px solid var(--border-medium)',
                        backgroundColor: (editingProduct.badge || '') === b ? '#D4AF37' : 'var(--bg-subtle)',
                        color: (editingProduct.badge || '') === b ? '#ffffff' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {b || 'None'}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom badge text (e.g. 20% OFF)"
                  value={editingProduct.badge}
                  onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.85rem' }}
                />
              </div>

              {/* Product Image Update */}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>
                    Product Image
                  </label>
                  <button
                    type="button"
                    onClick={() => setEditShowUrlFallback(!editShowUrlFallback)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0
                    }}
                  >
                    {editShowUrlFallback ? '← Switch to file upload' : 'Paste link instead'}
                  </button>
                </div>

                {editShowUrlFallback ? (
                  <div>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: '4px 0 0' }}>
                      Enter a direct image URL (e.g. Unsplash or Cloudinary)
                    </p>
                  </div>
                ) : (
                  <div>
                    {editingProduct.image ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '14px',
                          padding: '12px',
                          backgroundColor: 'var(--bg-subtle)',
                          border: '1.5px solid var(--border-medium)',
                          borderRadius: '10px'
                        }}
                      >
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            backgroundColor: '#e2e8f0',
                            flexShrink: 0
                          }}
                        >
                          <img
                            src={editingProduct.image}
                            alt="Current preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '0.82rem', fontWeight: 700 }}>
                            <Check size={16} /> Active Image Set
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '2px'
                            }}
                          >
                            {editingProduct.image}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                backgroundColor: 'var(--bg-card)',
                                border: '1px solid #cbd5e1',
                                padding: '4px 10px',
                                borderRadius: '6px'
                              }}
                            >
                              <Upload size={12} /> Replace Image
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files?.[0]) handleEditImageFileUpload(e.target.files[0]);
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => setEditingProduct({ ...editingProduct, image: '' })}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#ef4444',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 8px'
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <label
                        onDragOver={(e) => {
                          e.preventDefault();
                          setEditDragOver(true);
                        }}
                        onDragLeave={() => setEditDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setEditDragOver(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleEditImageFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '24px 16px',
                          border: `2px dashed ${editDragOver ? '#D4AF37' : '#cbd5e1'}`,
                          backgroundColor: editDragOver ? 'rgba(212, 175, 55, 0.08)' : '#f8fafc',
                          borderRadius: '12px',
                          cursor: editUploadingImage ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          textAlign: 'center'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          disabled={editUploadingImage}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleEditImageFileUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {editUploadingImage ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <Loader2 size={30} className="animate-spin" style={{ color: '#D4AF37' }} />
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                              Uploading new image to server...
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Please wait a moment</span>
                          </div>
                        ) : (
                          <>
                            <div
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                color: '#D4AF37',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px'
                              }}
                            >
                              <Upload size={22} />
                            </div>
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                              Click to choose image or drag & drop here
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              JPG, PNG, WEBP, or GIF (max 15MB)
                            </span>
                          </>
                        )}
                      </label>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Product Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the product features, sizes, or specifications..."
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setEditProductModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingProduct}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #D4AF37 0%, #B8860B 100%)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    cursor: updatingProduct ? 'not-allowed' : 'pointer'
                  }}
                >
                  {updatingProduct ? 'Saving Changes...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CONTAINER / AIR CARGO BATCH MODAL */}
      {addBatchModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddBatchModalOpen(false);
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '620px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '22px 28px', backgroundColor: '#0f172a', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Anchor size={22} color="#D4AF37" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                    Register Logistics Batch
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                    Deploy a new international sea freight or express air cargo consolidation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddBatchModalOpen(false)}
                style={{ color: '#ffffff', cursor: 'pointer', background: 'none', border: 'none', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateBatchSubmit} style={{ padding: '24px 28px', maxHeight: '78vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Batch Code / ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CN-GH-2026-FCL05"
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Cargo Transit Mode *
                  </label>
                  <select
                    value={newBatch.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setNewBatch({
                        ...newBatch,
                        type,
                        containerType: type === 'SEA_FCL' ? '40ft High Cube Container' : 'ULD Palletized Air Freight',
                        originPort: type === 'SEA_FCL' ? 'Guangzhou Port, China' : 'Shenzhen Bao\'an Cargo Terminal',
                        destinationPort: type === 'SEA_FCL' ? 'Port of Tema (MPS Terminal 3)' : 'Kotoka International Airport (ACC)'
                      });
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="SEA_FCL">Sea Freight (FCL Container)</option>
                    <option value="AIR_CARGO">Express Air Freight (Cargo Jet)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Carrier / Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newBatch.type === 'SEA_FCL' ? 'e.g. Maersk / MSC / CMA CGM' : 'e.g. Ethiopian Cargo / Emirates SkyCargo'}
                    value={newBatch.carrier}
                    onChange={(e) => setNewBatch({ ...newBatch, carrier: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Vessel / Equipment Spec
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 40ft High Cube Container"
                    value={newBatch.containerType}
                    onChange={(e) => setNewBatch({ ...newBatch, containerType: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Port / Hub of Loading
                  </label>
                  <input
                    type="text"
                    value={newBatch.originPort}
                    onChange={(e) => setNewBatch({ ...newBatch, originPort: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Destination Port / Hub
                  </label>
                  <input
                    type="text"
                    value={newBatch.destinationPort}
                    onChange={(e) => setNewBatch({ ...newBatch, destinationPort: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {newBatch.type === 'SEA_FCL' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      CBM Volume Capacity (m³)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.capacityCbm}
                      onChange={(e) => setNewBatch({ ...newBatch, capacityCbm: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Initial Allocated CBM (m³)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={newBatch.allocatedCbm}
                      onChange={(e) => setNewBatch({ ...newBatch, allocatedCbm: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Gross Weight Capacity (KG)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={newBatch.capacityKg}
                      onChange={(e) => setNewBatch({ ...newBatch, capacityKg: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Initial Allocated Payload (KG)
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={newBatch.allocatedKg}
                      onChange={(e) => setNewBatch({ ...newBatch, allocatedKg: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Initial Lifecycle Stage
                  </label>
                  <select
                    value={newBatch.status}
                    onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem', backgroundColor: 'var(--bg-card)' }}
                  >
                    <option value="PLANNING">Planning & Consolidation</option>
                    <option value="CONFIRMED">Confirmed / Booking Closed</option>
                    <option value="LOADING">Container Loading & Sealing</option>
                    <option value="SAILING">In Transit (Sailing / Flying)</option>
                    <option value="PORT_ARRIVAL">Arrived at Port of Tema</option>
                    <option value="CUSTOMS_CLEARING">Customs Clearing (ICUMS)</option>
                    <option value="DISTRIBUTED">Distributed to Pickup Hubs</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Locked USD/GHS Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15.65"
                    value={newBatch.lockedFxRate}
                    onChange={(e) => setNewBatch({ ...newBatch, lockedFxRate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Consolidation Cutoff Date
                  </label>
                  <input
                    type="date"
                    value={newBatch.cutoffDate}
                    onChange={(e) => setNewBatch({ ...newBatch, cutoffDate: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Estimated Arrival Date (ETA)
                  </label>
                  <input
                    type="date"
                    value={newBatch.eta}
                    onChange={(e) => setNewBatch({ ...newBatch, eta: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setAddBatchModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBatch}
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    cursor: submittingBatch ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {submittingBatch ? (
                    <>
                      <Loader2 size={18} className="spin" /> Registering Batch...
                    </>
                  ) : (
                    <>
                      <Anchor size={18} /> Deploy Logistics Batch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
