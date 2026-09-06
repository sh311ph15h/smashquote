// Applies the bucket CORS policy that direct browser uploads depend on.
// The browser PUTs to a presigned URL on *.r2.cloudflarestorage.com, which is a
// cross-origin request — without this rule the upload fails in the browser with
// an opaque CORS error while the same presigned URL works fine from curl.
//
// Run once per bucket, and again whenever R2_CORS_ORIGINS changes:
//   node scripts/setup-r2-cors.mjs
import { readFileSync } from 'node:fs';
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';

// Minimal .env.local reader — this runs outside Next, which is what normally
// loads .env files. Real process env wins so CI can override.
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error('Missing R2_* env vars in .env.local — fill them in first.');
  process.exit(1);
}

const origins = (process.env.R2_CORS_ORIGINS || 'http://localhost:3000')
  .split(',').map((o) => o.trim()).filter(Boolean);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

try {
  await client.send(new PutBucketCorsCommand({
    Bucket: R2_BUCKET,
    CORSConfiguration: {
      CORSRules: [{
        AllowedOrigins: origins,
        AllowedMethods: ['PUT', 'GET', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      }],
    },
  }));
} catch (err) {
  // The app itself only needs an "Object Read & Write" token, but CORS is
  // bucket *configuration* — R2 rejects it unless the token is admin-scoped.
  if (err.name === 'AccessDenied') {
    console.error(
      'AccessDenied writing CORS.\n\n' +
      'The R2_* token in .env.local is scoped "Object Read & Write", which is\n' +
      'all the app needs at runtime but cannot change bucket configuration.\n' +
      'Either set the policy by hand (R2 > ' + R2_BUCKET + ' > Settings > CORS policy):\n\n' +
      JSON.stringify([{
        AllowedOrigins: origins,
        AllowedMethods: ['PUT', 'GET', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      }], null, 2) +
      '\n\nor re-run this with an "Admin Read & Write" token:\n' +
      '  R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... node scripts/setup-r2-cors.mjs',
    );
    process.exit(1);
  }
  throw err;
}

const { CORSRules } = await client.send(new GetBucketCorsCommand({ Bucket: R2_BUCKET }));
console.log(`CORS applied to "${R2_BUCKET}":`);
console.log(JSON.stringify(CORSRules, null, 2));
