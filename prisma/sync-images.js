import { PrismaClient } from '@prisma/client';
import { CATEGORIES, PRODUCTS } from '../src/data/products.js';

// Copies product & category photos from src/data/products.js into the database and adds
// any new categories. Only image fields are touched — prices, stock and admin edits are left alone.
const prisma = new PrismaClient();

async function main() {
  for (const prod of PRODUCTS) {
    const gallery = prod.images || [];
    const { count } = await prisma.product.updateMany({
      where: { slug: prod.slug },
      data: { image: gallery[0] || '', gallery },
    });
    console.log(`${count ? '✔' : '–'} product ${prod.slug}`);
  }

  // Categories: update photos, and add any new ones (e.g. Food & Snacks).
  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.category.update({ where: { slug: cat.slug }, data: { image: cat.image } });
      console.log(`✔ category ${cat.slug}`);
    } else {
      await prisma.category.create({ data: { id: cat.id, name: cat.name, slug: cat.slug, image: cat.image } });
      console.log(`＋ category ${cat.slug} (new)`);
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Image sync failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
