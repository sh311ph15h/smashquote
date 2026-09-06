'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { isR2Configured, presignUpload, presignDownload, deleteObject } from '@/lib/r2';
import { revalidatePath } from 'next/cache';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf',
]);

const safeName = (name) =>
  String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);

// Step 1 of an upload: validate, then hand the browser a presigned PUT URL so
// the file goes straight to R2. We confirm the quote is visible under RLS first
// (that both authorises the caller and gives us the shop_id for the key).
export async function createUploadUrl(quoteId, filename, contentType, sizeBytes) {
  if (!isR2Configured()) return { error: 'Photo storage isn\'t configured yet.' };
  if (!ALLOWED.has(contentType)) return { error: 'Only images or PDFs are allowed.' };
  if (Number(sizeBytes) > MAX_BYTES) return { error: 'File is larger than 25 MB.' };

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from('quotes').select('id, shop_id').eq('id', quoteId).maybeSingle();
  if (!quote) return { error: 'Quote not found.' };

  const key = `shops/${quote.shop_id}/quotes/${quoteId}/${crypto.randomUUID()}-${safeName(filename)}`;
  const url = await presignUpload(key, contentType);
  return { url, key };
}

// Step 2: the file is in R2 — record it. RLS on quote_photos enforces that the
// caller belongs to the shop; we also stamp uploaded_by for the audit trail.
export async function confirmPhoto(quoteId, meta) {
  const supabase = await createClient();
  const { user, shop } = await getCurrentShop();
  if (!user || !shop) return { error: 'Not signed in.' };

  const { data, error } = await supabase
    .from('quote_photos')
    .insert({
      shop_id: shop.id,
      quote_id: quoteId,
      r2_key: meta.key,
      category: meta.category || 'damage',
      caption: meta.caption || null,
      content_type: meta.contentType || null,
      size_bytes: meta.sizeBytes || null,
      uploaded_by: user.id,
    })
    .select('*')
    .single();
  if (error) return { error: error.message };

  const url = await presignDownload(data.r2_key);
  revalidatePath(`/quotes/${quoteId}`);
  return { photo: { ...data, url } };
}

export async function deletePhoto(photoId) {
  const supabase = await createClient();
  const { data: photo } = await supabase
    .from('quote_photos').select('id, r2_key, quote_id').eq('id', photoId).maybeSingle();
  if (!photo) return { error: 'Photo not found.' };

  try {
    await deleteObject(photo.r2_key);
  } catch {
    // If the object is already gone from R2, still drop the row.
  }
  const { error } = await supabase.from('quote_photos').delete().eq('id', photoId);
  if (error) return { error: error.message };

  revalidatePath(`/quotes/${photo.quote_id}`);
  return { ok: true };
}
