#!/bin/bash
# Parse African Film Press RSS feed and insert top articles into Supabase news table
# Skips articles that already exist (by title match)

echo "=== Fetching AFP RSS Feed ==="
curl -s -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" \
  "https://africanfilmpress.com/articles/feed.xml" -o /tmp/afp_feed.xml

echo "=== Parsing and inserting ==="
python3 << 'PYEOF'
import xml.etree.ElementTree as ET
import json, subprocess, sys, re, urllib.request

SUPABASE_URL = "https://rcgynwcttgvqcnbyfhiz.supabase.co"
SUPABASE_KEY = "sb_publishable_DGjAbWbzmEo7yqEOibia0A_r9mWOu-W"

# Read locally-fetched RSS
with open('/tmp/afp_feed.xml', 'r', encoding='utf-8') as f:
    rss_text = f.read()

root = ET.fromstring(rss_text)
channel = root.find('channel')
items = channel.findall('item')

# Get existing news titles to avoid duplicates
import urllib.parse
check_url = f"{SUPABASE_URL}/rest/v1/news?select=title"
req = urllib.request.Request(check_url)
req.add_header("apikey", SUPABASE_KEY)
req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
with urllib.request.urlopen(req) as resp:
    existing = json.loads(resp.read().decode('utf-8'))
existing_titles = {item['title'] for item in existing}
print(f"Found {len(existing_titles)} existing news articles")

# Process top 8 most recent items
inserted = 0
skipped = 0

for item in items[:8]:
    title_el = item.find('title')
    link_el = item.find('link')
    desc_el = item.find('description')
    pub_el = item.find('pubDate')
    
    # Get enclosure (image) URL
    enc_el = item.find('enclosure')
    image_url = enc_el.get('url') if enc_el is not None else None
    
    if title_el is None or title_el.text is None:
        continue
    
    title = title_el.text.strip()
    
    if title in existing_titles:
        print(f"  SKIP (exists): {title}")
        skipped += 1
        continue
    
    link = link_el.text.strip() if link_el is not None and link_el.text else None
    description = desc_el.text.strip() if desc_el is not None and desc_el.text else ""
    pub_date = pub_el.text.strip() if pub_el is not None and pub_el.text else None
    
    # Generate slug from link
    slug = None
    if link:
        slug = link.rstrip('/').split('/')[-1]
    
    # Build the news item
    news_item = {
        "title": title,
        "summary": description[:300] if description else "",
        "content": description,
        "category": "industry_news",
        "url": link,
        "slug": slug,
        "image_url": image_url,
        "published_at": pub_date,
    }
    
    # Insert via REST API
    insert_url = f"{SUPABASE_URL}/rest/v1/news"
    data = json.dumps(news_item).encode('utf-8')
    req = urllib.request.Request(insert_url, data=data, method='POST')
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            print(f"  INSERTED: {title} (id={result[0]['id']})")
            inserted += 1
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"  ERROR inserting '{title}': {e.code} - {error_body}")

print(f"\n=== Done: {inserted} inserted, {skipped} skipped (duplicates) ===")
PYEOF
