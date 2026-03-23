'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildWelcomeEmailHtml } from '@/lib/welcomeEmail';
import type { Country } from '@/lib/countries';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface Opportunity {
  id: number;
  title: string;
  "What Is It?": string;
  "For Films or Series?": string;
  "What Do You Get If Selected?": string;
  "Cost": string;
  "Next Deadline": string;
  "Apply:": string;
  "Who Can Apply / Eligibility": string;
  "What to Submit": string;
  "Strongest Submission Tips": string;
  "CALENDAR REMINDER:": string;
  logo?: string;
  status?: 'approved' | 'pending';
  created_at?: string;
  votes: number;
  category?: string;
  deadline_date?: string;
  application_status?: 'open' | 'closing_soon' | 'upcoming' | 'closed';
  updated_at?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  category: 'industry_news' | 'deadline_alert' | 'new_opportunity' | 'tip' | 'community_spotlight' | 'trailer';
  url?: string;
  slug?: string;
  image_url?: string;
  published_at: string;
  created_at?: string;
  status?: 'pending' | 'published' | 'rejected';
  submitted_by_name?: string;
  submitted_by_email?: string;
  project_name?: string;
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .order('id', { ascending: false });
      
    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch from Supabase', error);
    return [];
  }
}

export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'approved')
      .order('id', { ascending: false });
      
    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch approved from Supabase', error);
    return [];
  }
}

export async function getClosingSoonOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'approved')
      .eq('application_status', 'closing_soon')
      .order('deadline_date', { ascending: true });
      
    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch closing soon', error);
    return [];
  }
}

export async function getOpenOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'approved')
      .eq('application_status', 'open')
      .order('id', { ascending: false });
      
    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch open opportunities', error);
    return [];
  }
}

export async function getTrailers(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .eq('category', 'trailer')
      .order('published_at', { ascending: false })
      .limit(10);
      
    if (error) throw error;
    return data as NewsItem[];
  } catch (error) {
    console.error('Failed to fetch trailers', error);
    return [];
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .neq('category', 'trailer')
      .order('published_at', { ascending: false })
      .limit(6);
      
    if (error) throw error;
    return data as NewsItem[];
  } catch (error) {
    console.error('Failed to fetch news', error);
    return [];
  }
}

export async function getNewsArticle(slug: string): Promise<NewsItem | null> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .single();
      
    if (error) throw error;
    return data as NewsItem;
  } catch (error) {
    console.error('Failed to fetch news article', error);
    return null;
  }
}

export async function getAllNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
      
    if (error) throw error;
    return data as NewsItem[];
  } catch (error) {
    console.error('Failed to fetch all news', error);
    return [];
  }
}

export async function getAllNewsAdmin(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false });
      
    if (error) throw error;
    return data as NewsItem[];
  } catch (error) {
    console.error('Failed to fetch all news for admin', error);
    return [];
  }
}

export async function updateNewsItem(id: number, updatedFields: Partial<NewsItem>) {
  const { data, error } = await supabase
    .from('news')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as NewsItem;
}

export async function deleteNewsItem(id: number) {
  const { error } = await supabase
    .from('news')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

export async function getNewWaveOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'approved')
      .eq('category', 'AI & Emerging Tech')
      .order('id', { ascending: false });
      
    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch AI opportunities', error);
    return [];
  }
}

export async function getJustAddedOpportunities(): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'approved')
      .order('id', { ascending: false })
      .limit(20);
      
    if (error) throw error;
    // Filter client-side using the same logic as the badge helpers
    // IDs 56-65 are the most recently added batch (March 16 2026)
    // Also checks created_at if the column exists
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return (data as Opportunity[]).filter(opp => {
      if (opp.created_at) {
        const created = new Date(opp.created_at);
        return !isNaN(created.getTime()) && created >= twoWeeksAgo;
      }
      // Fallback: IDs 56-65
      return opp.id >= 56 && opp.id <= 65;
    });
  } catch (error) {
    console.error('Failed to fetch just added opportunities', error);
    return [];
  }
}

