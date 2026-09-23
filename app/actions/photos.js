'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { isR2Configured, presignUpload, presignDownload, deleteObject } from '@/lib/r2';
import { isValidCategory } from '@/lib/photos';
import { normaliseMarks } from '@/lib/annotations';
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
      // The stage is chosen at capture time. An unknown one means a stale tab
      // or a hand-built call, and would fail the CHECK constraint anyway.
      category: isValidCategory(meta.category) ? meta.category : 'damage',
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
  revalidatePath('/');
  return { photo: { ...data, url } };
}

// Damage marks drawn over a photo. Stored as vector data beside the image, so
// the original file is never rewritten — the photo stays the evidence it was
// when it was taken, and a mark can be corrected or removed later.
//
// The marks are re-parsed server-side rather than trusted: this lands in a
// jsonb column that the viewer, the print sheet and any future export all read
// back out, so only shapes we know how to draw are allowed in.
export async function saveAnnotations(photoId, marks) {
  const supabase = await createClient();
  const clean = normaliseMarks(marks);

  const { data, error } = await supabase
    .from('quote_photos')
    .update({ annotations: clean.length ? clean : null })
    .eq('id', photoId)
    .select('id, quote_id, annotations')
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: 'Photo not found.' };

  revalidatePath(`/quotes/${data.quote_id}`);
  return { annotations: data.annotations };
}

// Move a photo into a different stage — the wrong segment gets picked in a
// hurry on the floor more often than anyone would like.
export async function updatePhotoCategory(photoId, category) {
  if (!isValidCategory(category)) return { error: 'Unknown photo type.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('quote_photos')
    .update({ category })
    .eq('id', photoId)
    .select('id, quote_id, category')
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: 'Photo not found.' };

  revalidatePath(`/quotes/${data.quote_id}`);
  return { category: data.category };
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
