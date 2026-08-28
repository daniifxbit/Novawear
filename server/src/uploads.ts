import crypto from 'node:crypto'
import multer from 'multer'
import { exec, queryOne } from './db.js'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const accept = (allowed: string[]) => (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (!allowed.includes(file.mimetype)) {
    cb(new Error('Format de fichier non accepté'))
    return
  }
  cb(null, true)
}

/**
 * Everything is uploaded into memory and then written to Postgres: serverless
 * instances get no writable, persistent disk.
 */
export const proofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: accept(PROOF_TYPES),
})

export const productImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: accept(PHOTO_TYPES),
})

/** Catalogue import: parsed and discarded, never stored. */
export const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const looksLikeCsv =
      file.originalname.toLowerCase().endsWith('.csv') ||
      ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'].includes(file.mimetype)
    if (!looksLikeCsv) {
      cb(new Error('Format de fichier non accepté'))
      return
    }
    cb(null, true)
  },
})

export type FileKind = 'proof' | 'product'

export interface StoredFile {
  id: string
  mime: string
  filename: string
  bytes: Buffer
}

/**
 * Stores an upload and returns its id. The client's filename is kept for
 * display only — it never becomes a path or an identifier.
 */
export async function storeFile(kind: FileKind, file: Express.Multer.File): Promise<string> {
  const id = crypto.randomUUID()
  await exec(
    'INSERT INTO files (id, kind, mime, filename, bytes, size_bytes) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, kind, file.mimetype, file.originalname, file.buffer, file.size],
  )
  return id
}

export async function readFile(id: string): Promise<StoredFile | undefined> {
  return queryOne<StoredFile>('SELECT id, mime, filename, bytes FROM files WHERE id = $1', [id])
}

export async function deleteFile(id: string): Promise<void> {
  await exec('DELETE FROM files WHERE id = $1', [id])
}

/** Public URL of an admin-uploaded product photo. */
export const productImageUrl = (id: string) => `/api/media/products/${id}`

/** Extracts the file id back out of a stored product image URL. */
export const productImageId = (image: string) =>
  image.startsWith('/api/media/products/') ? image.slice('/api/media/products/'.length) : null
