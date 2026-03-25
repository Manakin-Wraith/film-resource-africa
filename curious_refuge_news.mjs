/**
 * Curious Refuge AI Film School News Article
 * For insertion into FRA news database
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
if (!supabaseUrl || !supabaseKey) { console.error('Missing Supabase env vars'); process.exit(1); }

const DRY_RUN = process.argv.includes('--dry-run');
const headers = { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` };

async function supabaseInsert(table, item) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`INSERT failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function getExistingNewsTitles() {
  const res = await fetch(`${supabaseUrl}/rest/v1/news?select=title`, { headers });
  const data = await res.json();
  return new Set(data.map(n => n.title.toLowerCase().trim()));
}

// Curious Refuge news article
const curiousRefugeNews = {
  title: 'Curious Refuge AI Film School: Hollywood\'s Answer to AI Job Anxiety',
  slug: 'curious-refuge-ai-film-school-hollywood-answer-ai-job-anxiety',
  summary: 'As Hollywood grapples with AI-induced job anxiety, Curious Refuge AI Film School offers a solution: teaching industry professionals how to integrate AI into their filmmaking workflow. Founded by Shelby and Caleb Ward, the online school provides curated courses in AI filmmaking, advertising, screenwriting, VFX, and documentary.',
  content: `In the face of Hollywood's growing anxiety over AI potentially displacing jobs, a new solution has emerged: Curious Refuge AI Film School. Founded three years ago by Shelby and Caleb Ward, this online school bills itself as the foremost institution for teaching AI filmmaking skills.

The school was created as a "safe space" for creators from all backgrounds to learn AI storytelling and production techniques. Its coursework includes AI filmmaking, advertising, screenwriting, VFX, and documentary tracks. Students learn through video tutorials, hands-on AI tool training, and must create a short film using primarily AI to pass a course.

What makes Curious Refuge particularly notable is its student demographic: 95% are already professionals in the entertainment or advertising industries. Even Oscar-winning production designer Rick Carter (Forrest Gump, Star Wars: The Force Awakens) has enrolled, seeing AI as an opportunity to learn valuable new skills rather than a threat.

"I'm just not a static person — I'm moving forward as long as I'm here and the artists I admire the most are those who've evolved throughout their lifetimes," Carter told The Hollywood Reporter. "So that's why I picked going down this road."

The school's parent company, Promise (backed by Google, Peter Chernin's North Road, and Michael Ovitz's Crossbeam), provides job placement assistance for graduates. Success stories include VFX artist Michael Eng (Black Panther: Wakanda Forever), who told Reuters he "started getting work immediately" after completing the courses.

With courses costing $749 plus $200-500 for recommended AI tools, Curious Refuge represents a significant investment for professionals looking to future-proof their careers. As Caleb Ward puts it: "Is AI coming for your job? No. AI is not coming for your job. But AI will more than likely be required for your job, like a computer is required for most professions today."

The school is preparing to transition to a subscription model that will open its library of content for a recurring fee and add more one-on-one feedback with experts.`,
  category: 'industry_news',
  published_at: new Date().toISOString(),
  image_url: null,
  source_url: 'https://www.hollywoodreporter.com/movies/movie-features/curious-refuge-ai-film-school-hollywood-1236546505/',
  author: 'The Hollywood Reporter',
  is_featured: false,
  status: 'published'
};

async function main() {
  console.log('=== Curious Refuge AI Film School News Article ===\n');
  
  // Check if already exists
  const existingTitles = await getExistingNewsTitles();
  const normalizedTitle = curiousRefugeNews.title.toLowerCase().trim();
  
  if (existingTitles.has(normalizedTitle)) {
    console.log(`News article "${curiousRefugeNews.title}" already exists in database.`);
    return;
  }
  
  console.log('News article to insert:');
  console.log(JSON.stringify({
    title: curiousRefugeNews.title,
    category: curiousRefugeNews.category,
    summary: curiousRefugeNews.summary,
    source_url: curiousRefugeNews.source_url
  }, null, 2));
  
  if (DRY_RUN) {
    console.log('\n--- DRY RUN - Would insert above news article ---');
    return;
  }
  
  try {
    console.log('\nInserting news article...');
    const result = await supabaseInsert('news', curiousRefugeNews);
    console.log('✅ Successfully inserted news article:', result[0].id);
    console.log('Title:', result[0].title);
    console.log('Category:', result[0].category);
    console.log('Slug:', result[0].slug);
    console.log('Published at:', result[0].published_at);
    
    console.log('\n=== News Article Successfully Added ===');
    console.log(`Title: ${curiousRefugeNews.title}`);
    console.log(`Category: ${curiousRefugeNews.category}`);
    console.log(`Summary: ${curiousRefugeNews.summary.substring(0, 150)}...`);
    console.log(`Source: ${curiousRefugeNews.source_url}`);
    
  } catch (error) {
    console.error('❌ Error inserting news article:', error.message);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}