import { v2 as cloudinary } from 'cloudinary'

// Credentials come from your Cloudinary dashboard (free tier is enough for
// this project): https://cloudinary.com/console -> Account Details.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary
