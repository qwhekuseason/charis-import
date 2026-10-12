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
import crypto from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
// Login tokens are signed with this secret — a guessable value would let anyone forge an admin login.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET === 'your_secure_jwt_secret_here') {
  console.error('❌ JWT_SECRET is missing or too weak. Set a random value of 32+ characters in your environment (e.g. Render → Environment).');
  process.exit(1);
}

// Image storage: Cloudinary when CLOUDINARY_URL is set (permanent, survives redeploys),
// otherwise the local public/uploads folder (fine for development only — Render wipes it).
cloudinary.config(true); // re-read CLOUDINARY_URL now that dotenv has loaded it
cloudinary.config({ secure: true });
const cloudinaryEnabled = Boolean(process.env.CLOUDINARY_URL && cloudinary.config().cloud_name);
console.log(cloudinaryEnabled
  ? `🖼️  Image uploads → Cloudinary (${cloudinary.config().cloud_name})`
  : '⚠️  CLOUDINARY_URL not set — uploads are saved locally and will be lost on redeploy.');

const uploadsDir = path.join(__dirname, '../public/uploads');
if (!cloudinaryEnabled && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadToCloudinary = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'chari/products',
      resource_type: 'image',
      // Cap stored originals at 2000px so phone photos don't eat the free quota.
      transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
    },
    (error, result) => (error ? reject(error) : resolve(result))
  );
  stream.end(buffer);
});

// Delivery URL: auto WebP/AVIF + auto quality, max 1200px — much lighter on mobile data.
const optimizedImageUrl = (publicId) => cloudinary.url(publicId, {
  secure: true,
  transformation: [{ width: 1200, crop: 'limit', fetch_format: 'auto', quality: 'auto' }],
});

const upload = multer({
  storage: multer.memoryStorage(),
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

// "Food & Snacks" → "food-snacks" (must match src/utils/categories.js)
const slugify = (value) => String(value || '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── Deals ──────────────────────────────────────────────────────────────
// A deal set in Admin (dealPrice + dealEndsAt) replaces the price until it ends,
// then the normal price comes back by itself — no one has to remember to undo it.
const isDealActive = (p) =>
  p.dealPrice != null && p.dealEndsAt != null && new Date(p.dealEndsAt) > new Date() && p.dealPrice < p.price;
const effectivePrice = (p) => (isDealActive(p) ? p.dealPrice : p.price);

// Product as the shop and Admin see it. `price` is what customers pay right now;
// `listPrice` / `listWasPrice` are the normal prices Admin edits.
const formatProduct = (p) => {
  const onDeal = isDealActive(p);
  return {
    ...p,
    price: onDeal ? p.dealPrice : p.price,
    // During a deal the crossed-out price is the normal price, so "−25%" means what the admin set.
    originalPrice: onDeal ? p.price : p.originalPrice,
    listPrice: p.price,
    listWasPrice: p.originalPrice,
    onDeal,
    dealEndsAt: onDeal ? p.dealEndsAt : null,
    images: p.gallery && p.gallery.length > 0 ? p.gallery : [p.image],
    categorySlug: slugify(p.category),
    justLanded: p.badge === 'New',
    specifications: p.specs || [],
    // Stars only when real customers have reviewed it (new products default to 4.8 in the database).
    rating: p.reviewsCount > 0 ? p.rating : 0,
    reviewCount: p.reviewsCount,
  };
};

// Render sits behind a proxy — trust it so req.ip is the visitor's real address.
app.set('trust proxy', 1);

// Simple in-memory limiter: blocks repeated guessing of passwords and order codes.
const rateLimit = ({ windowMs, max, message }) => {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();
  return (req, res, next) => {
    const now = Date.now();
    const entry = hits.get(req.ip);
    if (!entry || entry.resetAt <= now) {
      hits.set(req.ip, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ success: false, error: message });
    }
    next();
  };
};

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many attempts. Please wait 15 minutes and try again.' });
const inquiryLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, message: 'Too many messages sent. Please wait a few minutes or chat with us on WhatsApp.' });
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many tracking lookups. Please wait a few minutes and try again.' });

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
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, city, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'An account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Link to whoever invited them. Ignore codes that don't exist or point at the same phone number.
    let referredById = null;
    const inviteCode = String(req.body.referralCode || '').trim().toUpperCase();
    if (inviteCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode: inviteCode } });
      const samePhone = referrer?.phone && phone && normalizePhone(referrer.phone) === normalizePhone(phone);
      if (referrer && !samePhone) referredById = referrer.id;
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: phone ? phone.trim() : null,
        city: city ? city.trim() : 'Accra',
        address: address ? address.trim() : null,
        role: 'CUSTOMER',
        referralCode: await generateReferralCode(),
        referredById,
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
app.post('/api/auth/login', authLimiter, async (req, res) => {
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

// PUT /api/auth/password — change your own password (needs the current one)
app.put('/api/auth/password', authLimiter, authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(String(currentPassword || ''), user.password))) {
      return res.status(400).json({ success: false, error: 'Your current password is not correct.' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(String(newPassword), 10) } });
    res.json({ success: true, message: 'Password changed.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not change the password.' });
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
        creditBalance: true,
        referralCode: true,
        _count: { select: { orders: true, referrals: true } },
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

    const formatted = products.map(formatProduct);

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
      data: formatProduct(product),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/upload (Admin upload product image)
app.post('/api/upload', authenticateUser, requireAdmin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file was provided' });
    }

    try {
      let fileUrl;
      let filename;
      if (cloudinaryEnabled) {
        const result = await uploadToCloudinary(req.file.buffer);
        fileUrl = optimizedImageUrl(result.public_id);
        filename = result.public_id;
      } else {
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        filename = `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`;
        await fs.promises.writeFile(path.join(uploadsDir, filename), req.file.buffer);
        fileUrl = `/uploads/${filename}`;
      }

      console.log(`📸 Image uploaded: ${fileUrl} (${(req.file.size / 1024).toFixed(1)} KB)`);
      res.json({ success: true, url: fileUrl, filename, size: req.file.size });
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      res.status(502).json({ success: false, error: 'Image upload failed. Please try again.' });
    }
  });
});

