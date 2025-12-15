import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'חובה להזין שם מלא'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'חובה להזין מספר טלפון']
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  city: { // <--- שדה חדש
    type: String,
    trim: true
  },
  message: { // <--- שדה חדש
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'done', 'irrelevant'],
    default: 'new'
  },
  note: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;