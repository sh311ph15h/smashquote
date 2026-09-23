'use client';

import { useState } from 'react';
import { deletePhoto, saveAnnotations, updatePhotoCategory } from '@/app/actions/photos';
import { PHOTO_SEGMENTS, groupBySegment, segmentLabel } from '@/lib/photos';
import { markCount } from '@/lib/annotations';
import { useUpload, CaptureButtons } from '@/components/PhotoUpload';
import { AnnotationLayer } from '@/components/Annotations';
import PhotoAnnotator from '@/components/PhotoAnnotator';

// ---------------------------------------------------------------------------
// The photo record for a job, split by repair stage.
//
// One flat gallery stops being readable the moment a job runs past a week — a
// damage shot and a finished shot of the same panel look alike in a grid. Each
// stage gets its own segment so the set reads as a sequence, and a stage that
// was never photographed is visibly empty rather than just absent.
// ---------------------------------------------------------------------------
export default function QuotePhotos({ quoteId, initialPhotos, configured }) {
  const [photos, setPhotos] = useState(initialPhotos || []);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const { upload, uploading, error, setError } = useUpload(quoteId);

  const segments = groupBySegment(photos);
  const total = photos.length;

  // The stage is decided by *which* segment you added from, so nobody has to
  // remember to change a dropdown before shooting.
  async function addTo(segment, files) {
    const added = await upload(files, segment);
    if (added.length) setPhotos(p => [...p, ...added]);
  }

  async function handleDelete(id) {
    if (!confirm('Delete this photo? This removes the file and any damage marks on it.')) return;
    const res = await deletePhoto(id);
    if (res.error) setError(res.error);
    else setPhotos(p => p.filter(x => x.id !== id));
  }

  async function moveTo(id, category) {
    const res = await updatePhotoCategory(id, category);
    if (res.error) { setError(res.error); return; }
    setPhotos(p => p.map(x => (x.id === id ? { ...x, category: res.category } : x)));
  }

  if (!configured) {
    return (
      <div className="card photos-card">
        <h3 className="photos-title">Photos</h3>
        <p className="capture-note">
          Photo storage isn&apos;t connected yet. Add your Cloudflare R2 keys to{' '}
          <code>.env.local</code> and this turns on automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="card photos-card">
      <div className="photos-head">
        <h3 className="photos-title">Photos {total ? `(${total})` : ''}</h3>
        {uploading > 0 && <span className="capture-note">Uploading {uploading}…</span>}
      </div>

      {error && <p className="capture-error">{error}</p>}

      {segments.map(seg => (
        <section key={seg.key} className="photo-seg">
          <div className="photo-seg-head">
            <div>
              <h4 className="photo-seg-name">
                {seg.label}
                {seg.photos.length > 0 && <span className="photo-seg-n">{seg.photos.length}</span>}
              </h4>
              <p className="photo-seg-hint">{seg.hint}</p>
            </div>
            <div className="photo-seg-actions">
              <CaptureButtons
                onFiles={files => addTo(seg.key, files)}
                disabled={uploading > 0}
              />
            </div>
          </div>

          {seg.photos.length === 0 ? (
            <p className="photo-seg-empty">Nothing here yet.</p>
          ) : (
            <div className="photo-grid">
              {seg.photos.map(p => (
                <Tile
                  key={p.id}
                  photo={p}
                  onView={() => setViewing(p)}
                  onMark={() => setEditing(p)}
                  onDelete={() => handleDelete(p.id)}
                  onMove={cat => moveTo(p.id, cat)}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {viewing && (
        <Lightbox photo={viewing} onClose={() => setViewing(null)} onMark={() => { setEditing(viewing); setViewing(null); }} />
      )}

      {editing && (
        <PhotoAnnotator
          photo={editing}
          onClose={() => setEditing(null)}
          onSave={async (marks) => {
            const res = await saveAnnotations(editing.id, marks);
            if (res.error) return res;
            setPhotos(ps => ps.map(p => (p.id === editing.id ? { ...p, annotations: res.annotations } : p)));
            return res;
          }}
        />
      )}
    </div>
  );
}

function Tile({ photo, onView, onMark, onDelete, onMove }) {
  const isPdf = photo.content_type === 'application/pdf';
  const marks = markCount(photo.annotations);

  return (
    <figure className="photo-tile">
      {isPdf ? (
        <a className="photo-thumb photo-pdf" href={photo.url} target="_blank" rel="noreferrer">📄 PDF</a>
      ) : (
        <button className="photo-thumb" onClick={onView} aria-label="View photo">
          {/* object-fit: contain, not cover — a cropped thumbnail would put the
              damage marks somewhere other than the damage. */}
          <img src={photo.url} alt={photo.caption || segmentLabel(photo.category)} />
          <AnnotationLayer marks={photo.annotations} minimal />
          {marks > 0 && <span className="photo-marks" title={`${marks} damage marks`}>✎ {marks}</span>}
        </button>
      )}

      <figcaption className="photo-cap">
        {!isPdf && (
          <button className="btn ghost photo-act" onClick={onMark}>
            {marks ? 'Edit marks' : 'Mark damage'}
          </button>
        )}
        <select
          className="select photo-move"
          value={photo.category}
          onChange={e => onMove(e.target.value)}
          aria-label="Change photo type"
        >
          {PHOTO_SEGMENTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button className="btn ghost photo-del" onClick={onDelete} aria-label="Delete photo">✕</button>
      </figcaption>
    </figure>
  );
}

function Lightbox({ photo, onClose, onMark }) {
  return (
    <div className="anno-backdrop" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lightbox">
        <header className="anno-head">
          <strong>{segmentLabel(photo.category)}</strong>
          <div style={{ display: 'flex', gap: '.5rem' }}>
            <button className="btn secondary" onClick={onMark}>Mark damage</button>
            <a className="btn ghost" href={photo.url} target="_blank" rel="noreferrer">Open original</a>
            <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </header>
        <div className="lightbox-frame">
          <img src={photo.url} alt={photo.caption || segmentLabel(photo.category)} />
          <AnnotationLayer marks={photo.annotations} />
        </div>
      </div>
    </div>
  );
}
