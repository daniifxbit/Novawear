import crypto from 'node:crypto'
import path from 'node:path'
import multer from 'multer'
import { PROOF_DIR, PRODUCT_IMG_DIR } from './db.js'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
}

/**
 * Filenames are generated, never taken from the client: the original name is
 * kept in the database for display only, so a crafted name cannot escape the
 * upload directory or be replayed as an extension.
 */
function storage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => cb(null, crypto.randomUUID() + (EXTENSIONS[file.mimetype] ?? '.bin')),
  })
}

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

/** Transfer receipts: screenshot or PDF. */
export const proofUpload = multer({
  storage: storage(PROOF_DIR),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: accept(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
})

/** Product photos added from the back-office. */
export const productImageUpload = multer({
  storage: storage(PRODUCT_IMG_DIR),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: accept(['image/jpeg', 'image/png', 'image/webp']),
})

export const proofPath = (filename: string) => path.join(PROOF_DIR, filename)
export const productImagePath = (filename: string) => path.join(PRODUCT_IMG_DIR, filename)

/** Public URL of an admin-uploaded product photo. */
export const productImageUrl = (filename: string) => `/api/media/products/${filename}`
