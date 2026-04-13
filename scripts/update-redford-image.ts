import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from('opportunities')
    .update({
      og_image_url: 'https://www.redfordcenter.org/wp-content/uploads/2023/01/Redford_10_26_18_0287-scaled.jpg',
    })
    .eq('id', 354)
    .select('id, title, og_image_url')
    .single();

  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
  console.log('✓ Updated:', JSON.stringify(data, null, 2));
}

main();
