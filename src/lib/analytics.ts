'use client';

import { track } from '@vercel/analytics';

/**
 * Lightweight event tracking for key user actions.
 * These events flow through Vercel Analytics → Analytics Drain → Supabase `page_views` table,
 * giving us engagement data to present to prospective partners and sponsors.
 *
 * All calls are fire-and-forget — they never block the UI.
 */

// ── Newsletter signup ────────────────────────────────────────────────────────
export function trackNewsletterSignup(variant: 'hero' | 'inline' | 'banner', page: string) {
  track('newsletter_signup', { variant, page });
}

// ── Contact / inquiry submitted ──────────────────────────────────────────────
export function trackContactInquiry(inquiryType: string, source?: string) {
  track('contact_inquiry', { inquiry_type: inquiryType, source: source || 'direct' });
}

// ── News article read (fires on article page load) ──────────────────────────
export function trackNewsArticleRead(slug: string, category: string) {
  track('news_article_read', { slug, category });
}

// ── Opportunity card click ───────────────────────────────────────────────────
export function trackOpportunityClick(title: string, category: string, section: string) {
  track('opportunity_click', { title, category, section });
}

// ── Outbound link click ──────────────────────────────────────────────────────
export function trackOutboundClick(url: string, context: string) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    track('outbound_click', { domain, url, context });
  } catch {
    track('outbound_click', { domain: 'unknown', url, context });
  }
}
