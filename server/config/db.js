import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || '...הכתובת שלך...';
    
    const conn = await mongoose.connect(uri);
    
    // --- הוסף את השורה הזו ---
    console.log(`🚨 SMOKING GUN: Connected to Database name: "${conn.connection.name}"`); 
    // -------------------------
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;