import { useState } from 'react'
import { API_ORIGIN } from '../../../api/client.js'

// A robust avatar: tries to show a real photo if a photoUrl is given, but
// automatically falls back to a clean initials circle if that photo fails
// to load (no internet, blocked domain, broken link, etc.) - so the UI
// never shows a broken-image icon.

const palette = ['avatar-bg-navy', 'avatar-bg-gold', 'avatar-bg-blue', 'avatar-bg-green']

function getInitials(name) {
  if (!name) return '?'
  const cleaned = name.replace(/\([^)]*\)/g, '').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function getColorClass(name) {
  let sum = 0
  const str = name || ''
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i)
  return palette[sum % palette.length]
}

// A saved photo can be either an old-style absolute URL
// ('http://host:port/uploads/xyz.jpg', from before this fix) or the new
// relative path ('/uploads/xyz.jpg'). Only the relative kind needs the
// current API origin prefixed on - absolute URLs are left untouched so
// nothing that was already saved ever breaks.
function resolvePhotoUrl(photoUrl) {
  if (!photoUrl) return photoUrl
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl
  return `${API_ORIGIN}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`
}

function Avatar({ name, photoUrl, className = '' }) {
  const [imgFailed, setImgFailed] = useState(false)

  if (photoUrl && !imgFailed) {
    return (
      <img
        src={resolvePhotoUrl(photoUrl)}
        alt={name}
        className={className}
        onError={() => setImgFailed(true)}
      />
    )
  }

  return (
    <div className={`avatar-initials ${getColorClass(name)} ${className}`}>
      {getInitials(name)}
    </div>
  )
}

export default Avatar
