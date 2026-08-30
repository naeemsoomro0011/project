import mongoose from 'mongoose'

// A single topic inside a module. Teachers tick `completed` per-slot (see
// Slot.progress), the topic list itself (title/order) is owned by the course
// so Super Admin defines it once and every batch/teacher of that course
// shares the same syllabus shape.
const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
  },
  { _id: true }
)

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    topics: { type: [topicSchema], default: [] },
  },
  { _id: true }
)

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    syllabus: { type: [moduleSchema], default: [] },
  },
  { timestamps: true }
)

export default mongoose.model('Course', courseSchema)