// Checks admin product input and turns it into clean database fields.
// `partial` = an edit, where only the fields sent are changed.
const parseProductInput = (body, { partial = false } = {}) => {
  const data = {};
  const has = (k) => body[k] !== undefined;

  if (!partial || has('name')) {
    const name = String(body.name || '').trim();
    if (!name) return { error: 'Please enter a product name.' };
    if (name.length > 120) return { error: 'Product name is too long (120 characters max).' };
    data.name = name;
  }
  if (!partial || has('category')) {
    const category = String(body.category || '').trim();
    if (!category) return { error: 'Please choose a category.' };
    data.category = category;
  }
  if (!partial || has('price')) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) return { error: 'Price must be a number above 0.' };
    data.price = roundMoney(price);
  }
  if (has('originalPrice')) {
    if (body.originalPrice === null || body.originalPrice === '') {
      data.originalPrice = null;
    } else {
      const was = Number(body.originalPrice);
      if (!Number.isFinite(was) || was <= 0) return { error: '"Was" price must be a number above 0, or left empty.' };
      data.originalPrice = roundMoney(was);
    }
  }
  if (has('inStock') || !partial) data.inStock = body.inStock === undefined ? true : Boolean(body.inStock);
  if (has('badge')) data.badge = body.badge ? String(body.badge).trim().slice(0, 30) : null;
  if (has('description') || !partial) data.description = String(body.description || '').trim();
  if (has('specs')) data.specs = body.specs || null;

  if (has('gallery') || has('image') || !partial) {
    const gallery = (Array.isArray(body.gallery) ? body.gallery : [])
      .map((u) => String(u || '').trim())
      .filter(Boolean)
      .slice(0, 8);
    const main = String(body.image || '').trim() || gallery[0] || '';
    if (!main && !partial) return { error: 'Please add at least one photo.' };
    if (main) {
      data.image = main;
      data.gallery = [main, ...gallery.filter((u) => u !== main)];
    }
  }
  return { data };
};

const uniqueProductSlug = async (name, excludeId = null) => {
  const base = slugify(name) || 'product';
  let slug = base;
  for (let n = 2; ; n++) {
    const clash = await prisma.product.findUnique({ where: { slug } });
    if (!clash || clash.id === excludeId) return slug;
    slug = `${base}-${n}`;
  }
};

// The "was" price must be higher than the selling price, or the store shows a negative discount.
const checkWasPrice = (price, originalPrice) =>
  originalPrice != null && price != null && originalPrice <= price
    ? '"Was" price must be higher than the selling price (or leave it empty).'
    : null;

// POST /api/products (Add product — Admin only)
app.post('/api/products', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = parseProductInput(req.body);
    if (error) return res.status(400).json({ success: false, error });
    const wasError = checkWasPrice(data.price, data.originalPrice);
    if (wasError) return res.status(400).json({ success: false, error: wasError });

    const newProduct = await prisma.product.create({
      data: { ...data, slug: await uniqueProductSlug(data.name) },
    });

    res.status(201).json({ success: true, data: formatProduct(newProduct) });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ success: false, error: 'Could not save the product. Please try again.' });
  }
});

// PUT /api/products/:id (Update product — Admin only)
app.put('/api/products/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });

    const { data, error } = parseProductInput(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, error });
    const wasError = checkWasPrice(data.price ?? existing.price, data.originalPrice !== undefined ? data.originalPrice : existing.originalPrice);
    if (wasError) return res.status(400).json({ success: false, error: wasError });

    if (data.name && data.name !== existing.name) data.slug = await uniqueProductSlug(data.name, existing.id);

    const updated = await prisma.product.update({ where: { id: existing.id }, data });
    res.json({ success: true, data: formatProduct(updated) });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, error: 'Could not update the product. Please try again.' });
  }
});

// DELETE /api/products/:id (Admin only)
app.delete('/api/products/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Product not found.' });
    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not delete the product. Please try again.' });
  }
});

// ---------------------------------------------------------------------------
// Deals API (Admin)
// ---------------------------------------------------------------------------

