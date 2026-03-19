#!/usr/bin/env node
/**
 * Post a thread to @film_resource_
 * Usage: node post-thread.mjs "Tweet 1" "Tweet 2" "Tweet 3"
 */

import { postThread, logTweet } from './lib/x-client.mjs';

const tweets = process.argv.slice(2);

if (tweets.length === 0) {
  console.error('Usage: node post-thread.mjs "Tweet 1" "Tweet 2" "Tweet 3" ...');
  process.exit(1);
}

for (let i = 0; i < tweets.length; i++) {
  if (tweets[i].length > 280) {
    console.error(`Tweet ${i + 1} too long: ${tweets[i].length}/280 characters`);
    process.exit(1);
  }
}

try {
  console.log(`Posting thread (${tweets.length} tweets)...`);
  const results = await postThread(tweets);

  console.log(`Thread posted successfully!`);
  results.forEach((r, i) => {
    console.log(`  [${i + 1}] https://x.com/film_resource_/status/${r.id}`);
  });

  logTweet({
    tweet_id: results[0].id,
    tweet_text: tweets.join(' | '),
    tweet_type: 'thread',
    thread_tweets: results.map(r => r.id),
  }, 'thread');
} catch (err) {
  console.error('Failed to post thread:', err.message);
  process.exit(1);
}
