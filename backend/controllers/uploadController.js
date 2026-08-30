import { asyncHandler } from '../middleware/errorHandler.js'
import cloudinary from '../config/cloudinary.js'

function uploadBufferToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'titan-portal', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    )
    stream.end(buffer)
  })
}

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' })

  // Uploaded straight to Cloudinary instead of local disk: Vercel's
  // filesystem is read-only/ephemeral for serverless functions, so a file
  // saved locally would not reliably survive between requests or
  // redeploys. Cloudinary gives back a permanent https:// URL, which the
  // frontend's resolvePhotoUrl() (Avatar.jsx) already passes through
  // untouched since it recognizes absolute URLs - no other change needed.
  const result = await uploadBufferToCloudinary(req.file.buffer)
  res.status(201).json({ url: result.secure_url })
})