// POST /api/deals — put one or more products on deal until a given date/time.
// Body: { endsAt, items: [{ productId, dealPrice }] }
app.post('/api/deals', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const endsAt = new Date(req.body.endsAt);
    if (Number.isNaN(endsAt.getTime()) || endsAt <= new Date()) {
      return res.status(400).json({ success: false, error: 'Choose an end date and time in the future.' });
    }
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ success: false, error: 'Choose at least one product.' });

    const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => String(i.productId)) } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const p = byId.get(String(item.productId));
      const dealPrice = Number(item.dealPrice);
      if (!p) return res.status(400).json({ success: false, error: 'One of the products no longer exists. Refresh and try again.' });
      if (!Number.isFinite(dealPrice) || dealPrice <= 0 || dealPrice >= p.price) {
        return res.status(400).json({ success: false, error: `Deal price for "${p.name}" must be above 0 and below its normal price (GH₵${p.price.toFixed(2)}).` });
      }
    }

    const updated = await prisma.$transaction(items.map((item) =>
      prisma.product.update({
        where: { id: String(item.productId) },
        data: { dealPrice: roundMoney(Number(item.dealPrice)), dealEndsAt: endsAt },
      })
    ));
    res.json({ success: true, data: updated.map(formatProduct) });
  } catch (error) {
    console.error('Error saving deals:', error);
    res.status(500).json({ success: false, error: 'Could not save the deal. Please try again.' });
  }
});

// DELETE /api/deals/:productId — end a deal now (normal price returns).
app.delete('/api/deals/:productId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const updated = await prisma.product.update({
      where: { id: req.params.productId },
      data: { dealPrice: null, dealEndsAt: null },
    });
    res.json({ success: true, data: formatProduct(updated) });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Product not found.' });
  }
});

// ---------------------------------------------------------------------------
// Store settings (business details & site text the admin can change)
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  phoneDisplay: '+233 59 144 0934',
  whatsappNumber: '233591440934',
  momoNumber: '059 144 0934',
  momoName: 'CHARIS IMPORT',
  email: 'support@charisimport.com',
  location: 'Kumasi, Ghana',
  pickupPoint: 'Kumasi',
  openingHours: 'Monday – Saturday, 8:00 am – 6:30 pm',
  announcements: [
    'Invite a friend, earn GH₵25 in store credit',
    "Seen it online? Request any item and we'll source it",
  ],
};

const SETTING_RULES = {
  phoneDisplay: (v) => typeof v === 'string' && v.trim().length >= 9 && v.trim().length <= 30,
  whatsappNumber: (v) => typeof v === 'string' && /^\d{10,15}$/.test(v.replace(/\D/g, '')),
  momoNumber: (v) => typeof v === 'string' && v.replace(/\D/g, '').length >= 9,
  momoName: (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 60,
  email: (v) => typeof v === 'string' && (v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())),
  location: (v) => typeof v === 'string' && v.trim().length > 1 && v.length <= 120,
  pickupPoint: (v) => typeof v === 'string' && v.trim().length > 1 && v.length <= 120,
  openingHours: (v) => typeof v === 'string' && v.length <= 120,
  announcements: (v) => Array.isArray(v) && v.length <= 6 && v.every((m) => typeof m === 'string' && m.length <= 120),
};

const SETTING_LABELS = {
  phoneDisplay: 'phone number',
  whatsappNumber: 'WhatsApp number (digits with country code, e.g. 233591440934)',
  momoNumber: 'MoMo number',
  momoName: 'MoMo account name',
  email: 'email address',
  location: 'business location',
  pickupPoint: 'pickup point',
  openingHours: 'opening hours',
  announcements: 'banner messages (up to 6, each under 120 characters)',
};

const loadSettings = async () => {
  const rows = await prisma.storeSetting.findMany();
  // Only public settings — the treasure hunt (with its codes) is stored here too but never sent out.
  const saved = Object.fromEntries(rows.filter((r) => r.key in DEFAULT_SETTINGS).map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...saved };
};

// GET /api/settings — public
app.get('/api/settings', async (req, res) => {
  try {
    res.json({ success: true, data: await loadSettings() });
  } catch (error) {
    // Database not updated yet → still serve the defaults so the site works.
    res.json({ success: true, data: DEFAULT_SETTINGS });
  }
});

// PUT /api/settings — Admin
app.put('/api/settings', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const changes = {};
    for (const [key, value] of Object.entries(req.body || {})) {
      if (!SETTING_RULES[key]) continue;
      const clean = key === 'whatsappNumber' ? String(value).replace(/\D/g, '')
        : key === 'announcements' ? value.map((m) => String(m).trim()).filter(Boolean)
        : typeof value === 'string' ? value.trim() : value;
      if (!SETTING_RULES[key](key === 'announcements' ? clean : value)) {
        return res.status(400).json({ success: false, error: `Please check the ${SETTING_LABELS[key] || key}.` });
      }
      changes[key] = clean;
    }
    for (const [key, value] of Object.entries(changes)) {
      await prisma.storeSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
    }
    res.json({ success: true, data: await loadSettings() });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ success: false, error: 'Could not save settings.' });
  }
});

