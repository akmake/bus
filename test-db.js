// קובץ בדיקה לחיבור MongoDB.
// שימוש: node test-db.js
//
// ⚠️ אבטחה חשובה ⚠️
// הקובץ הזה השתמש בעבר במחרוזת חיבור עם סיסמה GLOBALLY EXPOSED.
// אם הקובץ הקודם נדחף ל-Git - הסיסמה הזו דלפה ויש לסובב אותה ב-MongoDB Atlas.
// (Project -> Database Access -> Edit user -> Edit Password)
//
// עכשיו אנחנו קוראים את ה-URI מקובץ ה-.env (ש-.gitignore מתעלם ממנו - מאובטח).

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// טוען את ה-.env מהשרת (או משורש הפרויקט - מה שיש)
dotenv.config({ path: path.join(__dirname, 'server', '.env') });
dotenv.config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error('❌ לא נמצאה MONGO_URI בסביבה.');
  console.error('   ודא שיש קובץ server/.env עם השורה:');
  console.error('   MONGO_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/DBNAME');
  process.exit(1);
}

console.log('...מנסה להתחבר למונגו');

mongoose
  .connect(uri)
  .then(() => {
    console.log('✅ יש חיבור!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ החיבור נכשל. הנה השגיאה:');
    console.error('---------------------------------------------------');
    console.error(err.message);
    console.error('---------------------------------------------------');
    console.error('קוד שגיאה:', err.codeName || err.code);
    process.exit(1);
  });
