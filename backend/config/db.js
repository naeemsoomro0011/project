import mongoose from 'mongoose'
import dns from 'dns'

// Some ISPs / home routers / networks don't reliably resolve DNS "SRV"
// records, which is what `mongodb+srv://` connection strings need to look
// up your cluster's real servers. That failure shows up as:
//   querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
// This is NOT an Atlas/IP-whitelist problem - it's your computer's DNS
// resolver refusing that specific lookup. Pointing Node at Google's and
// Cloudflare's public DNS resolvers (instead of your ISP's default one)
// fixes it in the vast majority of cases, so we set that here before any
// connection is attempted.
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4'])

// The original static frontend data used a plain string `id` field on every
// record. Mongoose's real ids live in `_id` (an ObjectId) - but Mongoose
// also ships a built-in `id` virtual (a string version of `_id`) that's
// only included in JSON output when this is turned on. Enabling it globally
// means every API response includes both `_id` and `id`, so the dozens of
// existing components that read `.id` keep working untouched instead of
// needing to be tracked down one by one.
mongoose.set('toJSON', { virtuals: true })
mongoose.set('toObject', { virtuals: true })

// Connects to MongoDB Atlas using the URI in .env (MONGO_URI).
// Exits the process on failure so a broken DB connection never gets
// mistaken for a running server that's silently not saving anything.
async function connectDB() {
  try {
    const uri = process.env.MONGO_URI
    if (!uri) {
      throw new Error('MONGO_URI is not set in backend/.env')
    }

    mongoose.connection.on('connected', () => {
      console.log(`[MongoDB] connected -> ${mongoose.connection.name}`)
    })
    mongoose.connection.on('error', (err) => {
      console.error('[MongoDB] connection error:', err.message)
    })
    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] disconnected')
    })

    await mongoose.connect(uri)
    await dropObsoleteTeacherPhoneIndex()
    await dropObsoleteTeacherEmailIndex()
    await dropObsoleteUniqueIndex('subadmins', 'email')
    await dropObsoleteUniqueIndex('subadmins', 'phone')
  } catch (err) {
    console.error('[MongoDB] Failed to connect:', err.message)

    if (err.message.includes('querySrv') || err.message.includes('ECONNREFUSED')) {
      console.error(
        '\nThis looks like a DNS problem, not an Atlas problem: your network could ' +
        'not resolve the SRV record for your cluster (common on some ISPs/routers/VPNs).\n' +
        'We already try Google/Cloudflare DNS automatically - if it still fails:\n' +
        '  1. Try a different network (mobile hotspot) to confirm it is DNS-related.\n' +
        '  2. On Windows: Settings -> Network & Internet -> change adapter options -> ' +
        'right-click your connection -> Properties -> IPv4 -> set DNS to 8.8.8.8 / 1.1.1.1, then restart.\n' +
        '  3. Or in MongoDB Atlas -> Connect -> "Drivers", copy the standard (non-+srv) ' +
        'connection string and use that as MONGO_URI in backend/.env instead.\n'
      )
    } else {
      console.error(
        '\nCheck backend/.env MONGO_URI, your internet connection, and that your ' +
        'current IP is allow-listed in MongoDB Atlas (Network Access tab).\n'
      )
    }
    // Was `process.exit(1)` here before. That's fine for a normal always-on
    // server (server.js below still gets the same "hard stop" behavior via
    // its own .catch), but calling process.exit() inside a Vercel
    // serverless function kills the function invocation outright instead
    // of letting Express send back a normal error response. Throwing lets
    // each entry point (server.js locally, api/index.js on Vercel) decide
    // what "failure" should look like.
    throw err
  }
}

// Trainer uniqueness moved from phone number to Trainer ID - but a unique
// index that was already created in MongoDB from before that change doesn't
// go away just because `unique: true` was removed from the schema (Mongoose
// only ever adds missing indexes automatically, it never drops old ones).
// Without this, "This phone is already in use" would keep happening at the
// database level even though the application code no longer checks it.
// Safe to run every time the server starts - it's a no-op once the index is
// already gone.
async function dropObsoleteTeacherPhoneIndex() {
  try {
    const teachersCollection = mongoose.connection.collection('teachers')
    const indexes = await teachersCollection.indexes()
    const staleIndex = indexes.find((idx) => idx.key && idx.key.phone === 1 && idx.unique)
    if (staleIndex) {
      await teachersCollection.dropIndex(staleIndex.name)
      console.log(`[MongoDB] Dropped obsolete unique index "${staleIndex.name}" on teachers.phone`)
    }
  } catch (err) {
    // Not fatal - if this fails for any reason, the app still works; it
    // just means the very rare case of two trainers sharing a phone number
    // would fail until this is cleaned up manually.
    console.warn('[MongoDB] Could not check/drop obsolete teachers.phone index:', err.message)
  }
}

// Trainer uniqueness is now anchored on Trainer ID alone - email was also
// made non-unique (two trainers can now share an email/phone, e.g. one
// added before they had a personal email; login still resolves correctly
// via email+password together). Same story as the phone index above: a
// unique index already created in MongoDB from before doesn't disappear
// just because `unique: true` was removed from the schema, so drop it here.
async function dropObsoleteTeacherEmailIndex() {
  try {
    const teachersCollection = mongoose.connection.collection('teachers')
    const indexes = await teachersCollection.indexes()
    const staleIndex = indexes.find((idx) => idx.key && idx.key.email === 1 && idx.unique)
    if (staleIndex) {
      await teachersCollection.dropIndex(staleIndex.name)
      console.log(`[MongoDB] Dropped obsolete unique index "${staleIndex.name}" on teachers.email`)
    }
  } catch (err) {
    console.warn('[MongoDB] Could not check/drop obsolete teachers.email index:', err.message)
  }
}

// Generic version of the two droppers above, used for Sub Admin: both
// email and phone used to be unique on that collection too, before
// Sub Admin ID (employeeId) became the sole unique identifier (mirrors the
// Teacher setup). Safe to run every time the server starts.
async function dropObsoleteUniqueIndex(collectionName, field) {
  try {
    const collection = mongoose.connection.collection(collectionName)
    const indexes = await collection.indexes()
    const staleIndex = indexes.find((idx) => idx.key && idx.key[field] === 1 && idx.unique)
    if (staleIndex) {
      await collection.dropIndex(staleIndex.name)
      console.log(`[MongoDB] Dropped obsolete unique index "${staleIndex.name}" on ${collectionName}.${field}`)
    }
  } catch (err) {
    console.warn(`[MongoDB] Could not check/drop obsolete ${collectionName}.${field} index:`, err.message)
  }
}

export default connectDB
