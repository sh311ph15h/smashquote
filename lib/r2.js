// Cloudflare R2 access via the S3-compatible API. Server-only — the R2
// credentials are secret and must never reach the browser. We deliberately use
// the standard AWS S3 SDK: R2 speaks the S3 protocol, so this same code can be
// repointed at AWS S3 or Backblaze B2 by changing env alone (no rewrite).
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET = process.env.R2_BUCKET;

// True once the four R2 env vars are set. Until then the photos UI shows a
// "storage not configured" note instead of crashing — nothing else to do here
// but paste the keys.
export function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    BUCKET,
  );
}

let _client = null;
function client() {
  if (!isR2Configured()) throw new Error('R2 is not configured — set R2_* env vars.');
  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _client;
}

// A short-lived URL the browser can PUT a file straight to (bytes never touch
// our server). The upload must send the same Content-Type it was signed with.
export function presignUpload(key, contentType, expiresIn = 600) {
  return getSignedUrl(
    client(),
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }),
    { expiresIn },
  );
}

// A short-lived URL to display/download a private object. Regenerated on every
// page load, so links in the UI are never stale beyond their window.
export function presignDownload(key, expiresIn = 3600) {
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function deleteObject(key) {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
