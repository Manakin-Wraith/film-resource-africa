#!/usr/bin/env node
/**
 * Auto-generate and post a tweet about the latest FRA news article.
 * Pulls from Supabase news table, composes tweet, and posts.
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

function composeTweet(news) {
  const title = news.title;
  const summary = news.summary || '';
  const url = news.url || `https://film-resource-africa.com/news/${news.slug}`;
  const category = news.category;

  const categoryTags = {
    industry_news: '#AfricanCinema #IndustryNews',
    deadline_alert: '#DeadlineAlert #AfricanFilm',
    new_opportunity: '#FilmFunding #AfricanFilm',
    tip: '#FilmmakerTips #AfricanFilm',
    community_spotlight: '#AfricanFilmmakers #CommunitySpotlight',
  };

  const tags = categoryTags[category] || '#AfricanFilm #FilmResourceAfrica';

  // Short summary: first 120 chars
  const shortSummary = summary.slice(0, 120).trim();

  let tweet = `${title}\n\n${shortSummary}${summary.length > 120 ? '...' : ''}\n\nRead more: ${url}\n\n${tags}`;

  if (tweet.length > 280) {
    tweet = `${title}\n\n${url}\n\n${tags}`;
  }

  return tweet.slice(0, 280);
}

try {
  // Fetch latest published news not yet tweeted
  const { data: tweeted } = await supabase
    .from('tweet_log')
    .select('source_id')
    .eq('source_table', 'news');

  const tweetedIds = (tweeted || []).map(t => t.source_id).filter(Boolean);

  const { data: articles, error } = await supabase
    .from('news')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) throw new Error(`Supabase error: ${error.message}`);

  const article = (articles || []).find(a => !tweetedIds.includes(a.id));
  if (!article) {
    console.log('No new news articles to tweet. All recent ones have been posted.');
    process.exit(0);
  }

  const tweetText = composeTweet(article);
  console.log(`Composing tweet for: ${article.title}`);
  console.log(`Tweet (${tweetText.length}/280 chars):\n${tweetText}\n`);

  const result = await postTweet(tweetText);
  console.log(`Posted! https://x.com/film_resource_/status/${result.id}`);

  // Log to tweet_log table
  try {
    await supabase.from('tweet_log').insert([{
      tweet_id: result.id,
      tweet_text: tweetText,
      tweet_type: 'news',
      source_id: article.id,
      source_table: 'news',
      posted_at: new Date().toISOString(),
    }]);
  } catch (logErr) {
    console.warn('Tweet posted but failed to log to Supabase:', logErr.message);
  }

  logTweet({
    tweet_id: result.id,
    tweet_text: tweetText,
    tweet_type: 'news',
    source_id: article.id,
  });
} catch (err) {
  console.error('Auto-tweet news failed:', err.message);
  process.exit(1);
}
