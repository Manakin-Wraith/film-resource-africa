import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Vercel Analytics Drain endpoint
// Receives batched pageview/event data from Vercel and inserts into Supabase
// Docs: https://vercel.com/docs/drains/reference/analytics

const DRAIN_SECRET = (process.env.ANALYTICS_DRAIN_SECRET || '').trim();

interface VercelAnalyticsEvent {
  schema: string;
  eventType: 'pageview' | 'event';
  eventName?: string;
  eventData?: string;
  timestamp: number;
  projectId: string;
  ownerId: string;
  sessionId?: number;
  deviceId?: number;
  origin?: string;
  path: string;
  route?: string;
  referrer?: string;
  queryParams?: string;
  country?: string;
  region?: string;
  city?: string;
  osName?: string;
  osVersion?: string;
  clientName?: string;
  clientVersion?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
}

// Crawlers and automated clients add write load without telling us anything about real readers.
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|python|curl|wget|scrapy|go-http|java\/|okhttp|axios|node-fetch|facebookexternalhit|preview|monitor|uptime|pingdom/i;

function isBot(evt: VercelAnalyticsEvent): boolean {
  return (
    evt.deviceType?.toLowerCase() === 'bot' ||
    BOT_PATTERN.test(evt.clientName || '') ||
    BOT_PATTERN.test(evt.deviceBrand || '') ||
    BOT_PATTERN.test(evt.deviceModel || '')
  );
}

function parseEventData(raw?: string): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Vercel sends a GET with x-vercel-verify header to validate the drain endpoint
export async function GET(req: NextRequest) {
  const verify = req.headers.get('x-vercel-verify');
  if (verify && DRAIN_SECRET && verify === DRAIN_SECRET) {
    return new NextResponse(verify, { status: 200 });
  }
  return NextResponse.json({ status: 'ok', auth: DRAIN_SECRET ? 'enabled' : 'open' });
}

export async function POST(req: NextRequest) {
  // Auth: check header, query param, or Vercel's x-vercel-verify
  const secret =
    req.headers.get('x-vercel-drain-secret')?.trim() ||
    req.headers.get('x-vercel-verify')?.trim() ||
    req.nextUrl.searchParams.get('secret')?.trim() ||
    '';

  if (DRAIN_SECRET && secret !== DRAIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Analytics Drain] Missing Supabase env vars');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const contentType = req.headers.get('content-type') || '';
    let events: VercelAnalyticsEvent[] = [];

    if (contentType.includes('application/x-ndjson')) {
      // NDJSON format: one JSON object per line
      const text = await req.text();
      events = text
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } else {
      // JSON array format
      const body = await req.json();
      events = Array.isArray(body) ? body : [body];
    }

    const received = events.length;
    events = events.filter(evt => evt.path && !isBot(evt));

    if (events.length === 0) {
      return NextResponse.json({ received, stored: 0 });
    }

    // Map Vercel events to our page_views table schema
    const rows = events.map(evt => ({
      event_type: evt.eventType || 'pageview',
      event_name: evt.eventName || null,
      event_data: parseEventData(evt.eventData),
      timestamp: new Date(evt.timestamp).toISOString(),
      session_id: evt.sessionId || null,
      device_id: evt.deviceId || null,
      path: evt.path,
      route: evt.route || null,
      referrer: evt.referrer || null,
      query_params: evt.queryParams || null,
      country: evt.country || null,
      region: evt.region || null,
      city: evt.city || null,
      os_name: evt.osName || null,
      os_version: evt.osVersion || null,
      browser: evt.clientName || null,
      browser_version: evt.clientVersion || null,
      device_type: evt.deviceType || null,
      device_brand: evt.deviceBrand || null,
      device_model: evt.deviceModel || null,
    }));

    // Batch insert. Failures return 200 on purpose: analytics is best-effort, and a non-2xx makes
    // Vercel retry the batch, which piles more writes onto a database that may already be struggling.
    const { error } = await supabase.from('page_views').insert(rows);

    if (error) {
      console.error('[Analytics Drain] Insert error (batch dropped):', error.message);
      return NextResponse.json({ received, stored: 0, dropped: rows.length });
    }

    return NextResponse.json({ received, stored: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Analytics Drain] Error (batch dropped):', message);
    return NextResponse.json({ received: 0, stored: 0, error: message });
  }
}
