// Wraps an async route handler so any thrown error / rejected promise is
// forwarded to Express's error handler instead of crashing the process or
// hanging the request.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// Turns Mongoose validation/cast/duplicate-key errors into clean, readable
// JSON instead of leaking stack traces to the frontend.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err)

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message)
    return res.status(400).json({ message: messages.join(', ') })
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` })
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field'
    return res.status(409).json({ message: `This ${field} is already in use.` })
  }

  if (err.name === 'MulterError') {
    return res.status(400).json({ message: err.message })
  }

  const status = err.statusCode || 500
  res.status(status).json({ message: err.message || 'Something went wrong on the server.' })
}
