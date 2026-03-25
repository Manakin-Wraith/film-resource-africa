/**
 * LinkedIn Monitoring Enhancement for FRA
 * 
 * Enhances the existing LinkedIn email scanning with:
 * 1. Broader keyword matching
 * 2. Influencer-specific monitoring
 * 3. Better opportunity extraction
 * 4. Source tracking
 */

import { readFileSync } from 'fs';

const envFile = readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

// Enhanced LinkedIn email queries
const ENHANCED_LINKEDIN_QUERIES = [
  // Broader subject matching
  {
    query: 'from:newsletters-noreply@linkedin.com (film OR cinema OR Africa OR documentary OR "film festival" OR filmmaker OR "call for" OR submission OR deadline OR grant OR funding OR lab OR fellowship OR residency OR workshop OR masterclass)',
    name: 'LinkedIn Film Broad'
  },
  // Specific opportunity keywords
  {
    query: 'from:linkedin.com ("opportunity" OR "open call" OR "apply now" OR "applications open" OR "seeking submissions") -category:promotions',
    name: 'LinkedIn Opportunities'
  },
  // Industry news
  {
    query: 'from:linkedin.com (Africa AND (film OR cinema OR entertainment)) -category:promotions',
    name: 'LinkedIn Africa Film News'
  }
];

// Key LinkedIn influencers in African film space
const LINKEDIN_INFLUENCERS = [
  // Add actual email addresses of influencers you follow
  // 'first.last@linkedin.com',
];

// LinkedIn-specific opportunity patterns
const LINKEDIN_PATTERNS = {
  deadline: [
    /deadline\s*[:]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /closes\s*[:]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /due\s*[:]?\s*(\d{1,2}\s+\w+\s+\d{4})/i,
    /application\s+deadline\s*[:]?\s*(\d{1,2}\s+\w+\s+\d{4})/i
  ],
  amount: [
    /(\$|€|£|R)\s*(\d+[,\d]*)\s*(funding|grant|award|prize)/i,
    /funding\s+(?:of|up to)\s+(\$|€|£|R)\s*(\d+[,\d]*)/i,
    /grant\s+(?:of|worth)\s+(\$|€|£|R)\s*(\d+[,\d]*)/i
  ],
  link: [
    /(apply|application|submit|register|learn more)\s*(?:here|at)?\s*[:]?\s*(https?:\/\/[^\s<>"]+)/i,
    /<a\s+href="(https?:\/\/[^"]+)"[^>]*>(?:apply|submit|register)<\/a>/i
  ]
};

function extractLinkedInOpportunity(emailContent) {
  const extracted = {
    source: 'linkedin',
    confidence: 0,
    data: {}
  };

  // Check for opportunity indicators
  const opportunityIndicators = [
    'call for',
    'open call',
    'applications open',
    'seeking submissions',
    'deadline',
    'apply now',
    'grant opportunity',
    'funding available',
    'fellowship program',
    'residency program'
  ];

  let indicatorCount = 0;
  opportunityIndicators.forEach(indicator => {
    if (emailContent.toLowerCase().includes(indicator.toLowerCase())) {
      indicatorCount++;
    }
  });

  extracted.confidence = Math.min(indicatorCount / 3, 1.0); // Scale 0-1

  // Extract deadline
  for (const pattern of LINKEDIN_PATTERNS.deadline) {
    const match = emailContent.match(pattern);
    if (match) {
      extracted.data.deadline = match[1];
      break;
    }
  }

  // Extract funding amount
  for (const pattern of LINKEDIN_PATTERNS.amount) {
    const match = emailContent.match(pattern);
    if (match) {
      extracted.data.amount = `${match[1]}${match[2]}`;
      break;
    }
  }

  // Extract application link
  for (const pattern of LINKEDIN_PATTERNS.link) {
    const match = emailContent.match(pattern);
    if (match) {
      extracted.data.apply_link = match[1] || match[0];
      break;
    }
  }

  return extracted;
}

async function testLinkedInEnhancement() {
  console.log('=== LinkedIn Monitoring Enhancement Test ===\n');
  
  console.log('Enhanced Queries:');
  ENHANCED_LINKEDIN_QUERIES.forEach((q, i) => {
    console.log(`${i + 1}. ${q.name}: ${q.query}`);
  });
  
  console.log('\nExtraction Patterns:');
  console.log('- Deadline patterns:', LINKEDIN_PATTERNS.deadline.length);
  console.log('- Amount patterns:', LINKEDIN_PATTERNS.amount.length);
  console.log('- Link patterns:', LINKEDIN_PATTERNS.link.length);
  
  // Test extraction with sample content
  const sampleEmail = `
    New Film Funding Opportunity!
    
    The African Documentary Fund is now accepting applications for 2026.
    Funding available: $50,000 per project.
    Deadline: 15 April 2026
    
    Apply now: https://africandocfund.org/apply
    
    This is a great opportunity for African filmmakers to tell their stories.
  `;
  
  console.log('\n=== Sample Extraction Test ===');
  const result = extractLinkedInOpportunity(sampleEmail);
  console.log('Confidence:', result.confidence.toFixed(2));
  console.log('Extracted data:', JSON.stringify(result.data, null, 2));
  
  console.log('\n=== Implementation Instructions ===');
  console.log('1. Add these enhanced queries to scan_opportunities.mjs');
  console.log('2. Call extractLinkedInOpportunity() in email processing');
  console.log('3. Add source tracking to opportunities table');
  console.log('4. Consider adding influencer monitoring');
}

// Run test if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testLinkedInEnhancement();
}

export {
  ENHANCED_LINKEDIN_QUERIES,
  LINKEDIN_PATTERNS,
  extractLinkedInOpportunity
};