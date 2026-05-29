/**
 * Register Android apps in Firebase project hancr-88ac0 via Management API
 * and download their google-services.json files.
 *
 * Usage:
 *   node scripts/firebase-register-android.js
 */

const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../secrets/firebase-adminsdk.json');
const PROJECT_ID = 'hancr-88ac0';

const ANDROID_APPS = [
  {
    packageName: 'com.zancr.hancr_rider',
    displayName: 'HANCR Rider',
    targetPath: path.resolve(__dirname, '../apps/rider-app/android/app/google-services.json'),
  },
  {
    packageName: 'com.zancr.hancr_driver',
    displayName: 'HANCR Captain',
    targetPath: path.resolve(__dirname, '../apps/driver-app/android/app/google-services.json'),
  },
];

async function getAccessToken() {
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/firebase'],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  return token;
}

async function api(token, method, url, body) {
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`${method} ${url} → ${res.status}: ${txt}`);
  }
  return res.json();
}

async function listAndroidApps(token) {
  const result = await api(
    token,
    'GET',
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/androidApps?pageSize=100`,
  );
  return result.apps || [];
}

async function createAndroidApp(token, packageName, displayName) {
  console.log(`  → Creating Android app: ${packageName}`);
  const op = await api(
    token,
    'POST',
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}/androidApps`,
    { packageName, displayName },
  );

  // Poll the long-running operation until done
  let done = false;
  let result = null;
  for (let i = 0; i < 30 && !done; i++) {
    const opName = op.name;
    const opStatus = await api(
      token,
      'GET',
      `https://firebase.googleapis.com/v1beta1/${opName}`,
    );
    if (opStatus.done) {
      done = true;
      result = opStatus.response;
    } else {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  if (!done) throw new Error('Operation timed out');
  return result;
}

async function getConfig(token, appResourceName) {
  // appResourceName like "projects/hancr-88ac0/androidApps/1:123456789012:android:abcdef"
  return api(
    token,
    'GET',
    `https://firebase.googleapis.com/v1beta1/${appResourceName}/config`,
  );
}

async function main() {
  if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    throw new Error(`Service account not found at ${SERVICE_ACCOUNT_PATH}`);
  }

  console.log('🔑 Authenticating with Firebase Management API...');
  const token = await getAccessToken();
  console.log('✅ Authenticated');

  console.log('\n📱 Listing existing Android apps...');
  const existing = await listAndroidApps(token);
  console.log(`  Found ${existing.length} existing apps`);
  for (const app of existing) {
    console.log(`   - ${app.packageName} (${app.appId})`);
  }

  for (const target of ANDROID_APPS) {
    console.log(`\n🎯 Processing ${target.packageName}...`);

    let app = existing.find((a) => a.packageName === target.packageName);
    if (!app) {
      app = await createAndroidApp(token, target.packageName, target.displayName);
      console.log(`  ✅ Created: ${app.appId}`);
    } else {
      console.log(`  ✅ Already exists: ${app.appId}`);
    }

    console.log('  📥 Downloading google-services.json...');
    const config = await getConfig(token, app.name);
    const json = Buffer.from(config.configFileContents, 'base64').toString('utf-8');

    // Ensure target directory exists
    fs.mkdirSync(path.dirname(target.targetPath), { recursive: true });
    fs.writeFileSync(target.targetPath, json);
    console.log(`  ✅ Saved → ${target.targetPath}`);
  }

  console.log('\n🎉 Done! Both Android apps are registered + configured.');
}

main().catch((e) => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
