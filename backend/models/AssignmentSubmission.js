import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    link: { type: String, default: '' },
    notes: { type: String, default: '' },
    image: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
    isLate: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['Not Submitted', 'Pending', 'Approved', 'Not Approved'],
      default: 'Not Submitted',
    },
  },
  { timestamps: true }
)

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true })

export default mongoose.model('AssignmentSubmission', submissionSchema)
