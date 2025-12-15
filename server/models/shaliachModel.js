import mongoose from 'mongoose';

const shaliachSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'חובה להזין שם שליח'],
    trim: true
  },
  role: {
    type: String,
    required: [true, 'חובה להזין תפקיד'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'חובה להזין טלפון לוואטסאפ']
  },
  description: {
    type: String,
    default: ''
  },
  imageUrl: {
    type: String,
    default: '' 
  },
  area: {
    type: String,
    default: 'כללי' // למשל: שכונה ירוקה, מרכז, וכו'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Shaliach = mongoose.model('Shaliach', shaliachSchema);
export default Shaliach;