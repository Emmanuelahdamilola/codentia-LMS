// PATH: src/lib/storage.ts
//
// Cloudflare R2 file storage using the S3-compatible API.
// R2 uses the same @aws-sdk/client-s3 package as AWS S3.
//
// Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
//
// Required env vars:
//   STORAGE_ENDPOINT          = https://<account-id>.r2.cloudflarestorage.com
//   STORAGE_ACCESS_KEY_ID     = R2 Access Key ID
//   STORAGE_SECRET_ACCESS_KEY = R2 Secret Access Key
//   STORAGE_BUCKET_NAME       = your bucket name
//   STORAGE_PUBLIC_URL        = https://pub-<hash>.r2.dev  (or custom domain)

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

// ─── Client ──────────────────────────────────────────────────

function getClient() {
  const endpoint  = process.env.STORAGE_ENDPOINT
  const accessKey = process.env.STORAGE_ACCESS_KEY_ID
  const secretKey = process.env.STORAGE_SECRET_ACCESS_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error('Missing storage environment variables. Check STORAGE_ENDPOINT, STORAGE_ACCESS_KEY_ID, STORAGE_SECRET_ACCESS_KEY.')
  }

  return new S3Client({
    region:      'auto',
    endpoint,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })
}

const BUCKET = process.env.STORAGE_BUCKET_NAME ?? 'codentia-uploads'
const PUBLIC_URL = process.env.STORAGE_PUBLIC_URL ?? ''

// ─── Upload types ─────────────────────────────────────────────

type UploadFolder = 'videos' | 'thumbnails' | 'assignments' | 'resources'

const ALLOWED_TYPES: Record<UploadFolder, string[]> = {
  videos:      ['video/mp4', 'video/webm', 'video/mov', 'video/quicktime'],
  thumbnails:  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  assignments: ['application/zip', 'application/pdf', 'text/plain', 'application/octet-stream'],
  resources:   ['application/pdf', 'application/zip', 'application/vnd.ms-powerpoint',
                 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
}

const MAX_SIZE_MB: Record<UploadFolder, number> = {
  videos:      500,
  thumbnails:  5,
  assignments: 50,
  resources:   25,
}

// ─── Upload a file (server-side) ─────────────────────────────

export async function uploadFile(
  file:     Buffer | Uint8Array,
  filename: string,
  mimeType: string,
  folder:   UploadFolder
): Promise<string> {
  // Validate mime type
  if (!ALLOWED_TYPES[folder].includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed in ${folder}`)
  }

  const ext    = filename.split('.').pop() ?? 'bin'
  const key    = `${folder}/${randomUUID()}.${ext}`
  const client = getClient()

  await client.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        file,
    ContentType: mimeType,
  }))

  return `${PUBLIC_URL}/${key}`
}

// ─── Generate presigned upload URL (client-side direct upload) ─

export async function getPresignedUploadUrl(
  filename: string,
  mimeType: string,
  folder:   UploadFolder,
  expiresIn = 300 // 5 minutes
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  if (!ALLOWED_TYPES[folder].includes(mimeType)) {
    throw new Error(`File type ${mimeType} not allowed in ${folder}`)
  }

  const ext    = filename.split('.').pop() ?? 'bin'
  const key    = `${folder}/${randomUUID()}.${ext}`
  const client = getClient()

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: mimeType,
  })

  const uploadUrl = await getSignedUrl(client, command, { expiresIn })
  const publicUrl = `${PUBLIC_URL}/${key}`

  return { uploadUrl, publicUrl, key }
}

// ─── Delete a file ────────────────────────────────────────────

export async function deleteFile(publicUrlOrKey: string): Promise<void> {
  // Extract key from full URL if needed
  const key = publicUrlOrKey.startsWith('http')
    ? publicUrlOrKey.replace(`${PUBLIC_URL}/`, '')
    : publicUrlOrKey

  const client = getClient()
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}

// ─── Get public URL from key ──────────────────────────────────

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${key}`
}

// ─── Validate file size (use before calling upload) ──────────

export function validateFileSize(sizeBytes: number, folder: UploadFolder): void {
  const maxBytes = MAX_SIZE_MB[folder] * 1024 * 1024
  if (sizeBytes > maxBytes) {
    throw new Error(`File too large. Maximum size for ${folder} is ${MAX_SIZE_MB[folder]}MB.`)
  }
}