export async function getHeaderStats(): Promise<{ total: number; closingSoon: number; open: number }> {
  try {
    const { count: total } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved');

    const { count: closingSoon } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('application_status', 'closing_soon');

    const { count: open } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .eq('application_status', 'open');

    return {
      total: total || 0,
      closingSoon: closingSoon || 0,
      open: open || 0,
    };
  } catch (error) {
    console.error('Failed to fetch header stats', error);
    return { total: 0, closingSoon: 0, open: 0 };
  }
}

export async function addOpportunity(newOpp: Omit<Opportunity, 'id'>) {
  const targetOpp = { status: 'approved' as const, ...newOpp };
  const { data, error } = await supabase
    .from('opportunities')
    .insert([targetOpp])
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function submitPublicOpportunity(newOpp: Omit<Opportunity, 'id' | 'status'>) {
  const targetOpp = { ...newOpp, status: 'pending' as const };
  const { data, error } = await supabase
    .from('opportunities')
    .insert([targetOpp])
    .select()
    .single();
    
  if (error) throw new Error(error.message);

  // Notify Admin via Email (Resend)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `New Opportunity Submission: ${newOpp.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #3b82f6;">New Submission Received</h2>
          <p>A new opportunity has been submitted and is pending approval.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Title:</strong> ${newOpp.title}</p>
            <p style="margin: 5px 0;"><strong>Format:</strong> ${newOpp["For Films or Series?"]}</p>
            <p style="margin: 5px 0;"><strong>Deadline:</strong> ${newOpp["Next Deadline"]}</p>
          </div>
          <p><strong>Description:</strong></p>
          <p style="line-height: 1.6;">${newOpp["What Is It?"]}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">Log in to the admin dashboard to review and approve.</p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://film-resource-africa.vercel.app/admin" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Admin Dashboard</a>
          </div>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Failed to send notification email", emailError);
    // Silent fail for email to avoid blocking the submission
  }

  return data as Opportunity;
}

export async function updateOpportunity(id: number, updatedFields: Partial<Opportunity>) {
  const { data, error } = await supabase
    .from('opportunities')
    .update(updatedFields)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw new Error(error.message);
  return data as Opportunity;
}

export async function deleteOpportunity(id: number) {
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  return true;
}

export async function voteOpportunity(id: number) {
  // First get current votes
  const { data: current, error: getError } = await supabase
    .from('opportunities')
    .select('votes')
    .eq('id', id)
    .single();

  if (getError) throw new Error(getError.message);

  const newVotes = (current?.votes || 0) + 1;

  const { data, error } = await supabase
    .from('opportunities')
    .update({ votes: newVotes })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Opportunity;
}
export type InquiryType = 'general' | 'partner' | 'advertise';

export interface Inquiry {
  id?: string;
  name?: string;
  email: string;
  message: string;
  type?: InquiryType;
  status?: string;
  created_at?: string;
}

