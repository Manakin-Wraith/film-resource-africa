#!/usr/bin/env node
/**
 * Test X API connectivity and credentials for @film_resource_
 */

import { getMe, loadCredentials } from './lib/x-client.mjs';

try {
  console.log('Loading credentials...');
  const creds = loadCredentials();
  console.log('  API_KEY: ' + creds.API_KEY.slice(0, 6) + '...');
  console.log('  ACCESS_TOKEN: ' + creds.ACCESS_TOKEN.slice(0, 6) + '...');

  console.log('\nVerifying credentials with X API...');
  const user = await getMe();
  console.log(`\nAuthenticated as:`);
  console.log(`  Name: ${user.name}`);
  console.log(`  Username: @${user.username}`);
  console.log(`  ID: ${user.id}`);
  console.log(`\nConnection successful!`);
} catch (err) {
  console.error('Connection test failed:', err.message);
  process.exit(1);
}
