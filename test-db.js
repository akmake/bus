// קובץ: buss/test-db.js
import mongoose from 'mongoose';

// שים כאן את הכתובת המלאה שלך (כולל הסיסמה האמיתית!) במקום הטקסט הזה
const uri = "mongodb+srv://yosefdahan_db_user:P0BDSvS7UVtWMTdv@zipori.yvwfaxu.mongodb.net/?retryWrites=true&w=majority&appName=zipori";

console.log("...מנסה להתחבר למונגו");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ יש חיבור! הבעיה הייתה בקובץ .env או במיקום שלו");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ החיבור נכשל. הנה השגיאה:");
    console.error("---------------------------------------------------");
    console.error(err.message); // זה מה שאנחנו מחפשים!
    console.error("---------------------------------------------------");
    console.error("קוד שגיאה:", err.codeName || err.code);
    process.exit(1);
  });