#!/usr/bin/env node
/**
 * Auto-generate and post a tweet about the latest FRA opportunity.
 * Pulls from Supabase, composes tweet using brand templates, and posts.
 */

import { createClient } from '@supabase/supabase-js';
import { postTweet, logTweet } from './lib/x-client.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function composeTweet(opp) {
  const title = opp.title;
  const desc = opp['What Is It?'] || '';
  const deadline = opp['Next Deadline'] || '';
  const eligibility = opp['Who Can Apply / Eligibility'] || '';
  const applyLink = opp['Apply:'] || 'https://film-resource-africa.com';

  // Short description: first sentence or first 80 chars
  const shortDesc = desc.split(/[.!]/)[0].trim().slice(0, 80);

  let tweet = `${title} is now open for submissions!\n\n`;
  if (shortDesc) tweet += `${shortDesc}.\n\n`;
  if (deadline) tweet += `Deadline: ${deadline}\n`;
  if (eligibility) {
    const shortElig = eligibility.split(/[.,;]/)[0].trim().slice(0, 60);
    tweet += `Eligibility: ${shortElig}\n`;
  }
  tweet += `\nApply: ${applyLink}\n\n#AfricanFilm #FilmFunding`;

  // Truncate if over 280
  if (tweet.length > 280) {
    // Remove eligibility line first
    tweet = `${title} is now open!\n\n${shortDesc}.\n\nDeadline: ${deadline}\n\nApply: ${applyLink}\n\n#AfricanFilm`;
  }
  if (tweet.length > 280) {
    tweet = `${title} — now open for submissions!\n\nDeadline: ${deadline}\n\n${applyLink}\n\n#AfricanFilm`;
  }

  return tweet.slice(0, 280);
}

try {
  // Fetch latest approved opportunity not yet tweeted
  const { data: tweeted } = await supabase
    .from('tweet_log')
    .select('source_id')
    .eq('source_table', 'opportunities');

  const tweetedIds = (tweeted || []).map(t => t.source_id).filter(Boolean);

  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'approved')
    .order('id', { ascending: false })
    .limit(10);

  const { data: opps, error } = await query;
  if (error) throw new Error(`Supabase error: ${error.message}`);

  // Find first opportunity not yet tweeted
  const opp = (opps || []).find(o => !tweetedIds.includes(o.id));
  if (!opp) {
    console.log('No new opportunities to tweet. All recent ones have been posted.');
    process.exit(0);
  }

  const tweetText = composeTweet(opp);
  console.log(`Composing tweet for: ${opp.title}`);
  console.log(`Tweet (${tweetText.length}/280 chars):\n${tweetText}\n`);

  const result = await postTweet(tweetText);
  console.log(`Posted! https://x.com/film_resource_/status/${result.id}`);

  // Log to tweet_log table
  try {
    await supabase.from('tweet_log').insert([{
      tweet_id: result.id,
      tweet_text: tweetText,
      tweet_type: 'opportunity',
      source_id: opp.id,
      source_table: 'opportunities',
      posted_at: new Date().toISOString(),
    }]);
  } catch (logErr) {
    console.warn('Tweet posted but failed to log to Supabase:', logErr.message);
  }

  logTweet({
    tweet_id: result.id,
    tweet_text: tweetText,
    tweet_type: 'opportunity',
    source_id: opp.id,
  });
} catch (err) {
  console.error('Auto-tweet opportunity failed:', err.message);
  process.exit(1);
}
