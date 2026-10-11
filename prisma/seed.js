import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CATEGORIES, PRODUCTS } from '../src/data/products.js';
import { INITIAL_REVIEWS, AVAILABLE_PROMO_CODES } from '../src/data/reviews.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Neon PostgreSQL database seeding...');

  // Seed Categories
  console.log(`Seeding ${CATEGORIES.length} categories...`);
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        image: cat.image,
      },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
      },
    });
  }

  // Seed Products
  console.log(`Seeding ${PRODUCTS.length} products...`);
  for (const prod of PRODUCTS) {
    const mainImage = prod.images && prod.images.length > 0 ? prod.images[0] : '';
    const gallery = prod.images || [];
    const badge = prod.badge || (prod.featured ? 'Featured' : prod.trending ? 'Trending' : prod.justLanded ? 'New' : null);

    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {
        name: prod.name,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        inStock: typeof prod.inStock === 'number' ? prod.inStock > 0 : Boolean(prod.inStock),
        rating: prod.rating || 4.8,
        reviewsCount: prod.reviewCount || 0,
        badge,
        image: mainImage,
        gallery,
        description: prod.description || '',
        specs: prod.specifications || null,
      },
      create: {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice || null,
        inStock: typeof prod.inStock === 'number' ? prod.inStock > 0 : Boolean(prod.inStock),
        rating: prod.rating || 4.8,
        reviewsCount: prod.reviewCount || 0,
        badge,
        image: mainImage,
        gallery,
        description: prod.description || '',
        specs: prod.specifications || null,
      },
    });
  }

  // Seed a sample order for tracking demo if none exists
  const existingOrder = await prisma.order.findUnique({
    where: { orderCode: 'CHR-2026-7841' },
  });

  if (!existingOrder) {
    await prisma.order.create({
      data: {
        orderCode: 'CHR-2026-7841',
        customerName: 'Kwame Mensah',
        phone: '+233 59 144 0934',
        email: 'kwame@example.com',
        city: 'Accra',
        address: 'East Legon, Near American House',
        deliveryMethod: 'Accra Doorstep Express',
        paymentMethod: 'MTN Mobile Money',
        paymentStatus: 'PAID',
        orderStatus: 'SHIPPED',
        subtotal: 130.00,
        deliveryFee: 35.00,
        total: 165.00,
        items: [
          {
            id: 'prod-001',
            name: 'Kids Jeans & Top Set',
            price: 65.00,
            quantity: 2,
            image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80'
          }
        ],
        notes: 'Please call recipient before delivery'
      }
    });
    console.log('Sample order CHR-2026-7841 created for tracking demo.');
  }

  // Seed Admin & Demo Customer Users
  console.log('Seeding initial users...');
  // Initial passwords come from the environment (or are randomly generated) — never hard-coded.
  const randomPassword = () => crypto.randomBytes(12).toString('base64url');
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || randomPassword();
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || randomPassword();
  const adminHashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: 'admin@charisimport.com' },
    update: {
      name: 'Charis Administrator',
      role: 'ADMIN',
      phone: '+233 59 144 0934',
    },
    create: {
      name: 'Charis Administrator',
      email: 'admin@charisimport.com',
      password: adminHashedPassword,
      role: 'ADMIN',
      phone: '+233 59 144 0934',
      city: 'Accra',
      address: 'Spintex Road, Accra'
    }
  });

  const customerHashedPassword = await bcrypt.hash(customerPassword, 10);
  await prisma.user.upsert({
    where: { email: 'customer@charisimport.com' },
    update: {
      name: 'Abena Osei',
      phone: '+233 24 000 1234',
    },
    create: {
      name: 'Abena Osei',
      email: 'customer@charisimport.com',
      password: customerHashedPassword,
      role: 'CUSTOMER',
      phone: '+233 24 000 1234',
      city: 'Kumasi',
      address: 'Ahodwo, Kumasi'
    }
  });
  console.log('Users seeded: admin@charisimport.com and customer@charisimport.com');
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('New accounts got random passwords. Set your own with: npm run set-password -- admin@charisimport.com');
  }

  // Seed Initial Container Batches
  console.log('Seeding initial container & air cargo batches...');
  await prisma.batch.upsert({
    where: { batchNumber: 'CN-GH-2026-FCL04' },
    update: {
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
      lockedFxRate: '15.65',
      isActive: true,
    },
    create: {
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
      lockedFxRate: '15.65',
      isActive: true,
    }
  });

  await prisma.batch.upsert({
    where: { batchNumber: 'EK-9821-EXP' },
    update: {
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
      lockedFxRate: '15.65',
      isActive: true,
    },
    create: {
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
      lockedFxRate: '15.65',
      isActive: true,
    }
  });
  console.log('Container & Air Cargo batches seeded successfully.');

  // Seed Discounts / Promo Codes
  console.log(`Seeding ${AVAILABLE_PROMO_CODES.length} promo codes...`);
  for (const promo of AVAILABLE_PROMO_CODES) {
    await prisma.discount.upsert({
      where: { code: promo.code },
      update: {
        description: promo.description,
        type: promo.type,
        value: promo.value,
        minOrderAmount: promo.minSpend || 0,
        isActive: true,
      },
      create: {
        code: promo.code,
        description: promo.description,
        type: promo.type,
        value: promo.value,
        minOrderAmount: promo.minSpend || 0,
        isActive: true,
      },
    });
  }
  console.log('Discounts & Promo codes seeded successfully.');

  // Seed Product Reviews
  console.log(`Seeding ${INITIAL_REVIEWS.length} reviews...`);
  for (const rev of INITIAL_REVIEWS) {
    const prodExists = await prisma.product.findUnique({ where: { id: rev.productId } });
    if (prodExists) {
      await prisma.review.upsert({
        where: { id: rev.id },
        update: {
          userName: rev.userName,
          userCity: rev.userCity || 'Accra',
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          verified: rev.verified ?? true,
          helpfulCount: rev.helpfulCount || 0,
        },
        create: {
          id: rev.id,
          productId: rev.productId,
          userName: rev.userName,
          userCity: rev.userCity || 'Accra',
          rating: rev.rating,
          title: rev.title,
          comment: rev.comment,
          verified: rev.verified ?? true,
          helpfulCount: rev.helpfulCount || 0,
        },
      });
    }
  }
  console.log('Product reviews seeded successfully.');

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
