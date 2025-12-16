import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // התיקון: הוספתי את "cityline_db" אחרי ה-.net/ ולפני ה-?
    const uri = process.env.MONGO_URI || 'mongodb+srv://yosefdaean_db_user:lPkTYXPmJ1TBJiyt@cluster0.3o2c7zy.mongodb.net/cityline_db?appName=Cluster0';
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;