import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  date: {
    type: String, // נשמור בפורמט YYYY-MM-DD
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  }
});

// וודא שהשורה הזו קיימת בדיוק כך:
const Visit = mongoose.model('Visit', visitSchema);
export default Visit;