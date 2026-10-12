import fs from 'fs';
import webpush from 'web-push';

// Creates the key pair for admin phone alerts and adds it to .env (only if not there already).
//   npm run push-keys
// Then copy VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY from .env into Render → Environment.
// Keep the private key secret. Changing the keys later means every admin turns alerts on again.
const envPath = '.env';
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (/^VAPID_PUBLIC_KEY=/m.test(env)) {
  console.log('Alert keys are already in .env — nothing changed.');
} else {
  const { publicKey, privateKey } = webpush.generateVAPIDKeys();
  const block = `\n# Admin phone alerts (web push)\nVAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\nVAPID_SUBJECT=mailto:support@charisimport.com\n`;
  fs.appendFileSync(envPath, (env.endsWith('\n') || !env ? '' : '\n') + block);
  console.log('✅ Alert keys added to .env.');
  console.log('   Next: copy VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT from .env into Render → Environment.');
}
