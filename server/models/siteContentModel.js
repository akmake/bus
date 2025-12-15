import mongoose from 'mongoose';

const siteContentSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true, // למשל: 'homepage_title'
    trim: true
  },
  value: {
    type: String,
    required: true
  },
  description: String // תיאור קצר למנהל מה זה השדה הזה
});

const SiteContent = mongoose.model('SiteContent', siteContentSchema);
export default SiteContent;