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

  // Both directions of the accident. A third party's car points back at the
  // at-fault job it arose from; that job in turn lists the cars it put through
  // the shop, so either quote reaches the other.
  const LINK_SELECT =
    'id, quote_number, liability, vehicle:vehicles(rego, make, model), customer:customers(name)';

  const [{ data: relatedQuote }, { data: causedQuotes }] = await Promise.all([
    quote.related_quote_id
      ? supabase.from('quotes').select(LINK_SELECT).eq('id', quote.related_quote_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('quotes').select(LINK_SELECT).eq('related_quote_id', id),
  ]);

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
      <QuoteBuilder
        shop={shop}
        quote={quote}
        initialLines={lines || []}
        relatedQuote={relatedQuote}
        causedQuotes={causedQuotes || []}
      />
      <QuotePhotos quoteId={id} initialPhotos={photos} configured={r2Ready} />
    </>
  );
}
