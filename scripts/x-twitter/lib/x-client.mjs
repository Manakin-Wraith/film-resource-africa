/**
 * X/Twitter API v2 Client for Film Resource Africa (@film_resource_)
 * 
 * Uses OAuth 1.0a User Context for posting tweets.
 * Requires: API_KEY, API_SECRET, ACCESS_TOKEN, ACCESS_TOKEN_SECRET
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Credential Loading ─────────────────────────────────────────────────────

const CRED_PATH = '/root/.openclaw/credentials/x-twitter.json';

let _credentials = null;

export function loadCredentials() {
  if (_credentials) return _credentials;

  if (!fs.existsSync(CRED_PATH)) {
    throw new Error(
      `X/Twitter credentials not found at ${CRED_PATH}\n` +
      `Please create this file with your API keys. See: scripts/x-twitter/README.md`
    );
  }

  const raw = fs.readFileSync(CRED_PATH, 'utf-8');
  const creds = JSON.parse(raw);

  const required = ['API_KEY', 'API_SECRET', 'ACCESS_TOKEN', 'ACCESS_TOKEN_SECRET'];
  for (const key of required) {
    if (!creds[key]) {
      throw new Error(`Missing required credential: ${key} in ${CRED_PATH}`);
    }
  }

  _credentials = creds;
  return creds;
}

// ─── OAuth 1.0a Signature ───────────────────────────────────────────────────

function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

function generateTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

function buildOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');

  const baseString = [
    method.toUpperCase(),
    percentEncode(url),
    percentEncode(sortedParams),
  ].join('&');

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
}

function buildOAuthHeader(method, url, body = {}) {
  const creds = loadCredentials();

  const oauthParams = {
    oauth_consumer_key: creds.API_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: generateTimestamp(),
    oauth_token: creds.ACCESS_TOKEN,
    oauth_version: '1.0',
  };

  const allParams = { ...oauthParams };
  // For POST with JSON body, don't include body params in signature base

  const signature = buildOAuthSignature(
    method,
    url,
    allParams,
    creds.API_SECRET,
    creds.ACCESS_TOKEN_SECRET
  );

  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// ─── API Methods ────────────────────────────────────────────────────────────

const API_BASE = 'https://api.x.com/2';

/**
 * Post a single tweet
 * @param {string} text - Tweet text (max 280 chars)
 * @param {object} options - Optional: reply_to (tweet ID to reply to)
 * @returns {object} - { id, text } of the posted tweet
 */
export async function postTweet(text, options = {}) {
  if (!text || text.length === 0) {
    throw new Error('Tweet text cannot be empty');
  }
  if (text.length > 280) {
    throw new Error(`Tweet exceeds 280 characters (${text.length} chars)`);
  }

  const url = `${API_BASE}/tweets`;
  const body = { text };

  if (options.reply_to) {
    body.reply = { in_reply_to_tweet_id: options.reply_to };
  }

  const authHeader = buildOAuthHeader('POST', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) {
      const resetTime = response.headers.get('x-rate-limit-reset');
      throw new Error(
        `Rate limited by X API. Reset at: ${resetTime ? new Date(resetTime * 1000).toISOString() : 'unknown'}\n${errorBody}`
      );
    }
    throw new Error(`X API error (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Post a thread (array of tweets, each replying to the previous)
 * @param {string[]} tweets - Array of tweet texts
 * @returns {object[]} - Array of { id, text } for each posted tweet
 */
export async function postThread(tweets) {
  if (!tweets || tweets.length === 0) {
    throw new Error('Thread must contain at least one tweet');
  }

  const results = [];
  let previousId = null;

  for (let i = 0; i < tweets.length; i++) {
    const options = previousId ? { reply_to: previousId } : {};
    const result = await postTweet(tweets[i], options);
    results.push(result);
    previousId = result.id;

    // Small delay between thread tweets to avoid rate limits
    if (i < tweets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Delete a tweet by ID
 * @param {string} tweetId
 */
export async function deleteTweet(tweetId) {
  const url = `${API_BASE}/tweets/${tweetId}`;
  const authHeader = buildOAuthHeader('DELETE', url);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': authHeader },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete tweet ${tweetId}: ${errorBody}`);
  }

  return true;
}

/**
 * Get authenticated user info (verify credentials)
 */
export async function getMe() {
  const creds = loadCredentials();
  const url = `${API_BASE}/users/me`;
  const authHeader = buildOAuthHeader('GET', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': authHeader },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to get user info: ${errorBody}`);
  }

  const result = await response.json();
  return result.data;
}

// ─── Logging ────────────────────────────────────────────────────────────────

const LOG_DIR = '/root/.openclaw/logs/x-twitter';

export function logTweet(tweetData, type = 'tweet') {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      ...tweetData,
    };

    const logFile = path.join(LOG_DIR, `${new Date().toISOString().split('T')[0]}.jsonl`);
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (err) {
    console.error('Failed to write tweet log:', err.message);
  }
}
