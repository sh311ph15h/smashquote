'use client';

import { useState, useRef } from 'react';
import { createUploadUrl, confirmPhoto, deletePhoto } from '@/app/actions/photos';

const CATEGORIES = ['damage', 'before', 'after', 'invoice', 'other'];

export default function QuotePhotos({ quoteId, initialPhotos, configured }) {
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [category, setCategory] = useState('damage');
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function handleFiles(fileList) {
    setError('');
    for (const file of Array.from(fileList)) {
      setUploading((u) => u + 1);
      try {
        const res = await createUploadUrl(quoteId, file.name, file.type, file.size);
        if (res.error) { setError(res.error); continue; }
        const put = await fetch(res.url, {
          method: 'PUT', body: file, headers: { 'Content-Type': file.type },
        });
        if (!put.ok) { setError(`Upload failed for ${file.name}.`); continue; }
        const conf = await confirmPhoto(quoteId, {
          key: res.key, contentType: file.type, sizeBytes: file.size, category,
        });
        if (conf.error) { setError(conf.error); continue; }
        setPhotos((p) => [...p, conf.photo]);
      } finally {
        setUploading((u) => u - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(id) {
    if (!confirm('Delete this photo?')) return;
    const res = await deletePhoto(id);
    if (res.error) setError(res.error);
    else setPhotos((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="card" style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.6rem' }}>
        <h3 style={{ fontWeight: 700 }}>Photos {photos.length ? `(${photos.length})` : ''}</h3>
        {configured && (
          <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <select className="select" style={{ width: 'auto' }} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
            </select>
            <button className="btn" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
              {uploading > 0 ? `Uploading… (${uploading})` : '+ Add photos'}
            </button>
            <input ref={fileRef} type="file" hidden multiple accept="image/*,application/pdf"
              onChange={(e) => handleFiles(e.target.files)} />
          </div>
        )}
      </div>

      {!configured && (
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
          Photo storage isn&apos;t connected yet. Add your Cloudflare R2 keys to <code>.env.local</code> and this turns on automatically.
        </p>
      )}

      {error && <p style={{ color: 'var(--bad)', fontSize: '.85rem', marginBottom: '.8rem' }}>{error}</p>}

      {configured && photos.length === 0 && uploading === 0 && (
        <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>No photos yet — add damage shots, before/after, or invoice scans.</p>
      )}

      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '.8rem' }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: 'relative', border: '1px solid var(--border)', borderRadius: '.6rem', overflow: 'hidden', background: 'var(--panel-2)' }}>
              <a href={p.url} target="_blank" rel="noreferrer">
                {p.content_type === 'application/pdf'
                  ? <div style={{ height: 120, display: 'grid', placeItems: 'center', color: 'var(--muted)', fontSize: '.8rem' }}>📄 PDF</div>
                  : <img src={p.url} alt={p.caption || p.category} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />}
              </a>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.35rem .5rem' }}>
                <span className="pill">{p.category}</span>
                <button className="btn ghost" style={{ padding: '.15rem .3rem', color: 'var(--bad)' }} onClick={() => handleDelete(p.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
