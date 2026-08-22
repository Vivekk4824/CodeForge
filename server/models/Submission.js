import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  problemText: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  input: {
    type: String,
  },
  output: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Accepted', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded', 'Output Limit Exceeded'],
    required: true,
  },
  executionTime: {
    type: Number,
  }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
