#!/usr/bin/env node
/**
 * Post a single tweet to @film_resource_
 * Usage: node post-tweet.mjs "Your tweet text here"
 */

import { postTweet, logTweet } from './lib/x-client.mjs';

const text = process.argv[2];

if (!text) {
  console.error('Usage: node post-tweet.mjs "Your tweet text"');
  process.exit(1);
}

if (text.length > 280) {
  console.error(`Tweet too long: ${text.length}/280 characters`);
  process.exit(1);
}

try {
  console.log(`Posting tweet (${text.length}/280 chars)...`);
  const result = await postTweet(text);
  console.log(`Tweet posted successfully!`);
  console.log(`  ID: ${result.id}`);
  console.log(`  URL: https://x.com/film_resource_/status/${result.id}`);

  logTweet({
    tweet_id: result.id,
    tweet_text: text,
    tweet_type: 'manual',
  });
} catch (err) {
  console.error('Failed to post tweet:', err.message);
  process.exit(1);
}
