import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Usage: npm run set-password -- admin@charisimport.com
// Prompts for a new password and saves it (hashed) for that account.
const prisma = new PrismaClient();

const ask = (question) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(question, (answer) => { rl.close(); resolve(answer); });
});

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) throw new Error('Pass the account email, e.g. npm run set-password -- admin@charisimport.com');

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account found for ${email}`);

  const password = await ask(`New password for ${email} (min 12 characters): `);
  if (password.length < 12) throw new Error('Password must be at least 12 characters.');
  const confirm = await ask('Type it again to confirm: ');
  if (confirm !== password) throw new Error('Passwords do not match.');

  await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10) } });
  console.log(`✅ Password updated for ${email} (${user.role}).`);
}

main()
  .catch((e) => {
    console.error('❌', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