// ---------------------------------------------------------------------------
// Treasure hunt — promo codes hidden around the site
//   Admin hides a promo code at a spot (a page, the footer, or inside a product).
//   The shop only learns WHERE gems are; the code is revealed when someone finds one.
// ---------------------------------------------------------------------------
const HUNT_SPOTS = {
  'home-hero': 'Home page — top',
  'home-categories': 'Home page — categories',
  'shop-header': 'Shop page — top',
  'categories-page': 'Categories page',
  'about-page': 'About page',
  'import-tips-page': 'Buying guide page',
  'contact-page': 'Contact page',
  'track-page': 'Track order page',
  footer: 'Footer (every page)',
};
const huntLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many tries. Please wait a few minutes.' });

const loadHunt = async () => {
  const row = await prisma.storeSetting.findUnique({ where: { key: 'treasureHunt' } });
  return Array.isArray(row?.value) ? row.value : [];
};
const saveHunt = (items) =>
  prisma.storeSetting.upsert({ where: { key: 'treasureHunt' }, update: { value: items }, create: { key: 'treasureHunt', value: items } });

// A gem only shows while its promo code can actually be used.
const usableDiscount = async (code) => {
  const d = await prisma.discount.findUnique({ where: { code } });
  if (!d || !d.isActive) return null;
  if (d.expiresAt && new Date() > new Date(d.expiresAt)) return null;
  if (d.usageLimit && d.usedCount >= d.usageLimit) return null;
  return d;
};

// GET /api/hunt/spots — public: where gems are hidden (no codes)
app.get('/api/hunt/spots', async (req, res) => {
  try {
    const items = await loadHunt();
    const visible = [];
    for (const item of items) {
      if (item.active && (await usableDiscount(item.code))) visible.push({ id: item.id, spot: item.spot, clue: item.clue || '' });
    }
    res.json({ success: true, data: visible });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/hunt/:id/claim — public: reveal the code for a gem that was found
app.post('/api/hunt/:id/claim', huntLimiter, async (req, res) => {
  try {
    const items = await loadHunt();
    const item = items.find((i) => i.id === req.params.id && i.active);
    const discount = item && (await usableDiscount(item.code));
    if (!discount) return res.status(404).json({ success: false, error: 'This treasure has already been taken. Keep hunting!' });

    item.finds = (item.finds || 0) + 1;
    await saveHunt(items);

    res.json({
      success: true,
      data: {
        code: discount.code,
        offer: discount.type === 'PERCENTAGE' ? `${discount.value}% off` : `GH₵${discount.value} off`,
        maxDiscount: discount.maxDiscount,
        minOrderAmount: discount.minOrderAmount || 0,
        expiresAt: discount.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not open the treasure. Please try again.' });
  }
});

// GET /api/hunt — Admin: everything, including codes and how often each was found
app.get('/api/hunt', authenticateUser, requireAdmin, async (req, res) => {
  try {
    res.json({ success: true, data: { items: await loadHunt(), spots: HUNT_SPOTS } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not load the treasure hunt.' });
  }
});

// PUT /api/hunt — Admin: replace the list of hidden coupons
app.put('/api/hunt', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.items) ? req.body.items : null;
    if (!incoming || incoming.length > 30) return res.status(400).json({ success: false, error: 'Send a list of up to 30 hidden coupons.' });
    const existing = new Map((await loadHunt()).map((i) => [i.id, i]));
    const clean = [];
    for (const raw of incoming) {
      const code = String(raw.code || '').trim().toUpperCase();
      const spot = String(raw.spot || '');
      if (!(await prisma.discount.findUnique({ where: { code } }))) {
        return res.status(400).json({ success: false, error: `Promo code "${code || '(empty)'}" doesn't exist. Create it in Promo codes first.` });
      }
      if (spot.startsWith('product:')) {
        if (!(await prisma.product.findUnique({ where: { id: spot.slice(8) } }))) {
          return res.status(400).json({ success: false, error: 'The product chosen as a hiding place no longer exists.' });
        }
      } else if (!HUNT_SPOTS[spot]) {
        return res.status(400).json({ success: false, error: 'Choose where to hide each coupon.' });
      }
      const id = raw.id && existing.has(raw.id) ? raw.id : crypto.randomBytes(6).toString('hex');
      clean.push({
        id,
        code,
        spot,
        clue: String(raw.clue || '').trim().slice(0, 140),
        active: raw.active !== false,
        finds: existing.get(id)?.finds || 0,
      });
    }
    await saveHunt(clean);
    res.json({ success: true, data: { items: clean, spots: HUNT_SPOTS } });
  } catch (error) {
    console.error('Error saving treasure hunt:', error);
    res.status(500).json({ success: false, error: 'Could not save the treasure hunt.' });
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

// POST /api/categories (Admin) — { name, image }
app.post('/api/categories', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ success: false, error: 'Please enter a category name.' });
    const slug = slugify(name);
    if (await prisma.category.findUnique({ where: { slug } })) {
      return res.status(400).json({ success: false, error: `A category called "${name}" already exists.` });
    }
    const category = await prisma.category.create({
      data: { id: slug, name, slug, image: String(req.body.image || '').trim() || null },
    });
    res.status(201).json({ success: true, data: { ...category, itemCount: 0 } });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, error: 'Could not save the category.' });
  }
});

// PUT /api/categories/:id (Admin) — rename and/or change photo; products follow a rename.
app.put('/api/categories/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Category not found.' });

    const data = {};
    if (req.body.image !== undefined) data.image = String(req.body.image || '').trim() || null;
    if (req.body.name !== undefined) {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ success: false, error: 'Please enter a category name.' });
      const slug = slugify(name);
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash && clash.id !== existing.id) {
        return res.status(400).json({ success: false, error: `A category called "${name}" already exists.` });
      }
      data.name = name;
      data.slug = slug;
    }

    const oldName = existing.name;
    const updated = await prisma.$transaction(async (tx) => {
      const cat = await tx.category.update({ where: { id: existing.id }, data });
      if (data.name && data.name !== oldName) {
        await tx.product.updateMany({ where: { category: oldName }, data: { category: data.name } });
      }
      return cat;
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, error: 'Could not update the category.' });
  }
});

