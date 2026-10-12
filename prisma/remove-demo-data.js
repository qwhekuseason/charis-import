import { PrismaClient } from '@prisma/client';

// Removes the demo/sample data that came with the original template.
//   npm run remove-demo-data              → shows what would be removed (changes nothing)
//   npm run remove-demo-data -- --confirm → removes it
// Real products, real customers and real orders are not touched.
const prisma = new PrismaClient();
const confirm = process.argv.includes('--confirm');

const DEMO = {
  orderCodes: ['CHR-2026-7841'],
  customerEmails: ['customer@charisimport.com'],
  batchNumbers: ['CN-GH-2026-FCL04', 'EK-9821-EXP'],
  promoCodes: ['CHARI10', 'CHARIS10', 'WELCOME', 'WELCOME20', 'VIPDISPATCH', 'FREESHIP', 'SUPER50'],
  reviewIdPrefix: 'rev-',
};

async function main() {
  const orders = await prisma.order.findMany({ where: { orderCode: { in: DEMO.orderCodes } }, select: { id: true, orderCode: true, customerName: true } });
  const customers = await prisma.user.findMany({ where: { email: { in: DEMO.customerEmails } }, select: { id: true, email: true } });
  const batches = await prisma.batch.findMany({ where: { batchNumber: { in: DEMO.batchNumbers } }, select: { id: true, batchNumber: true } });
  const promos = await prisma.discount.findMany({ where: { code: { in: DEMO.promoCodes } }, select: { id: true, code: true, usedCount: true } });
  const reviews = await prisma.review.findMany({ where: { id: { startsWith: DEMO.reviewIdPrefix } }, select: { id: true, userName: true } });
  const fakeRatings = await prisma.product.count({ where: { reviewsCount: { gt: 0 } } });

  console.log(confirm ? '\nRemoving demo data…\n' : '\nDemo data found (nothing changed yet):\n');
  console.log(`• Sample orders:      ${orders.map((o) => `${o.orderCode} (${o.customerName})`).join(', ') || 'none'}`);
  console.log(`• Demo customers:     ${customers.map((c) => c.email).join(', ') || 'none'}`);
  console.log(`• Demo shipments:     ${batches.map((b) => b.batchNumber).join(', ') || 'none'}`);
  console.log(`• Demo promo codes:   ${promos.map((p) => `${p.code}${p.usedCount ? ` (used ${p.usedCount}×)` : ''}`).join(', ') || 'none'}`);
  console.log(`• Sample reviews:     ${reviews.length}`);
  console.log(`• Star ratings reset to real reviews only (products with a count today: ${fakeRatings})`);

  if (!confirm) {
    console.log('\nRun again with --confirm to remove these:  npm run remove-demo-data -- --confirm\n');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.deleteMany({ where: { id: { startsWith: DEMO.reviewIdPrefix } } });
    await tx.order.deleteMany({ where: { orderCode: { in: DEMO.orderCodes } } });
    for (const c of customers) {
      await tx.creditTransaction.deleteMany({ where: { userId: c.id } });
      await tx.order.updateMany({ where: { userId: c.id }, data: { userId: null } });
      await tx.user.updateMany({ where: { referredById: c.id }, data: { referredById: null } });
      await tx.user.delete({ where: { id: c.id } });
    }
    await tx.batch.deleteMany({ where: { batchNumber: { in: DEMO.batchNumbers } } });
    await tx.discount.deleteMany({ where: { code: { in: DEMO.promoCodes } } });
  });

  // Recount stars from the reviews that remain (real customer reviews only).
  const products = await prisma.product.findMany({ select: { id: true } });
  for (const p of products) {
    const real = await prisma.review.findMany({ where: { productId: p.id }, select: { rating: true } });
    const avg = real.length ? Math.round((real.reduce((s, r) => s + r.rating, 0) / real.length) * 10) / 10 : 0;
    await prisma.product.update({ where: { id: p.id }, data: { reviewsCount: real.length, rating: avg } });
  }

  // Hidden-coupon spots that pointed at deleted promo codes are dropped too.
  const hunt = await prisma.storeSetting.findUnique({ where: { key: 'treasureHunt' } });
  if (Array.isArray(hunt?.value)) {
    const kept = hunt.value.filter((i) => !DEMO.promoCodes.includes(i.code));
    await prisma.storeSetting.update({ where: { key: 'treasureHunt' }, data: { value: kept } });
  }

  console.log('\n✅ Demo data removed.\n');
}

main()
  .catch((e) => {
    console.error('❌', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
