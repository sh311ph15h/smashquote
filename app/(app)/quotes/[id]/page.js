import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentShop } from '@/lib/shop';
import { isR2Configured, presignDownload } from '@/lib/r2';
import QuoteBuilder from './QuoteBuilder';
import QuotePhotos from './QuotePhotos';

export default async function QuotePage({ params }) {
  const { id } = await params;
  const { shop } = await getCurrentShop();
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .eq('id', id)
    .maybeSingle();
  if (!quote) notFound();

  const { data: lines } = await supabase
    .from('quote_lines').select('*').eq('quote_id', id)
    .order('sort_order', { ascending: true });

  // Photos live in R2; presign a short-lived view URL for each on load.
  const r2Ready = isR2Configured();
  let photos = [];
  if (r2Ready) {
    const { data: rows } = await supabase
      .from('quote_photos').select('*').eq('quote_id', id)
      .order('created_at', { ascending: true });
    photos = await Promise.all(
      (rows || []).map(async (p) => ({ ...p, url: await presignDownload(p.r2_key) })),
    );
  }

  return (
    <>
      <QuoteBuilder shop={shop} quote={quote} initialLines={lines || []} />
      <QuotePhotos quoteId={id} initialPhotos={photos} configured={r2Ready} />
    </>
  );
}