// DELETE /api/categories/:id (Admin) — only when no products use it
app.delete('/api/categories/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Category not found.' });
    const inUse = await prisma.product.count({ where: { category: existing.name } });
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        error: `${inUse} product${inUse === 1 ? '' : 's'} still use "${existing.name}". Move or delete them first.`,
      });
    }
    await prisma.category.delete({ where: { id: existing.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Could not delete the category.' });
  }
});

// ---------------------------------------------------------------------------
// Orders API
// ---------------------------------------------------------------------------

// POST /api/orders (Checkout create order)
// Delivery options offered at checkout. Fees are decided here, never by the browser.
const DELIVERY_OPTIONS = [
  { id: 'sea_freight', name: 'Sea shipping', fee: 35 },
  { id: 'air_cargo', name: 'Air shipping', fee: 75 },
  { id: 'local_express', name: 'Local delivery (Kumasi)', fee: 40 },
];

const roundMoney = (n) => Math.round(n * 100) / 100;

// Unambiguous characters only (no 0/O, 1/I) so codes are easy to read out over the phone.
const ORDER_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const generateOrderCode = (prefix) => {
  const bytes = crypto.randomBytes(8);
  const suffix = Array.from(bytes, (b) => ORDER_CODE_ALPHABET[b % ORDER_CODE_ALPHABET.length]).join('');
  return `${prefix}-${suffix}`;
};

// Compare Ghana numbers regardless of format (+233 24..., 024..., 24...).
const normalizePhone = (value) => String(value || '').replace(/\D/g, '').slice(-9);

// ---------------------------------------------------------------------------
// Referral programme
//   • A signed-up friend gets GH₵25 off their first order.
//   • The person who invited them gets GH₵25 store credit once that order is marked PAID.
//   • Credit is stored on the server, logged in CreditTransaction, and spent at checkout.
// ---------------------------------------------------------------------------
const REFERRAL_REWARD = 25;
const REFERRAL_WELCOME_DISCOUNT = 25;

async function generateReferralCode() {
  for (;;) {
    const bytes = crypto.randomBytes(6);
    const code = `CHARI-${Array.from(bytes, (b) => ORDER_CODE_ALPHABET[b % ORDER_CODE_ALPHABET.length]).join('')}`;
    if (!(await prisma.user.findUnique({ where: { referralCode: code } }))) return code;
  }
}

// Older accounts were created before referral codes existed.
async function ensureReferralCode(user) {
  if (user.referralCode) return user.referralCode;
  const referralCode = await generateReferralCode();
  await prisma.user.update({ where: { id: user.id }, data: { referralCode } });
  return referralCode;
}

async function isEligibleForWelcomeDiscount(user) {
  if (!user?.referredById) return false;
  const previousOrders = await prisma.order.count({
    where: { userId: user.id, orderStatus: { not: 'CANCELLED' } },
  });
  return previousOrders === 0;
}

// Pays the referrer once, when the invited friend's first order is paid.
async function rewardReferrerIfDue(order) {
  if (!order.userId || order.referralRewarded || order.paymentStatus !== 'PAID') return;
  const buyer = await prisma.user.findUnique({ where: { id: order.userId } });
  if (!buyer?.referredById) return;

  const earlierPaid = await prisma.order.count({
    where: { userId: buyer.id, paymentStatus: 'PAID', id: { not: order.id }, createdAt: { lt: order.createdAt } },
  });
  if (earlierPaid > 0) return;

  await prisma.$transaction(async (tx) => {
    // Flip the flag first so a double-click can't pay twice.
    const { count } = await tx.order.updateMany({
      where: { id: order.id, referralRewarded: false },
      data: { referralRewarded: true },
    });
    if (count === 0) return;
    await tx.user.update({ where: { id: buyer.referredById }, data: { creditBalance: { increment: REFERRAL_REWARD } } });
    await tx.creditTransaction.create({
      data: { userId: buyer.referredById, amount: REFERRAL_REWARD, type: 'REFERRAL_REWARD', orderId: order.id, note: `${buyer.name.split(' ')[0]}'s first order` },
    });
  });
  console.log(`🎁 Referral reward GH₵${REFERRAL_REWARD} paid for order ${order.orderCode}`);
}