export async function submitInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'created_at'>, type: InquiryType = 'general', source?: string) {
  const messageWithSource = source
    ? `[Source: ${source}]\n\n${inquiry.message}`
    : inquiry.message;

  const { error } = await supabase
    .from('contacts')
    .insert([{ ...inquiry, message: messageWithSource, type }]);

  if (error) throw new Error(error.message);

  // Notify Admin via Email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `[${type.toUpperCase()}]${source ? ` [${source}]` : ''} New Inquiry from ${inquiry.email}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #3b82f6;">New Contact Inquiry</h2>
          <p>A new message has been received through the contact form.</p>
          ${source ? `<p style="margin: 5px 0; padding: 8px 12px; background: #fef3c7; border-radius: 6px; font-size: 13px;"><strong>Source Section:</strong> ${source}</p>` : ''}
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${inquiry.name || 'Anonymous'}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${inquiry.email}</p>
          </div>
          <p><strong>Message:</strong></p>
          <p style="line-height: 1.6; white-space: pre-wrap;">${inquiry.message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">This inquiry has been logged in Supabase.</p>
        </div>
      `
    });
  } catch (emailError) {
    console.error("Failed to send inquiry notification email", emailError);
  }

  return { success: true };
}

// ─── Sponsored Placements ───────────────────────────────────────────────────

export interface SponsoredPlacement {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_logo_url: string | null;
  section: string;
  slot_position: number;
  variant: 'minimal' | 'branded';
  cta_text: string;
  start_date: string;
  end_date: string | null;
  active: boolean;
  partner_about?: string | null;
  partner_services?: string | null;
  partner_cta_url?: string | null;
  partner_featured_image_url?: string | null;
  partner_bundle?: 'starter' | 'growth' | 'headline';
}

export async function getActivePlacements(): Promise<SponsoredPlacement[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('sponsored_placements')
      .select(`
        id,
        partner_id,
        section,
        slot_position,
        variant,
        cta_text,
        start_date,
        end_date,
        active,
        partners (
          name,
          logo_url,
          bundle,
          about,
          services,
          cta_url,
          featured_image_url
        )
      `)
      .eq('active', true)
      .lte('start_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('slot_position', { ascending: true });

    if (error) throw error;

    return (data || []).map((p: Record<string, unknown>) => {
      const partner = p.partners as Record<string, unknown> | null;
      return {
        id: p.id as string,
        partner_id: p.partner_id as string,
        partner_name: partner?.name as string || 'Partner',
        partner_logo_url: (partner?.logo_url as string) || null,
        partner_about: (partner?.about as string) || null,
        partner_services: (partner?.services as string) || null,
        partner_cta_url: (partner?.cta_url as string) || null,
        partner_featured_image_url: (partner?.featured_image_url as string) || null,
        partner_bundle: (partner?.bundle as 'starter' | 'growth' | 'headline') || 'starter',
        section: p.section as string,
        slot_position: p.slot_position as number,
        variant: p.variant as 'minimal' | 'branded',
        cta_text: p.cta_text as string,
        start_date: p.start_date as string,
        end_date: p.end_date as string | null,
        active: p.active as boolean,
      };
    });
  } catch (err) {
    console.error('Failed to fetch active placements', err);
    return [];
  }
}

export async function trackSponsoredClick(
  placementId: string | null,
  partnerId: string | null,
  section: string,
  slotPosition: number | null
) {
  try {
    await supabase
      .from('sponsored_clicks')
      .insert([{
        placement_id: placementId,
        partner_id: partnerId,
        section,
        slot_position: slotPosition,
      }]);
  } catch (err) {
    // Silent fail — tracking should never block the user
    console.error('Failed to track sponsored click', err);
  }
}

export async function trackSponsoredImpression(
  placementId: string,
  partnerId: string,
  section: string,
  slotPosition: number
) {
  try {
    await supabase
      .from('sponsored_impressions')
      .insert([{
        placement_id: placementId,
        partner_id: partnerId,
        section,
        slot_position: slotPosition,
      }]);
  } catch (err) {
    console.error('Failed to track sponsored impression', err);
  }
}

// ─── The Call Sheet ──────────────────────────────────────────────────────────

export interface CallSheetListing {
  id: string;
  title: string;
  production_title: string;
  production_company: string;
  producer_name: string;
  producer_email: string;
  category: string;
  description: string;
  requirements?: string;
  compensation: string;
  compensation_type: string;
  location: string;
  project_stage: string;
  start_date?: string;
  duration?: string;
  application_url?: string;
  website?: string;
  mentorship_included: boolean;
  status: 'pending' | 'approved' | 'closed';
  created_at?: string;
  updated_at?: string;
}

export async function getCallSheetListings(): Promise<CallSheetListing[]> {
  try {
    const { data, error } = await supabase
      .from('call_sheet_listings')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CallSheetListing[];
  } catch (error) {
    console.error('Failed to fetch call sheet listings', error);
    return [];
  }
}

export async function getAllCallSheetListings(): Promise<CallSheetListing[]> {
  try {
    const { data, error } = await supabase
      .from('call_sheet_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CallSheetListing[];
  } catch (error) {
    console.error('Failed to fetch all call sheet listings', error);
    return [];
  }
}

export async function submitCallSheetListing(listing: Omit<CallSheetListing, 'id' | 'status' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('call_sheet_listings')
    .insert([{ ...listing, status: 'pending' }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `New Call Sheet Listing: ${listing.title} — ${listing.production_title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #0d9488;">New Call Sheet Submission</h2>
          <p>A new listing has been submitted and is pending approval.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Role:</strong> ${listing.title}</p>
            <p style="margin: 5px 0;"><strong>Production:</strong> ${listing.production_title}</p>
            <p style="margin: 5px 0;"><strong>Company:</strong> ${listing.production_company}</p>
            <p style="margin: 5px 0;"><strong>Producer:</strong> ${listing.producer_name}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${listing.category}</p>
            <p style="margin: 5px 0;"><strong>Compensation:</strong> ${listing.compensation} (${listing.compensation_type})</p>
            <p style="margin: 5px 0;"><strong>Location:</strong> ${listing.location}</p>
          </div>
          <p><strong>Description:</strong></p>
          <p style="line-height: 1.6;">${listing.description}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">Log in to the admin dashboard to review and approve.</p>
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://film-resource-africa.vercel.app/admin" style="background: #0d9488; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Admin Dashboard</a>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send call sheet notification email', emailError);
  }

  return data as CallSheetListing;
}

export async function updateCallSheetListing(id: string, updatedFields: Partial<CallSheetListing>) {
  const { data, error } = await supabase
    .from('call_sheet_listings')
    .update({ ...updatedFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as CallSheetListing;
}

export async function deleteCallSheetListing(id: string) {
  const { error } = await supabase
    .from('call_sheet_listings')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

// ─── Community Spotlight ─────────────────────────────────────────────────────

export async function uploadSpotlightImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file || !file.size) throw new Error('No file provided');

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) throw new Error('File too large. Maximum size is 5MB.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) throw new Error('Invalid file type. Please upload a JPG, PNG, WebP, or GIF.');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `spotlight-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `spotlight/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('directory-logos')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('directory-logos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

interface CommunitySubmission {
  title: string;
  summary: string;
  content: string;
  project_name?: string;
  submitted_by_name: string;
  submitted_by_email: string;
  url?: string;
  image_url?: string;
}

export async function submitCommunitySpotlight(submission: CommunitySubmission) {
  const slug = submission.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/, '');

  const { data, error } = await supabase
    .from('news')
    .insert([{
      title: submission.title,
      summary: submission.summary,
      content: submission.content,
      category: 'community_spotlight',
      slug: `community-${slug}-${Date.now().toString(36)}`,
      url: submission.url || null,
      image_url: submission.image_url || null,
      status: 'pending',
      published_at: new Date().toISOString(),
      submitted_by_name: submission.submitted_by_name,
      submitted_by_email: submission.submitted_by_email,
      project_name: submission.project_name || null,
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `Community Spotlight Submission: ${submission.title}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #f59e0b;">🌟 New Community Spotlight Submission</h2>
          <p>A community member has submitted their project for the spotlight.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Title:</strong> ${submission.title}</p>
            ${submission.project_name ? `<p style="margin: 5px 0;"><strong>Project:</strong> ${submission.project_name}</p>` : ''}
            <p style="margin: 5px 0;"><strong>Submitted by:</strong> ${submission.submitted_by_name} (${submission.submitted_by_email})</p>
            ${submission.url ? `<p style="margin: 5px 0;"><strong>Link:</strong> <a href="${submission.url}">${submission.url}</a></p>` : ''}
          </div>
          <p><strong>Summary:</strong></p>
          <p style="line-height: 1.6;">${submission.summary}</p>
          <p><strong>Full Story:</strong></p>
          <p style="line-height: 1.6;">${submission.content.slice(0, 500)}${submission.content.length > 500 ? '...' : ''}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 14px; color: #666;">Log in to Supabase to review and set status to "published".</p>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send community spotlight notification', emailError);
  }

  return { success: true, id: data.id };
}

// ─── Image Upload ───────────────────────────────────────────────────────────

export async function uploadDirectoryImage(formData: FormData): Promise<string> {
  const file = formData.get('file') as File;
  if (!file || !file.size) throw new Error('No file provided');

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) throw new Error('File too large. Maximum size is 5MB.');

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowed.includes(file.type)) throw new Error('Invalid file type. Please upload a JPG, PNG, WebP, GIF, or SVG.');

  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filePath = `logos/${fileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from('directory-logos')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from('directory-logos')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// ─── Partners ───────────────────────────────────────────────────────────────

export interface Partner {
  id: number;
  name: string;
  logo_url: string;
  website?: string | null;
  tier: 'partner' | 'sponsor';
  status: 'pending' | 'approved' | 'rejected';
  sort_order: number;
  bundle: 'starter' | 'growth' | 'headline';
  about?: string | null;
  services?: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  featured_image_url?: string | null;
  newsletter_type: 'mention' | 'spotlight';
  created_at: string;
  updated_at: string;
}

export async function getApprovedPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'approved')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getAllPartners(): Promise<Partner[]> {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch partners', error);
    return [];
  }
}

export async function addPartner(partner: Omit<Partner, 'id' | 'created_at' | 'updated_at'>): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .insert(partner)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-create sponsored placement for Growth/Headline bundles
  if (data && (partner.bundle === 'growth' || partner.bundle === 'headline')) {
    await supabase.from('sponsored_placements').insert({
      partner_id: data.id,
      section: 'Latest News',
      slot_position: 1,
      variant: 'branded',
      cta_text: partner.cta_text || 'Visit Website',
      start_date: new Date().toISOString().split('T')[0],
      end_date: null,
      active: true,
    });
  }

  return data;
}

export async function updatePartner(id: number, updates: Partial<Partner>): Promise<Partner> {
  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Auto-manage sponsored placement based on bundle
  if (updates.bundle) {
    const hasProfileCard = updates.bundle === 'growth' || updates.bundle === 'headline';
    const { data: existing } = await supabase
      .from('sponsored_placements')
      .select('id')
      .eq('partner_id', id)
      .eq('section', 'Latest News')
      .maybeSingle();

    if (hasProfileCard && !existing) {
      // Upgrading to Growth/Headline — create placement
      await supabase.from('sponsored_placements').insert({
        partner_id: id,
        section: 'Latest News',
        slot_position: 1,
        variant: 'branded',
        cta_text: updates.cta_text || data.cta_text || 'Visit Website',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        active: true,
      });
    } else if (hasProfileCard && existing) {
      // Already has placement — update cta_text if changed
      await supabase.from('sponsored_placements')
        .update({ cta_text: updates.cta_text || data.cta_text || 'Visit Website', active: true })
        .eq('id', existing.id);
    } else if (!hasProfileCard && existing) {
      // Downgrading to Starter — deactivate placement
      await supabase.from('sponsored_placements')
        .update({ active: false })
        .eq('id', existing.id);
    }
  }

  return data;
}

export async function deletePartner(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

// ─── Industry Directory ─────────────────────────────────────────────────────

export interface DirectoryListing {
  id: number;
  name: string;
  directory_type: 'company' | 'crew' | 'service' | 'training' | 'agency';
  category: string;
  description: string;
  country: string;
  city?: string;
  website?: string;
  email?: string;
  phone?: string;
  logo_url?: string;
  // Company
  speciality?: string;
  notable_projects?: string;
  year_founded?: number;
  company_size?: 'indie' | 'mid' | 'major';
  // Crew
  role?: string;
  secondary_roles?: string;
  bio?: string;
  portfolio_url?: string;
  credits?: string;
  availability?: 'available' | 'busy' | 'selective';
  day_rate_range?: string;
  // Service
  service_type?: string;
  pricing_tier?: 'budget' | 'mid' | 'premium';
  // Training
  program_type?: 'school' | 'workshop' | 'online' | 'mentorship' | 'masterclass';
  duration?: string;
  cost?: string;
  accreditation?: string;
  next_intake?: string;
  // Meta
  status: 'approved' | 'pending' | 'rejected';
  featured: boolean;
  verified: boolean;
  votes: number;
  submitted_by_email?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getDirectoryListings(type?: string): Promise<DirectoryListing[]> {
  try {
    let query = supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('votes', { ascending: false })
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('directory_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as DirectoryListing[];
  } catch (error) {
    console.error('Failed to fetch directory listings', error);
    return [];
  }
}

export async function getDirectoryListingsByCountry(countryName: string): Promise<DirectoryListing[]> {
  try {
    const { data, error } = await supabase
      .from('directory_listings')
      .select('*')
      .eq('status', 'approved')
      .eq('country', countryName)
      .order('featured', { ascending: false })
      .order('votes', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as DirectoryListing[];
  } catch (error) {
    console.error('Failed to fetch directory listings by country', error);
    return [];
  }
}

export async function getAllDirectoryListings(): Promise<DirectoryListing[]> {
  try {
    const { data, error } = await supabase
      .from('directory_listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as DirectoryListing[];
  } catch (error) {
    console.error('Failed to fetch all directory listings', error);
    return [];
  }
}

export async function submitDirectoryListing(listing: Omit<DirectoryListing, 'id' | 'status' | 'featured' | 'verified' | 'votes' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('directory_listings')
    .insert([{ ...listing, status: 'pending', featured: false, verified: false, votes: 0 }])
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Notify admin
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const typeLabels: Record<string, string> = { company: 'Production Company', crew: 'Crew Member', service: 'Service Provider', training: 'Training Program', agency: 'Agency' };
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `New Directory Listing: ${listing.name} (${typeLabels[listing.directory_type] || listing.directory_type})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #3b82f6;">New Directory Submission</h2>
          <p>A new ${typeLabels[listing.directory_type] || listing.directory_type} listing has been submitted.</p>
          <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Name:</strong> ${listing.name}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${typeLabels[listing.directory_type]}</p>
            <p style="margin: 5px 0;"><strong>Category:</strong> ${listing.category}</p>
            <p style="margin: 5px 0;"><strong>Country:</strong> ${listing.country}${listing.city ? ', ' + listing.city : ''}</p>
            ${listing.website ? `<p style="margin: 5px 0;"><strong>Website:</strong> ${listing.website}</p>` : ''}
          </div>
          <p><strong>Description:</strong></p>
          <p style="line-height: 1.6;">${listing.description}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://film-resource-africa.com/admin" style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Go to Admin Dashboard</a>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error('Failed to send directory notification email', emailError);
  }

  return data as DirectoryListing;
}

export async function updateDirectoryListing(id: number, updatedFields: Partial<DirectoryListing>) {
  const { data, error } = await supabase
    .from('directory_listings')
    .update({ ...updatedFields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as DirectoryListing;
}

export async function deleteDirectoryListing(id: number) {
  const { error } = await supabase
    .from('directory_listings')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

export async function voteDirectoryListing(id: number) {
  const { data: current } = await supabase
    .from('directory_listings')
    .select('votes')
    .eq('id', id)
    .single();

  const { error } = await supabase
    .from('directory_listings')
    .update({ votes: (current?.votes || 0) + 1 })
    .eq('id', id);

  if (error) throw new Error(error.message);
  return true;
}

export async function subscribeToNewsletter(email: string) {
  console.log(`[Newsletter] Attempting subscription for: ${email}`);
  try {
    if (!supabase) {
      console.error("[Newsletter] Supabase client not initialized");
      throw new Error("Database client not found");
    }

    // Check if already subscribed
    console.log("[Newsletter] Checking for existing subscription...");
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error("[Newsletter] Error checking subscription:", checkError);
      throw new Error(`Database check failed: ${checkError.message}`);
    }

    if (existing) {
      console.log("[Newsletter] User already subscribed.");
      return { success: true, alreadySubscribed: true };
    }

    console.log("[Newsletter] Inserting new subscription...");
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert([{ email }])
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Newsletter] Error inserting subscription:", error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log("[Newsletter] Success! Sending welcome email + admin notification...");
    try {
      const apiKey = process.env.RESEND_API_KEY;
      if (apiKey) {
        const resend = new Resend(apiKey);
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://film-resource-africa.com';

        const [welcomeResult] = await Promise.allSettled([
          resend.emails.send({
            from: 'Film Resource Africa <hello@film-resource-africa.com>',
            to: [email],
            subject: 'Welcome to Film Resource Africa — your first deadline alert is inside',
            html: buildWelcomeEmailHtml(siteUrl),
          }),
          resend.emails.send({
            from: 'Film Resource Africa <hello@film-resource-africa.com>',
            to: ['hello@film-resource-africa.com'],
            subject: `New Newsletter Subscriber: ${email}`,
            html: `<p>New subscriber: <strong>${email}</strong></p>`,
          }),
        ]);

        if (welcomeResult.status === 'fulfilled') {
          await supabase
            .from('newsletter_subscriptions')
            .update({ welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() })
            .eq('email', email);
          console.log("[Newsletter] Welcome email sent and tracked.");
        } else {
          console.error("[Newsletter] Welcome email failed:", welcomeResult.reason);
        }
      } else {
        console.warn("[Newsletter] RESEND_API_KEY missing, skipping emails.");
      }
    } catch (emailError) {
      console.error("[Newsletter] Non-critical email error:", emailError);
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("[Newsletter] CRITICAL ACTION FAILURE:", error.message || error);
    throw error;
  }
}

// ─── Location Pages (Countries) ──────────────────────────────────────────────

export async function getCountryBySlug(slug: string): Promise<Country | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data as Country;
  } catch (error) {
    console.error('Failed to fetch country', error);
    return null;
  }
}

export async function getAllCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Country[];
  } catch (error) {
    console.error('Failed to fetch countries', error);
    return [];
  }
}

export async function getCountriesWithOpportunityCounts(): Promise<
  Array<{ country: Country; opportunity_count: number }>
> {
  try {
    const countries = await getAllCountries();
    const results = await Promise.all(
      countries.map(async (country) => {
        const { count } = await supabase
          .from('opportunity_countries')
          .select('*', { count: 'exact', head: true })
          .eq('country_id', country.id);
        return { country, opportunity_count: count || 0 };
      })
    );
    return results;
  } catch (error) {
    console.error('Failed to fetch countries with counts', error);
    return [];
  }
}

export async function getCountryOpportunities(countryId: string): Promise<Opportunity[]> {
  try {
    const { data: links, error: linkError } = await supabase
      .from('opportunity_countries')
      .select('opportunity_id')
      .eq('country_id', countryId);

    if (linkError) throw linkError;
    if (!links || links.length === 0) return [];

    const oppIds = links.map((l) => l.opportunity_id);

    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .in('id', oppIds)
      .eq('status', 'approved')
      .order('id', { ascending: false });

    if (error) throw error;
    return data as Opportunity[];
  } catch (error) {
    console.error('Failed to fetch country opportunities', error);
    return [];
  }
}
