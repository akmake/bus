import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();

const createAdmin = async () => {
  await connectDB();

  const email = 'yosefdaean@gmail.com'; // תבחר איזה אימייל שבא לך
  const password = '0546205955'; // תבחר סיסמה חזקה

  try {
    // בדיקה אם קיים
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('User already exists');
      process.exit();
    }

    const adminUser = await User.create({
      name: 'מנהל ראשי',
      email: email,
      password: password,
      role: 'admin' // זה מה שנותן את הגישה
    });

    console.log('Admin created successfully:', adminUser.email);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

createAdmin();