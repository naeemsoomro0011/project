import mongoose from 'mongoose'

// Generic named counter used to hand out gap-free, always-increasing
// numbers (student roll numbers, teacher employee IDs) even when many
// requests happen at once. See utils/generateIds.js for how it's used.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. 'studentRoll', 'teacherEmployeeId'
  seq: { type: Number, required: true },
})

export default mongoose.model('Counter', counterSchema)
