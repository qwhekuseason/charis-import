import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { CATEGORIES, PRODUCTS } from '../src/data/products.js';

// Sets up an EMPTY store for development: categories, the starter catalogue and an admin account.
// No demo orders, customers, reviews, shipments or promo codes are created.
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Setting up the store…');

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image },
      create: { id: cat.id, name: cat.name, slug: cat.slug, image: cat.image },
    });
  }
  console.log(`✔ ${CATEGORIES.length} categories`);

  for (const prod of PRODUCTS) {
    const gallery = prod.images || [];
    const data = {
      name: prod.name,
      category: prod.category,
      price: prod.price,
      originalPrice: prod.originalPrice || null,
      inStock: typeof prod.inStock === 'number' ? prod.inStock > 0 : Boolean(prod.inStock),
      badge: prod.justLanded ? 'New' : null,
      image: gallery[0] || '',
      gallery,
      description: prod.description || '',
      specs: prod.specifications || null,
      // Stars come only from real customer reviews.
      rating: 0,
      reviewsCount: 0,
    };
    await prisma.product.upsert({ where: { slug: prod.slug }, update: data, create: { id: prod.id, slug: prod.slug, ...data } });
  }
  console.log(`✔ ${PRODUCTS.length} products`);

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'admin@charisimport.com' } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: 'CHARI Admin',
        email: 'admin@charisimport.com',
        password: await bcrypt.hash(adminPassword, 10),
        role: 'ADMIN',
        city: 'Kumasi',
      },
    });
    console.log('✔ Admin account created: admin@charisimport.com');
    if (!process.env.SEED_ADMIN_PASSWORD) console.log('  Set its password with: npm run set-password -- admin@charisimport.com');
  }

  console.log('✅ Done. Create promo codes, shipments and hidden coupons in Admin.');
}

main()
  .catch((e) => {
    console.error('❌ Setup failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
