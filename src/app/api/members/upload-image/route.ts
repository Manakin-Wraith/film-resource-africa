import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSessionUser } from '@/lib/supabase/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.email) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('email', sessionUser.email.toLowerCase())
    .eq('status', 'active')
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (type !== 'avatar' && type !== 'cover') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF images are allowed' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File must be under 8 MB' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${member.id}/${type}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  /* Delete any existing images for this slot to avoid orphaned files */
  const { data: existing } = await supabase.storage
    .from('member-images')
    .list(`${member.id}/${type}`);

  if (existing?.length) {
    const toDelete = existing.map(f => `${member.id}/${type}/${f.name}`);
    await supabase.storage.from('member-images').remove(toDelete);
  }

  const { error: uploadError } = await supabase.storage
    .from('member-images')
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('member-images')
    .getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