// Gives back store credit when an order that used it is cancelled.
async function refundCreditIfCancelled(order) {
  if (order.orderStatus !== 'CANCELLED' || !order.userId || !(order.creditUsed > 0) || order.creditRefunded) return;
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: order.id, creditRefunded: false },
      data: { creditRefunded: true },
    });
    if (count === 0) return;
    await tx.user.update({ where: { id: order.userId }, data: { creditBalance: { increment: order.creditUsed } } });
    await tx.creditTransaction.create({
      data: { userId: order.userId, amount: order.creditUsed, type: 'ORDER_REFUND', orderId: order.id, note: `Order ${order.orderCode} cancelled` },
    });
  });
}

// GET /api/referrals/me — the signed-in customer's code, balance and history
app.get('/api/referrals/me', authenticateUser, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const referralCode = await ensureReferralCode(user);
    const [invited, rewards, history, welcomeDiscountAvailable] = await Promise.all([
      prisma.user.count({ where: { referredById: user.id } }),
      prisma.creditTransaction.count({ where: { userId: user.id, type: 'REFERRAL_REWARD' } }),
      prisma.creditTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
      isEligibleForWelcomeDiscount(user),
    ]);

    res.json({
      success: true,
      data: {
        referralCode,
        creditBalance: roundMoney(user.creditBalance || 0),
        invitedCount: invited,
        rewardedCount: rewards,
        rewardAmount: REFERRAL_REWARD,
        welcomeDiscount: REFERRAL_WELCOME_DISCOUNT,
        welcomeDiscountAvailable,
        history: history.map((t) => ({ id: t.id, amount: t.amount, type: t.type, note: t.note, createdAt: t.createdAt })),
      },
    });
  } catch (error) {
    console.error('Error loading referrals:', error);
    res.status(500).json({ success: false, error: 'Could not load your referral details.' });
  }
});

app.post('/api/orders', optionalAuth, async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      city,
      address,
      deliveryMethod,
      deliveryMethodId,
      paymentMethod,
      items,
      notes,
    } = req.body;

    if (!customerName || !phone || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required customer details or order items',
      });
    }

    // Re-price every line from the database — the browser's prices are ignored.
    const productIds = [...new Set(items.map((item) => String(item.id || '')))];
    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productById = new Map(products.map((p) => [p.id, p]));

    const pricedItems = [];
    for (const item of items) {
      const product = productById.get(String(item.id || ''));
      const qty = Number(item.qty ?? item.quantity);
      if (!product) {
        return res.status(400).json({ success: false, error: 'One of the items in your cart is no longer available. Please refresh and try again.' });
      }
      if (!product.inStock) {
        return res.status(400).json({ success: false, error: `"${product.name}" is currently out of stock.` });
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
        return res.status(400).json({ success: false, error: `Invalid quantity for "${product.name}".` });
      }
      pricedItems.push({
        id: product.id,
        name: product.name,
        qty,
        price: effectivePrice(product),
        image: product.image,
      });
    }

    const delivery = DELIVERY_OPTIONS.find((o) => o.id === deliveryMethodId)
      || DELIVERY_OPTIONS.find((o) => o.name === deliveryMethod);
    if (!delivery) {
      return res.status(400).json({ success: false, error: 'Please choose a valid delivery option.' });
    }

    const subtotal = roundMoney(pricedItems.reduce((sum, i) => sum + i.price * i.qty, 0));

    // Promo codes are re-validated here; an invalid or expired code simply gives no discount.
    const requestedCode = (req.body.couponCode || req.body.promoCode || '').trim().toUpperCase();
    const promo = requestedCode ? await evaluateDiscount(requestedCode, subtotal) : null;
    const promoDiscount = promo?.valid ? roundMoney(promo.discountAmount) : 0;

    // Invited customers get a one-off welcome discount on their first order (not combined with a promo code).
    const welcomeDiscount = req.user && (await isEligibleForWelcomeDiscount(req.user))
      ? Math.min(REFERRAL_WELCOME_DISCOUNT, subtotal)
      : 0;
    const useWelcome = welcomeDiscount > promoDiscount;
    const discountAmount = useWelcome ? welcomeDiscount : promoDiscount;
    const couponCode = useWelcome ? 'REFERRAL-WELCOME' : (promo?.valid ? promo.code : null);

    // Store credit (signed-in customers only), capped at what's left of the product cost.
    const wantsCredit = Boolean(req.user && req.body.useCredit);
    const creditUsed = wantsCredit
      ? roundMoney(Math.min(req.user.creditBalance || 0, Math.max(0, subtotal - discountAmount)))
      : 0;

    const total = roundMoney(Math.max(0, subtotal - discountAmount - creditUsed + delivery.fee));

    const codePrefix = delivery.id === 'sea_freight' ? 'CHR-SEA' : delivery.id === 'air_cargo' ? 'CHR-AIR' : 'CHR';
    let orderCode = generateOrderCode(codePrefix);
    while (await prisma.order.findUnique({ where: { orderCode } })) {
      orderCode = generateOrderCode(codePrefix);
    }

    const order = await prisma.$transaction(async (tx) => {
      if (creditUsed > 0) {
        // Only deduct if the balance is still there (protects against two orders at once).
        const { count } = await tx.user.updateMany({
          where: { id: req.user.id, creditBalance: { gte: creditUsed } },
          data: { creditBalance: { decrement: creditUsed } },
        });
        if (count === 0) throw Object.assign(new Error('Your store credit changed. Please refresh and try again.'), { status: 409 });
      }

      const created = await tx.order.create({
        data: {
          orderCode,
          customerName,
          phone,
          email: email || (req.user ? req.user.email : null),
          city: city || 'Accra',
          address: address || '',
          deliveryMethod: delivery.name,
          paymentMethod: paymentMethod || 'Cash on Delivery',
          paymentStatus: paymentMethod === 'Cash on Delivery' ? 'PENDING' : 'VERIFYING',
          orderStatus: 'PROCESSING',
          subtotal,
          deliveryFee: delivery.fee,
          discountAmount,
          couponCode,
          creditUsed,
          total,
          items: pricedItems,
          notes: notes || null,
          ...(req.user && { userId: req.user.id }),
        },
      });

      if (creditUsed > 0) {
        await tx.creditTransaction.create({
          data: { userId: req.user.id, amount: -creditUsed, type: 'ORDER_PAYMENT', orderId: created.id, note: `Used on order ${orderCode}` },
        });
      }
      return created;
    });

    console.log(`[Order] New order placed: ${order.orderCode} by ${customerName} (GH₵${total.toFixed(2)})`);

    if (promo?.valid && !useWelcome) {
      prisma.discount.update({
        where: { code: promo.code },
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
    res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Could not place your order. Please try again.' });
  }
});

