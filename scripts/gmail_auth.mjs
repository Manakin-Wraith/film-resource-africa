#!/usr/bin/env node
/**
 * Gmail OAuth2 — Headless Refresh Token Generator
 *
 * Uses the existing gws client credentials. Run this once to get a refresh token,
 * then add it to .env.local as GMAIL_REFRESH_TOKEN.
 *
 * How it works:
 *   1. Opens an auth URL you paste into any browser
 *   2. After Google login, you'll be redirected to localhost (which will fail — that's fine)
 *   3. Copy the FULL URL from your browser's address bar and paste it here
 *   4. The script exchanges the code for tokens and prints the refresh token
 *
 * Usage:
 *   node scripts/gmail_auth.mjs
 */

import { readFileSync } from 'fs';
import { createInterface } from 'readline';

const clientSecret = JSON.parse(readFileSync('/root/.config/gws/client_secret.json', 'utf-8'));
const { client_id, client_secret } = clientSecret.installed;

const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
const REDIRECT_URI = 'http://localhost';

const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
  `scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&client_id=${encodeURIComponent(client_id)}` +
  `&prompt=consent`;

console.log('\n=== Gmail OAuth2 — Refresh Token Generator ===\n');
console.log('1. Open this URL in your browser:\n');
console.log(`   ${authUrl}\n`);
console.log('2. Sign in with the Gmail account you want to scan.');
console.log('3. After authorizing, your browser will redirect to http://localhost/?code=...');
console.log('   (The page will fail to load — that\'s expected.)\n');
console.log('4. Copy the FULL URL from the address bar and paste it below.\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the redirect URL here: ', async (url) => {
  rl.close();

  // Extract code from URL
  let code;
  try {
    const parsed = new URL(url.trim());
    code = parsed.searchParams.get('code');
  } catch {
    // Maybe they pasted just the code
    code = url.trim();
  }

  if (!code) {
    console.error('\n❌ Could not extract authorization code from the URL.');
    process.exit(1);
  }

  console.log('\nExchanging code for tokens...');

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id,
        client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.error(`\n❌ Token exchange failed: ${data.error_description || data.error}`);
      process.exit(1);
    }

    console.log('\n✅ Success!\n');
    console.log(`Refresh Token: ${data.refresh_token}`);
    console.log(`\nAdd this to your .env.local:\n`);
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
    console.log(`GMAIL_CLIENT_ID=${client_id}`);
    console.log(`GMAIL_CLIENT_SECRET=${client_secret}`);
    console.log(`\nThe scanner will use these to access Gmail directly (no gws needed).`);
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
});
