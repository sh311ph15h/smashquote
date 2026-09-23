'use client';

import { useRef, useState } from 'react';
import { createUploadUrl, confirmPhoto } from '@/app/actions/photos';

// ---------------------------------------------------------------------------
// The upload path, shared by the quote page and the shop-floor capture flow.
//
// Bytes go straight from the browser to R2 through a presigned PUT — they never
// pass through our server. Two steps: ask for a URL (which also authorises the
// caller and picks the object key), PUT the file, then record the row.
// ---------------------------------------------------------------------------
export function useUpload(quoteId) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');

  // Returns the rows that landed, so the caller can show them immediately
  // rather than waiting for a round trip to the database.
  async function upload(fileList, category) {
    setError('');
    const files = Array.from(fileList || []);
    if (!files.length) return [];

    const done = [];
    for (const file of files) {
      setUploading(u => u + 1);
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
        done.push(conf.photo);
      } catch {
        setError(`Couldn't upload ${file.name}. Check the connection and try again.`);
      } finally {
        setUploading(u => u - 1);
      }
    }
    return done;
  }

  return { upload, uploading, error, setError };
}

// ---------------------------------------------------------------------------
// The two ways a photo gets in. Separate inputs on purpose:
//
//   capture="environment" makes a phone open the rear camera straight away,
//   which is the whole point on the floor — one tap from button to viewfinder.
//   The gallery input leaves it off so the same button offers the camera roll,
//   and takes several files at once for a batch shot earlier in the day.
//
// The inputs are reset after every pick so choosing the same file twice in a
// row still fires a change event.
// ---------------------------------------------------------------------------
export function CaptureButtons({ onFiles, disabled, size = 'normal' }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  // Reset the input after every pick, otherwise choosing the same file twice
  // in a row fires no change event and the second shot silently goes nowhere.
  const take = (e) => {
    const input = e.target;
    const files = input.files;
    if (files?.length) onFiles(files);
    input.value = '';
  };

  const cls = size === 'big' ? 'capture-btn' : 'btn secondary';

  return (
    <>
      <button className={cls} disabled={disabled} onClick={() => cameraRef.current?.click()}>
        <span aria-hidden="true">📷</span> Take photo
      </button>
      <button className={cls} disabled={disabled} onClick={() => galleryRef.current?.click()}>
        <span aria-hidden="true">🖼️</span> Choose from gallery
      </button>

      <input
        ref={cameraRef} type="file" hidden
        accept="image/*" capture="environment"
        onChange={take}
      />
      <input
        ref={galleryRef} type="file" hidden multiple
        accept="image/*,application/pdf"
        onChange={take}
      />
    </>
  );
}
