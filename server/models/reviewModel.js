import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'שם הממליץ הוא חובה'],
    trim: true
  },
  role: {
    type: String, // לדוגמה: "מנהלת משאבי אנוש"
    default: ''
  },
  company: {
    type: String, // לדוגמה: "חברת הארגז"
    default: ''
  },
  text: {
    type: String,
    required: [true, 'תוכן ההמלצה הוא חובה']
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;