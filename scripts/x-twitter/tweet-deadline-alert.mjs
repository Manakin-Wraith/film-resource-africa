#!/usr/bin/env node
/**
 * Post deadline alert tweets for opportunities closing within 7 days.
 * Can post a single tweet or a thread if multiple deadlines are approaching.
 */

import { createClient } from '@supabase/supabase-js';
import { postTweet, postThread, logTweet } from './lib/x-client.mjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

try {
  // Fetch opportunities that are closing soon
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'approved')
    .in('application_status', ['open', 'closing_soon'])
    .order('deadline_date', { ascending: true });

  if (error) throw new Error(`Supabase error: ${error.message}`);

  // Filter to those with deadlines within 7 days
  const closing = (opps || []).filter(o => {
    if (!o.deadline_date) return false;
    const days = daysUntil(o.deadline_date);
    return days >= 0 && days <= 7;
  });

  if (closing.length === 0) {
    console.log('No opportunities closing within the next 7 days.');
    process.exit(0);
  }

  if (closing.length === 1) {
    // Single deadline alert tweet
    const opp = closing[0];
    const days = daysUntil(opp.deadline_date);
    const applyLink = opp['Apply:'] || 'https://film-resource-africa.com';
    const desc = (opp['What Do You Get If Selected?'] || '').split(/[.!]/)[0].trim().slice(0, 60);

    let tweet = `DEADLINE ALERT: ${days === 0 ? 'TODAY' : days + ' day' + (days > 1 ? 's' : '')} left to apply for ${opp.title}!\n\n`;
    if (desc) tweet += `${desc}\n\n`;
    tweet += `Apply now: ${applyLink}\n\n#DeadlineAlert #AfricanFilm`;

    if (tweet.length > 280) {
      tweet = `DEADLINE ALERT: ${days === 0 ? 'TODAY' : days + 'd'} left — ${opp.title}\n\n${applyLink}\n\n#DeadlineAlert #AfricanFilm`;
    }

    console.log(`Posting deadline alert for: ${opp.title} (${days} days left)`);
    console.log(`Tweet (${tweet.length}/280):\n${tweet}\n`);

    const result = await postTweet(tweet.slice(0, 280));
    console.log(`Posted! https://x.com/film_resource_/status/${result.id}`);

    logTweet({ tweet_id: result.id, tweet_text: tweet, tweet_type: 'deadline', source_id: opp.id });
  } else {
    // Thread: multiple deadlines
    const tweets = [];
    tweets.push(
      `DEADLINE ALERT: ${closing.length} film opportunities closing THIS WEEK!\n\nA thread for African filmmakers:\n\n#DeadlineAlert #AfricanFilm`
    );

    for (const opp of closing.slice(0, 8)) {
      const days = daysUntil(opp.deadline_date);
      const applyLink = opp['Apply:'] || 'film-resource-africa.com';
      const dayLabel = days === 0 ? 'TODAY' : `${days}d left`;

      let t = `${opp.title} — ${dayLabel}\n\n${applyLink}`;
      tweets.push(t.slice(0, 280));
    }

    tweets.push(
      `Explore all opportunities at film-resource-africa.com\n\nNever miss a deadline — subscribe to our weekly newsletter!\n\n#AfricanFilm #FilmResourceAfrica`
    );

    console.log(`Posting deadline thread (${tweets.length} tweets)...`);
    tweets.forEach((t, i) => console.log(`  [${i + 1}] ${t.slice(0, 60)}...`));

    const results = await postThread(tweets);
    console.log(`\nThread posted!`);
    results.forEach((r, i) => console.log(`  [${i + 1}] https://x.com/film_resource_/status/${r.id}`));

    logTweet({
      tweet_id: results[0].id,
      tweet_text: tweets.join(' | '),
      tweet_type: 'deadline_thread',
      thread_tweets: results.map(r => r.id),
    }, 'thread');
  }
} catch (err) {
  console.error('Deadline alert failed:', err.message);
  process.exit(1);
}