// GET /api/orders/:code?phone=... (Track Order)
// Order records hold names, phone numbers and home addresses, so a code alone is not enough:
// the caller must also supply the phone number on the order, or be its logged-in owner / an admin.
app.get('/api/orders/:code', trackLimiter, optionalAuth, async (req, res) => {
  try {
    const cleanCode = req.params.code.trim().toUpperCase();
    const notFound = () => res.status(404).json({
      success: false,
      error: 'No order matches that code and phone number.',
    });

    const order = await prisma.order.findUnique({ where: { orderCode: cleanCode } });
    if (!order) return notFound();

    const isAdmin = req.user?.role === 'ADMIN';
    const isOwner = req.user && order.userId === req.user.id;
    const suppliedPhone = normalizePhone(req.query.phone);
    const phoneMatches = suppliedPhone.length === 9 && suppliedPhone === normalizePhone(order.phone);

    // Same response for "wrong phone" and "no such order" so codes can't be probed.
    if (!isAdmin && !isOwner && !phoneMatches) return notFound();

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
    if (orderStatus && !['PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(orderStatus)) {
      return res.status(400).json({ success: false, error: `Unknown order status "${orderStatus}".` });
    }
    if (paymentStatus && !['PENDING', 'VERIFYING', 'PAID', 'REFUNDED'].includes(paymentStatus)) {
      return res.status(400).json({ success: false, error: `Unknown payment status "${paymentStatus}".` });
    }
    if (!(await prisma.order.findUnique({ where: { id } }))) {
      return res.status(404).json({ success: false, error: 'Order not found.' });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(orderStatus && { orderStatus }),
        ...(paymentStatus && { paymentStatus }),
      },
    });

    await rewardReferrerIfDue(updated);
    await refundCreditIfCancelled(updated);

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Inquiries / Contact API
// ---------------------------------------------------------------------------

// POST /api/inquiries (Contact Form)
// Used by the Contact page and the "Request an item" form.
// Phone (WhatsApp) is required so the team can reply; email is optional.
app.post('/api/inquiries', inquiryLimiter, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim().slice(0, 100);
    const phone = String(req.body.phone || '').trim().slice(0, 30);
    const email = String(req.body.email || '').trim().slice(0, 120);
    const subject = String(req.body.subject || 'General question').trim().slice(0, 80);
    const message = String(req.body.message || '').trim().slice(0, 4000);

    if (!name || !message) {
      return res.status(400).json({ success: false, error: 'Please enter your name and message.' });
    }
    if (normalizePhone(phone).length < 9) {
      return res.status(400).json({ success: false, error: 'Please enter a valid phone or WhatsApp number so we can reply.' });
    }

    const inquiry = await prisma.inquiry.create({
      data: { name, email, phone, subject, message },
    });

    console.log(`✉️ New message from ${name} (${phone}): ${subject}`);

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

// PATCH /api/inquiries/:id (Admin) — mark a message NEW / REPLIED / CLOSED
app.patch('/api/inquiries/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body.status || '').toUpperCase();
    if (!['NEW', 'REPLIED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be NEW, REPLIED or CLOSED.' });
    }
    const updated = await prisma.inquiry.update({ where: { id: req.params.id }, data: { status } });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Message not found.' });
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

// A date-only expiry ("2026-12-31") means the code works until the end of that day.
const endOfDay = (value) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T23:59:59Z` : value);

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
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return res.status(400).json({ success: false, error: 'Discount value must be a number above 0.' });
    }
    if (type !== 'FIXED' && numericValue > 100) {
      return res.status(400).json({ success: false, error: 'A percentage discount cannot be more than 100%.' });
    }

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
        expiresAt: expiresAt ? endOfDay(expiresAt) : null,
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
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? endOfDay(expiresAt) : null;
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
// Shared promo-code rules — used both for the checkout preview and when an order is actually placed.
async function evaluateDiscount(code, subtotal) {
  const cleanCode = String(code || '').trim().toUpperCase();
  const discount = await prisma.discount.findUnique({ where: { code: cleanCode } });

  if (!discount) return { valid: false, status: 404, error: `Promo code "${cleanCode}" is invalid.` };
  if (!discount.isActive) return { valid: false, status: 400, error: `Promo code "${cleanCode}" is currently inactive.` };
  if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
    return { valid: false, status: 400, error: `Promo code "${cleanCode}" has expired.` };
  }
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    return { valid: false, status: 400, error: `Promo code "${cleanCode}" has reached its maximum redemptions.` };
  }

  const currentSubtotal = Math.max(0, parseFloat(subtotal || 0));
  if (discount.minOrderAmount && currentSubtotal < discount.minOrderAmount) {
    return { valid: false, status: 400, error: `Cart subtotal must be at least GH₵${discount.minOrderAmount.toFixed(2)} to use "${cleanCode}".` };
  }

  let discountAmount;
  if (discount.type === 'PERCENTAGE') {
    discountAmount = (currentSubtotal * discount.value) / 100;
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) discountAmount = discount.maxDiscount;
  } else {
    discountAmount = Math.min(discount.value, currentSubtotal);
  }

  return { valid: true, discount, code: discount.code, discountAmount };
}

app.post('/api/discounts/validate', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Please enter a promo code.' });
    }

    const result = await evaluateDiscount(code, subtotal);
    if (!result.valid) {
      return res.status(result.status).json({ success: false, error: result.error });
    }

    const { discount, discountAmount } = result;
    res.json({
      success: true,
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      discountAmount,
      message: discount.type === 'PERCENTAGE'
        ? `${discount.value}% discount applied! (-GH₵${discountAmount.toFixed(2)})`
        : `GH₵${discount.value.toFixed(2)} discount applied!`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// (There is deliberately no public list of promo codes — customers find them in the treasure hunt.)

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
// Shipment stages, in order.
const BATCH_STATUSES = ['CONFIRMED', 'QC_BATCHING', 'HIGH_SEAS', 'CUSTOMS_CLEARANCE', 'ACCRA_HUB', 'DELIVERY_READY'];

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
    if (status) {
      if (!BATCH_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: `Unknown stage "${status}".` });
      }
      data.status = status;
    }
    if (cutoffDate !== undefined) data.cutoffDate = cutoffDate || null;
    if (eta !== undefined) data.eta = eta || null;
    for (const key of ['capacityCbm', 'allocatedCbm', 'capacityKg', 'allocatedKg', 'totalOrders']) {
      if (data[key] !== undefined && data[key] !== null && !Number.isFinite(data[key])) {
        return res.status(400).json({ success: false, error: `${key} must be a number.` });
      }
    }
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
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ success: false, error: 'Shipment not found or already deleted.' });
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
// Only signed-in customers who have actually ordered the product may review it,
// so every review on the site is genuinely from a buyer.
app.post('/api/reviews', authenticateUser, async (req, res) => {
  try {
    const { productId, rating, title, comment } = req.body;

    if (!productId || !comment || !String(comment).trim()) {
      return res.status(400).json({ success: false, error: 'Product ID and comment are required.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found.' });
    }

    const userOrders = await prisma.order.findMany({
      where: { OR: [{ userId: req.user.id }, { email: req.user.email }] },
      select: { items: true },
    });
    const hasBought = userOrders.some((o) => Array.isArray(o.items) && o.items.some((i) => i && i.id === productId));
    if (!hasBought) {
      return res.status(403).json({ success: false, error: 'Only customers who have ordered this product can review it.' });
    }

    const numericRating = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));

    const review = await prisma.review.create({
      data: {
        productId,
        userName: req.user.name,
        userCity: req.user.city || 'Accra',
        rating: numericRating,
        title: title ? String(title).trim().slice(0, 120) : null,
        comment: String(comment).trim().slice(0, 2000),
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
  // Built JS/CSS have content hashes in their names, so they can be cached for a year;
  // index.html must always be re-checked so visitors pick up new deploys.
  // fallthrough:false → a missing old asset returns 404 instead of index.html, so the app can detect it and reload.
  app.use('/assets', express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  app.use(express.static(distDir, { maxAge: '1d', index: false }));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.set('Cache-Control', 'no-cache');
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 CHARI server running on http://localhost:${PORT}`);
  console.log(`📦 Connected to Neon PostgreSQL Database with JWT Auth`);
});
