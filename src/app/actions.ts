'use server';

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildWelcomeEmailHtml } from '@/lib/welcomeEmail';

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
  category: 'industry_news' | 'deadline_alert' | 'new_opportunity' | 'tip';
  url?: string;
  slug?: string;
  image_url?: string;
  published_at: string;
  created_at?: string;
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

export async function getNews(): Promise<NewsItem[]> {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
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
      .order('published_at', { ascending: false });
      
    if (error) throw error;
    return data as NewsItem[];
  } catch (error) {
    console.error('Failed to fetch all news', error);
    return [];
  }
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

export async function submitInquiry(inquiry: Omit<Inquiry, 'id' | 'status' | 'created_at'>, type: InquiryType = 'general') {
  const { error } = await supabase
    .from('contacts')
    .insert([{ ...inquiry, type }]);

  if (error) throw new Error(error.message);

  // Notify Admin via Email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'Film Resource Africa <hello@film-resource-africa.com>',
      to: ['hello@film-resource-africa.com'],
      subject: `[${type.toUpperCase()}] New Inquiry from ${inquiry.email}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #3b82f6;">New Contact Inquiry</h2>
          <p>A new message has been received through the contact form.</p>
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
