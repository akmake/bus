import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/userModel.js';
import connectDB from './config/db.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const runTest = async () => {
    console.log('🔄 Connecting to DB...');
    await connectDB();

    const email = 'yosefdaean@gmail.com';
    const passwordToCheck = '0546205955'; // הסיסמה שאתה מנסה להקליד באתר

    console.log(`\n🔍 Testing Database Read for: ${email}`);

    // 1. נסיון שליפה ישיר מהמסד
    // חובה להוסיף +password כי בקוד שלך הוא מוגדר כ-select: false
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        console.log('❌ תוצאה: המשתמש לא נמצא (User Not Found).');
        console.log('   משמעות: השרת מתחבר למסד נתונים שונה מזה שבו אתה רואה את התיקיות, או שהאימייל נשמר עם רווחים/אותיות גדולות.');
    } else {
        console.log('✅ תוצאה: המשתמש נמצא במסד הנתונים!');
        console.log(`   פרטים: Role: ${user.role}, ID: ${user._id}`);
        
        // 2. בדיקת הסיסמה
        console.log('🔄 בודק התאמת סיסמה...');
        if (!user.password) {
            console.log('❌ שגיאה: למשתמש אין שדה סיסמה במסד הנתונים.');
        } else {
            // האם הסיסמה המוצפנת במסד תואמת לסיסמה שכתבנו למעלה?
            const isMatch = await bcrypt.compare(passwordToCheck, user.password);
            
            if (isMatch) {
                console.log('✅✅✅ הצלחה! הסיסמה תקינה והמשתמש קריא.');
                console.log('   מסקנה: הבעיה היא **לא** בשרת ולא בנתונים. הבעיה היא ב-React או ב-Cookies בדפדפן.');
            } else {
                console.log('❌ כישלון: המשתמש קיים, אבל הסיסמה לא תואמת.');
                console.log('   מסקנה: הסיסמה במסד הנתונים אינה מה שאתה חושב שהיא.');
                console.log('   (האם יצרת את המשתמש ידנית ב-Compass? אם כן, הסיסמה לא מוצפנת ולכן השרת לא יכול לקרוא אותה).');
            }
        }
    }
    process.exit();
};

runTest();