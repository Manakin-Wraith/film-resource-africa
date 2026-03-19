# X/Twitter Integration for Film Resource Africa

Manages the **@film_resource_** account: https://x.com/film_resource_

## Setup

### 1. Get X API Credentials

1. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a **Project** and an **App** inside it
3. Set the app permissions to **Read and Write**
4. Under **Keys and Tokens**, generate:
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)
   - **Access Token** (with Read+Write)
   - **Access Token Secret**
   - **Bearer Token**
5. Make sure the app is associated with the **@film_resource_** account

### 2. Configure Credentials

Edit `/root/.openclaw/credentials/x-twitter.json` and fill in all keys:

```json
{
  "API_KEY": "your-api-key",
  "API_SECRET": "your-api-secret",
  "ACCESS_TOKEN": "your-access-token",
  "ACCESS_TOKEN_SECRET": "your-access-token-secret",
  "BEARER_TOKEN": "your-bearer-token"
}
```

### 3. Create Tweet Log Table

Run the SQL migration in Supabase:

```bash
# Copy/paste the contents of ../../create_tweet_log_table.sql into the Supabase SQL Editor
```

### 4. Test Connection

```bash
node scripts/x-twitter/test-connection.mjs
```

## Scripts

| Script | Description |
|--------|-------------|
| `post-tweet.mjs` | Post a single tweet: `node post-tweet.mjs "text"` |
| `post-thread.mjs` | Post a thread: `node post-thread.mjs "t1" "t2" "t3"` |
| `auto-tweet-opportunity.mjs` | Auto-tweet the latest un-tweeted opportunity |
| `auto-tweet-news.mjs` | Auto-tweet the latest un-tweeted news article |
| `tweet-deadline-alert.mjs` | Post deadline alerts for opportunities closing within 7 days |
| `test-connection.mjs` | Verify API credentials and connection |

## OpenClaw Skill

The skill is registered at `/root/.openclaw/skills/x-twitter/SKILL.md` and can be invoked by the OpenClaw agent for automated social media management.

## Logs

Tweet logs are written to:
- **Supabase:** `tweet_log` table (for deduplication and tracking)
- **Local:** `/root/.openclaw/logs/x-twitter/YYYY-MM-DD.jsonl`
