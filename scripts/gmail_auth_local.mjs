#!/usr/bin/env node
/**
 * Gmail OAuth2 — Local Mac auth (reads credentials from .env.local)
 *
 * Usage:
 *   node scripts/gmail_auth_local.mjs
 *
 * Requires GMAIL_CLIENT_SECRET in .env.local (GMAIL_CLIENT_ID is optional — falls back to hardcoded).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createInterface } from 'readline';

// ── Load .env.local ──────────────────────────────────────────────────────────
const ENV_PATH = '.env.local';
let env = {};
if (existsSync(ENV_PATH)) {
  env = Object.fromEntries(
    readFileSync(ENV_PATH, 'utf-8')
      .split('\n')
      .filter(l => l && !l.startsWith('#'))
      .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
  );
}

// ── Load credentials from file or .env.local ─────────────────────────────────
let CLIENT_ID     = env.GMAIL_CLIENT_ID     || '812435843656-v79h346736tin3v5qrun7espa1ooe5r3.apps.googleusercontent.com';
let CLIENT_SECRET = env.GMAIL_CLIENT_SECRET || '';

const CREDENTIALS_PATH = '/Users/thecasterymedia/credentials.json';
if ((!CLIENT_SECRET) && existsSync(CREDENTIALS_PATH)) {
  try {
    const creds = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const installed = creds.installed || creds.web || {};
    CLIENT_ID     = installed.client_id     || CLIENT_ID;
    CLIENT_SECRET = installed.client_secret || CLIENT_SECRET;
    console.log('  ✓ Loaded credentials from ~/credentials.json');
  } catch { /* fall through */ }
}

const REDIRECT_URI = 'http://localhost';
const SCOPES       = 'https://www.googleapis.com/auth/gmail.readonly';

if (!CLIENT_SECRET) {
  console.error('\n❌ GMAIL_CLIENT_SECRET could not be loaded.');
  process.exit(1);
}

const authUrl =
  `https://accounts.google.com/o/oauth2/auth` +
  `?scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&client_id=${encodeURIComponent(CLIENT_ID)}` +
  `&prompt=consent`;

console.log('\n=== Gmail OAuth2 — Local Auth ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log(`2. Sign in with g.mostertpot@gmail.com`);
console.log('3. After authorising, the browser will redirect to http://localhost/?code=...');
console.log('   (The page will fail to load — that\'s expected.)\n');
console.log('4. Copy the FULL URL from the address bar and paste it below.\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the redirect URL here: ', async (url) => {
  rl.close();

  let code;
  try {
    code = new URL(url.trim()).searchParams.get('code');
  } catch {
    code = url.trim();
  }

  if (!code) {
    console.error('\n❌ Could not extract code from URL.');
    process.exit(1);
  }

  console.log('\nExchanging code for tokens...');

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: CLIENT_ID, client_secret: CLIENT_SECRET, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' }),
    });

    const data = await res.json();
    if (data.error) {
      console.error(`\n❌ Token exchange failed: ${data.error_description || data.error}`);
      process.exit(1);
    }

    const refreshToken = data.refresh_token;
    console.log('\n✅ Success!\n');
    console.log(`Refresh Token: ${refreshToken}\n`);

    // Patch .env.local in place — update or append GMAIL_REFRESH_TOKEN
    if (existsSync(ENV_PATH)) {
      let content = readFileSync(ENV_PATH, 'utf-8');
      if (content.includes('GMAIL_REFRESH_TOKEN=')) {
        content = content.replace(/^GMAIL_REFRESH_TOKEN=.*/m, `GMAIL_REFRESH_TOKEN=${refreshToken}`);
        console.log('✓ Updated GMAIL_REFRESH_TOKEN in .env.local');
      } else {
        content += `\nGMAIL_REFRESH_TOKEN=${refreshToken}\n`;
        console.log('✓ Added GMAIL_REFRESH_TOKEN to .env.local');
      }
      writeFileSync(ENV_PATH, content);
    }

    console.log('\nYou can now run: node scan_opportunities.mjs --dry-run\n');
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
  }
});
