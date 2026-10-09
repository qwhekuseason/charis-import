import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'charis_super_secret_jwt_key_2026_accra';

// Ensure public/uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `prod-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB max file size
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|avif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF, AVIF) are allowed'));
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ---------------------------------------------------------------------------
// Auth Helper Middlewares
// ---------------------------------------------------------------------------
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        address: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      if (user) req.user = user;
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Admin privileges required.' });
  }
  next();
};

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    res.json({
      status: 'healthy',
      database: 'connected (Neon PostgreSQL)',
      productCount,
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Authentication API (/api/auth)
// ---------------------------------------------------------------------------

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, city, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        city: city ? city.trim() : 'Accra',
        address: address ? address.trim() : null,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        address: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log(`👤 New user registered: ${newUser.name} (${newUser.email})`);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide both email and password.' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      city: user.city,
      address: user.address,
      createdAt: user.createdAt,
    };

    console.log(`🔓 User logged in: ${user.name} (${user.role})`);

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me (Get current logged-in user profile + orders)
app.get('/api/auth/me', authenticateUser, async (req, res) => {
  try {
    const userWithOrders = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        address: true,
        createdAt: true,
        orders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json({ success: true, user: userWithOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/auth/profile (Update personal profile)
app.put('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    const { name, phone, city, address } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
        ...(city && { city: city.trim() }),
        ...(address !== undefined && { address: address ? address.trim() : null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        address: true,
        createdAt: true,
      },
    });

    res.json({ success: true, message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/users (Admin: list registered users)
app.get('/api/auth/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        city: true,
        address: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Products API
// ---------------------------------------------------------------------------

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, sort, featured } = req.query;

    const where = {};

    if (category && category !== 'all') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (featured === 'true') {
      where.badge = { not: null };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price-low') {
      orderBy = { price: 'asc' };
    } else if (sort === 'price-high') {
      orderBy = { price: 'desc' };
    } else if (sort === 'rating') {
      orderBy = { rating: 'desc' };
    } else if (sort === 'name') {
      orderBy = { name: 'asc' };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
    });

    const formatted = products.map((p) => ({
      ...p,
      images: p.gallery && p.gallery.length > 0 ? p.gallery : [p.image],
      specifications: p.specs || [],
      reviewCount: p.reviewsCount,
    }));

    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/products/:idOrSlug
app.get('/api/products/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    res.json({
      success: true,
      data: {
        ...product,
        images: product.gallery && product.gallery.length > 0 ? product.gallery : [product.image],
        specifications: product.specs || [],
        reviewCount: product.reviewsCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/upload (Admin upload product image)
app.post('/api/upload', authenticateUser, requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file was provided' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    console.log(`📸 Image uploaded successfully: ${fileUrl} (${(req.file.size / 1024).toFixed(1)} KB)`);

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

// POST /api/products (Add product — Admin only)
app.post('/api/products', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, category, price, originalPrice, inStock, badge, image, gallery, description, specs } = req.body;

    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug,
        category,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        inStock: Boolean(inStock ?? true),
        badge: badge || null,
        image: image || (gallery && gallery[0]) || '',
        gallery: gallery || (image ? [image] : []),
        description: description || '',
        specs: specs || null,
      },
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/products/:id (Update product — Admin only)
app.put('/api/products/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, originalPrice, inStock, badge, image, gallery, description, specs } = req.body;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(originalPrice !== undefined && { originalPrice: originalPrice ? parseFloat(originalPrice) : null }),
        ...(inStock !== undefined && { inStock: Boolean(inStock) }),
        ...(badge !== undefined && { badge }),
        ...(image && { image }),
        ...(gallery && { gallery }),
        ...(description !== undefined && { description }),
        ...(specs !== undefined && { specs }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/products/:id (Admin only)
app.delete('/api/products/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Categories API
// ---------------------------------------------------------------------------

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    const counts = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    const countMap = {};
    counts.forEach((c) => {
      countMap[c.category.toLowerCase()] = c._count.id;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      itemCount: countMap[cat.name.toLowerCase()] || 0,
    }));

    res.json({ success: true, data: categoriesWithCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

// POST /api/orders (Checkout create order)
app.post('/api/orders', optionalAuth, async (req, res) => {
  try {
    const {
      orderCode: clientOrderCode,
      orderId,
      customerName,
      phone,
      email,
      city,
      address,
      deliveryMethod,
      paymentMethod,
      items,
      subtotal,
      deliveryFee,
      shippingCost,
      total,
      notes,
    } = req.body;

    if (!customerName || !phone || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required customer details or order items',
      });
    }

    // Determine final order code — respect client provided code (e.g. CHR-SEA-4821) while guaranteeing uniqueness
    let finalOrderCode = (clientOrderCode || orderId || '').trim().toUpperCase();
    if (finalOrderCode) {
      const existing = await prisma.order.findUnique({
        where: { orderCode: finalOrderCode },
      });
      if (existing) {
        finalOrderCode = `${finalOrderCode}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      finalOrderCode = `CHR-${new Date().getFullYear()}-${randomDigits}`;
    }

    const parsedDeliveryFee = parseFloat(deliveryFee !== undefined ? deliveryFee : (shippingCost !== undefined ? shippingCost : 0));
    const parsedSubtotal = parseFloat(subtotal || 0);
    const parsedTotal = parseFloat(total !== undefined ? total : (parsedSubtotal + parsedDeliveryFee));

    const order = await prisma.order.create({
      data: {
        orderCode: finalOrderCode,
        customerName,
        phone,
        email: email || (req.user ? req.user.email : null),
        city: city || 'Accra',
        address: address || '',
        deliveryMethod: deliveryMethod || 'Standard Delivery',
        paymentMethod: paymentMethod || 'Cash on Delivery',
        paymentStatus: paymentMethod === 'Cash on Delivery' ? 'PENDING' : 'VERIFYING',
        orderStatus: 'PROCESSING',
        subtotal: parsedSubtotal,
        deliveryFee: parsedDeliveryFee,
        total: parsedTotal,
        items: items,
        notes: notes || null,
        ...(req.user && { userId: req.user.id }),
      },
    });

    console.log(`[Order] New order placed: ${order.orderCode} by ${customerName} (GH₵${parsedTotal.toFixed(2)})`);

    if (req.body.couponCode || req.body.promoCode) {
      const codeToUpdate = (req.body.couponCode || req.body.promoCode).trim().toUpperCase();
      prisma.discount.update({
        where: { code: codeToUpdate },
        data: { usedCount: { increment: 1 } }
      }).catch(() => {});
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders/:code (Track Order)
app.get('/api/orders/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { orderCode: cleanCode },
          { id: code },
        ],
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: `Order with tracking code "${code}" not found.`,
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/orders (List all orders — Admin only)
app.get('/api/orders', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/orders/:id/status (Update order status — Admin only)
app.patch('/api/orders/:id/status', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Inquiries / Contact API
// ---------------------------------------------------------------------------

// POST /api/inquiries (Contact Form)
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and message',
      });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject: subject || 'General Inquiry',
        message,
      },
    });

    console.log(`✉️ New contact message received from ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. We will get back to you shortly.',
      data: inquiry,
    });
  } catch (error) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/inquiries (Admin only)
app.get('/api/inquiries', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Discounts & Promo Codes API
// ---------------------------------------------------------------------------

// Auto-seed default discounts if table is empty
const seedInitialDiscounts = async () => {
  try {
    const count = await prisma.discount.count();
    if (count === 0) {
      await prisma.discount.createMany({
        data: [
          {
            code: 'CHARIS10',
            description: '10% off promotional store coupon',
            type: 'PERCENTAGE',
            value: 10,
            minOrderAmount: 0,
            isActive: true,
          },
          {
            code: 'WELCOME',
            description: 'New customer welcome discount of GH₵15 off',
            type: 'FIXED',
            value: 15,
            minOrderAmount: 50,
            isActive: true,
          },
          {
            code: 'VIPDISPATCH',
            description: 'GH₵25 discount on bulk orders over GH₵250',
            type: 'FIXED',
            value: 25,
            minOrderAmount: 250,
            isActive: true,
          }
        ]
      });
      console.log('🎟️ Seeded initial store discount codes (CHARIS10, WELCOME, VIPDISPATCH)');
    }
  } catch (err) {
    console.warn('Initial discounts check:', err.message);
  }
};
seedInitialDiscounts();

// GET /api/discounts (Admin list all discount codes)
app.get('/api/discounts', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: discounts.length, data: discounts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/discounts (Admin create discount code)
app.post('/api/discounts', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive
    } = req.body;

    if (!code || value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        error: 'Discount code and value are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.discount.findUnique({
      where: { code: cleanCode }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Discount code "${cleanCode}" already exists.`
      });
    }

    const created = await prisma.discount.create({
      data: {
        code: cleanCode,
        description: description ? description.trim() : null,
        type: type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: parseFloat(value),
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit, 10) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    console.log(`[Discounts] Admin created promo code: ${created.code} (${created.type} ${created.value})`);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating discount:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/discounts/:id (Admin update discount or toggle active status)
app.put('/api/discounts/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      expiresAt,
      isActive
    } = req.body;

    const data = {};
    if (code) data.code = code.trim().toUpperCase();
    if (description !== undefined) data.description = description ? description.trim() : null;
    if (type) data.type = type === 'FIXED' ? 'FIXED' : 'PERCENTAGE';
    if (value !== undefined) data.value = parseFloat(value);
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : 0;
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (usageLimit !== undefined) data.usageLimit = usageLimit ? parseInt(usageLimit, 10) : null;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.discount.update({
      where: { id },
      data
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/discounts/:id (Admin delete discount)
app.delete('/api/discounts/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.discount.delete({ where: { id } });
    res.json({ success: true, message: 'Discount deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/discounts/validate (Public / Customer validate promo code)
app.post('/api/discounts/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Please enter a promo code.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const discount = await prisma.discount.findUnique({
      where: { code: cleanCode }
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        error: `Promo code "${cleanCode}" is invalid.`
      });
    }

    if (!discount.isActive) {
      return res.status(400).json({
        success: false,
        error: `Promo code "${cleanCode}" is currently inactive.`
      });
    }

    // Check expiration
    if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
      return res.status(400).json({
        success: false,
        error: `Promo code "${cleanCode}" has expired.`
      });
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return res.status(400).json({
        success: false,
        error: `Promo code "${cleanCode}" has reached its maximum redemptions.`
      });
    }

    const currentSubtotal = parseFloat(subtotal || 0);

    // Check minimum order amount
    if (discount.minOrderAmount && currentSubtotal < discount.minOrderAmount) {
      return res.status(400).json({
        success: false,
        error: `Cart subtotal must be at least GH₵${discount.minOrderAmount.toFixed(2)} to use "${cleanCode}".`
      });
    }

    // Calculate discount amount
    let calculatedDiscount = 0;
    if (discount.type === 'PERCENTAGE') {
      calculatedDiscount = (currentSubtotal * discount.value) / 100;
      if (discount.maxDiscount && calculatedDiscount > discount.maxDiscount) {
        calculatedDiscount = discount.maxDiscount;
      }
    } else {
      // FIXED
      calculatedDiscount = Math.min(discount.value, currentSubtotal);
    }

    res.json({
      success: true,
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount: calculatedDiscount,
      message: discount.type === 'PERCENTAGE'
        ? `${discount.value}% discount applied! (-GH₵${calculatedDiscount.toFixed(2)})`
        : `GH₵${discount.value.toFixed(2)} discount applied!`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/discounts/active (Public - get active promo codes for customer checkout)
app.get('/api/discounts/active', async (req, res) => {
  try {
    const discounts = await prisma.discount.findMany({
      where: { isActive: true },
      orderBy: { value: 'desc' }
    });
    res.json({
      success: true,
      data: discounts.map((d) => ({
        code: d.code,
        type: d.type,
        value: d.value,
        badge: d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `GH₵${d.value} OFF`,
        description: d.description || `Special discount on your order`,
        minSpend: d.minOrderAmount || 0,
        expiresAt: d.expiresAt
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Container Batches & Logistics API (/api/batches)
// ---------------------------------------------------------------------------

// GET /api/batches (List all container batches)
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/batches/active (Get primary active container batch for store)
app.get('/api/batches/active', async (req, res) => {
  try {
    const activeSeaBatch = await prisma.batch.findFirst({
      where: { type: 'SEA_FCL', isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    const activeAirBatch = await prisma.batch.findFirst({
      where: { type: 'AIR_CARGO', isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        sea: activeSeaBatch,
        air: activeAirBatch,
        primary: activeSeaBatch || activeAirBatch
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/batches (Admin create new container / air cargo batch)
app.post('/api/batches', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const {
      batchNumber,
      type,
      containerType,
      carrier,
      originPort,
      destinationPort,
      capacityCbm,
      allocatedCbm,
      capacityKg,
      allocatedKg,
      totalOrders,
      status,
      cutoffDate,
      eta,
      lockedFxRate,
      isActive
    } = req.body;

    if (!batchNumber || !carrier) {
      return res.status(400).json({
        success: false,
        error: 'Batch number and carrier / vessel name are required.'
      });
    }

    const cleanBatchNumber = batchNumber.trim().toUpperCase();
    const existing = await prisma.batch.findUnique({
      where: { batchNumber: cleanBatchNumber }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: `Batch with number "${cleanBatchNumber}" already exists.`
      });
    }

    const created = await prisma.batch.create({
      data: {
        batchNumber: cleanBatchNumber,
        type: type || 'SEA_FCL',
        containerType: containerType || (type === 'AIR_CARGO' ? 'ULD Palletized Air Freight' : '40ft High Cube Container'),
        carrier: carrier.trim(),
        originPort: originPort || (type === 'AIR_CARGO' ? 'Yiwu International Cargo Terminal' : 'Guangzhou Port, China'),
        destinationPort: destinationPort || (type === 'AIR_CARGO' ? 'Kotoka International Airport (KIA), Accra' : 'Port of Tema (MPS Terminal 3)'),
        capacityCbm: capacityCbm ? parseFloat(capacityCbm) : null,
        allocatedCbm: allocatedCbm ? parseFloat(allocatedCbm) : 0,
        capacityKg: capacityKg ? parseFloat(capacityKg) : null,
        allocatedKg: allocatedKg ? parseFloat(allocatedKg) : 0,
        totalOrders: totalOrders ? parseInt(totalOrders, 10) : 0,
        status: status || 'CONFIRMED',
        cutoffDate: cutoffDate || null,
        eta: eta || null,
        lockedFxRate: lockedFxRate ? lockedFxRate.toString() : '15.65',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      }
    });

    console.log(`[Batches] Admin created logistics batch: ${created.batchNumber} (${created.type})`);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Error creating batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/batches/:id (Admin update batch details or advance status)
app.put('/api/batches/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      batchNumber,
      type,
      containerType,
      carrier,
      originPort,
      destinationPort,
      capacityCbm,
      allocatedCbm,
      capacityKg,
      allocatedKg,
      totalOrders,
      status,
      cutoffDate,
      eta,
      lockedFxRate,
      isActive
    } = req.body;

    const data = {};
    if (batchNumber) data.batchNumber = batchNumber.trim().toUpperCase();
    if (type) data.type = type;
    if (containerType) data.containerType = containerType;
    if (carrier) data.carrier = carrier.trim();
    if (originPort) data.originPort = originPort;
    if (destinationPort) data.destinationPort = destinationPort;
    if (capacityCbm !== undefined) data.capacityCbm = capacityCbm ? parseFloat(capacityCbm) : null;
    if (allocatedCbm !== undefined) data.allocatedCbm = allocatedCbm ? parseFloat(allocatedCbm) : 0;
    if (capacityKg !== undefined) data.capacityKg = capacityKg ? parseFloat(capacityKg) : null;
    if (allocatedKg !== undefined) data.allocatedKg = allocatedKg ? parseFloat(allocatedKg) : 0;
    if (totalOrders !== undefined) data.totalOrders = parseInt(totalOrders, 10);
    if (status) data.status = status;
    if (cutoffDate !== undefined) data.cutoffDate = cutoffDate;
    if (eta !== undefined) data.eta = eta;
    if (lockedFxRate !== undefined) data.lockedFxRate = lockedFxRate ? lockedFxRate.toString() : '15.65';
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.batch.update({
      where: { id },
      data
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating batch:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/batches/:id (Admin delete batch)
app.delete('/api/batches/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.batch.delete({ where: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Product Reviews API (/api/reviews)
// ---------------------------------------------------------------------------

// GET /api/reviews (Get reviews for a product or all)
app.get('/api/reviews', async (req, res) => {
  try {
    const { productId } = req.query;
    const where = productId ? { productId } : {};
    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: { id: true, name: true, slug: true }
        }
      }
    });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/reviews (Submit a verified customer review)
app.post('/api/reviews', async (req, res) => {
  try {
    const { productId, userName, userCity, rating, title, comment } = req.body;

    if (!productId || !comment) {
      return res.status(400).json({ success: false, error: 'Product ID and comment are required.' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    const review = await prisma.review.create({
      data: {
        productId,
        userName: userName ? userName.trim() : 'Verified Buyer',
        userCity: userCity ? userCity.trim() : 'Accra',
        rating: numericRating,
        title: title ? title.trim() : null,
        comment: comment.trim(),
        verified: true,
      }
    });

    // Recalculate and update product's rating and reviewsCount in database
    const allProductReviews = await prisma.review.findMany({ where: { productId } });
    const avgRating = allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewsCount: allProductReviews.length,
      }
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Production Static Serving (Single-Port Deployment)
// ---------------------------------------------------------------------------
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CHARIS Import API Server running on http://localhost:${PORT}`);
  console.log(`📦 Connected to Neon PostgreSQL Database with JWT Auth`);
});
