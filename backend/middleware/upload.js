import multer from 'multer'
import path from 'path'

// Files are kept in memory (never written to local disk) and streamed
// straight to Cloudinary in the controller. This works identically on
// Vercel - whose filesystem is read-only/ephemeral for serverless
// functions - and on a normal local server, so uploaded images now persist
// reliably in both environments instead of disappearing after a redeploy
// or cold start.
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const allowed = /jpeg|jpg|png|webp|gif/
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)
  if (ok) return cb(null, true)
  cb(new Error('Only image files (jpg, png, webp, gif) are allowed.'))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})
