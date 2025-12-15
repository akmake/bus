// src/pages/HomePage.jsx
import React, { useEffect, useState, useRef } from 'react';
// *** התיקון לנתיב הייבוא (עם סיומת .jsx) ***
import Navbar from '../components/Navbar.jsx'; 
import { Bus, Car, Accessibility, Phone, MessageCircle, Mail, Truck, Zap, ShieldCheck, Clock, Settings, UserCheck, ArrowRight } from 'lucide-react'; 
import api from '../services/api';

// --- צבעים מוגדרים (לשמירה על אחידות) ---
const COLORS = {
    dark: 'slate-900', // שחור כמעט
    accent: 'amber-500', // צהוב תעשייתי חזק
    light: 'slate-100',
};

// הגדרת האזורים כפי שהוגדרו ב-Navbar
const SECTIONS = [
  { id: 'top', title: 'ראשי' },
  { id: 'fleet', title: 'הצי שלנו' },
  { id: 'management', title: 'ניהול ובטיחות' },
  { id: 'contact', title: 'צור קשר' },
];

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});
  const [activeSection, setActiveSection] = useState('top'); 
  
  // יצירת Refs לכל סקשן
  const sectionRefs = useRef({}); 

  // --- Intersection Observer (ScrollSpy) ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // מזהה את הסקשן הפעיל כאשר הוא חוצה את ה-50% מגובה המסך
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) { 
            setActiveSection(entry.target.id);
          }
        });
      },
      // rootMargin: '0px 0px -50% 0px' אומר שהגבול התחתון של ה-viewport (האזור הנצפה) 
      // יעבור בגובה 50% מהמסך.
      { rootMargin: '0px 0px -50% 0px', threshold: 0.5 } 
    );

    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
        sectionRefs.current[id] = element;
      }
    });

    return () => observer.disconnect();
  }, []);

  // --- שליחת טופס ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      // כאן אמורה להיות קריאת ה-API האמיתית
      // await api.post('/leads', formData);
      setTimeout(() => setStatus('success'), 1000);
      setFormData({ name: '', phone: '', email: '', city: '', message: '' });
    } catch (err) { 
        setStatus('error'); 
    }
  };

  return (
    <div className="font-sans text-slate-800 bg-white" id="top">
      
      {/* --- 1. Navbar המופרד --- */}
      <Navbar activeSection={activeSection} />

      {/* --- 2. HERO SECTION (עשיר יותר ויזואלית) --- */}
      <section className={`relative h-[750px] w-full bg-${COLORS.dark} overflow-hidden`} id="top">
        <div className="absolute inset-0 z-0">
           <img
             src="https://images.unsplash.com/photo-1544620025-a6a969b82f0c?q=80&w=2070&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-20"
             alt="אוטובוסים בכביש מהיר"
           />
           <div className={`absolute inset-0 bg-gradient-to-r from-${COLORS.dark}/90 via-${COLORS.dark}/70 to-transparent`}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl space-y-7">
             <div className={`inline-block border-b-2 border-${COLORS.accent} text-white font-bold tracking-wider uppercase text-sm pb-2 mb-4`}>
                <span className={`text-${COLORS.accent}`}>•</span>   צי אוטובוסים קבלני אמין, זמין ומתקדם
             </div>

             <h1 className="text-6xl md:text-7xl font-black text-white leading-tight tracking-tight">
                הסעות בכמות גדולה.
                <br />
                <span className={`text-${COLORS.accent}`}>בלי דאגות.</span>
             </h1>
             
             <p className="text-xl text-gray-300 max-w-2xl leading-relaxed border-r-4 border-gray-700 pr-4">
               אנו הפתרון הלוגיסטי שלך להסעת עובדים, תלמידים או אורחים. עם צי רכב מקיף (4 עד 60 נוסעים) ונהגים מנוסים, אנו מבטיחים שקט תפעולי מלא, 24 שעות ביממה.
             </p>
             
             <div className="pt-8 flex gap-4">
               <a href="#contact"
                       className={`group bg-${COLORS.accent} text-${COLORS.dark} px-8 py-3 font-black text-lg hover:bg-amber-400 transition-all shadow-xl rounded-sm flex items-center gap-2`}>
                 אני רוצה הצעת מחיר
                 <ArrowRight size={18} className="group-hover:translate-x-[-3px] transition-transform" />
               </a>
             </div>
          </div>
        </div>
      </section>

      {/* --- 3. FLEET (הצי שלנו) --- */}
      <section id="fleet" className="py-24 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-4xl mx-auto mb-16">
              <h2 className={`text-4xl font-black text-${COLORS.dark} mb-4`}>כל כלי רכב, בכל רגע, בכל סדר גודל</h2>
              <div className={`w-20 h-1.5 bg-${COLORS.accent} mx-auto mb-6`}></div>
              <p className="text-xl text-slate-600">
                כחברת קבלן גדולה, המלאי שלנו הוא היתרון שלכם. אנו מחזיקים בהיקף עצום של כלים מוכנים ליציאה, ללא צורך בהתחייבות לרכב ספציפי מראש.
              </p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <FloatingCard icon={<Car size={32} />} title="מיני-ואן יוקרתי" sub="עד 6 מקומות" />
              <FloatingCard icon={<Truck size={32} />} title='טרנזיט VIP' sub="14 מקומות מפואר" />
              <FloatingCard icon={<Accessibility size={32} />} title="רכבים נגישים" sub="מצוידים במעלון" />
              <FloatingCard icon={<Bus size={32} />} title="מיניבוסים" sub="19 / 23 מקומות" />
              <FloatingCard icon={<Bus size={32} />} title="אוטובוס" sub="60 מקומות / קומפקטי" />
           </div>
        </div>
      </section>

      {/* --- 4. MANAGEMENT & SAFETY (סקשן מפורט וייצוגי) --- */}
      <section id="management" className={`py-24 bg-${COLORS.light}`}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className={`text-4xl font-black text-${COLORS.dark} mb-4`}>אבטחת איכות ותפעול 360 מעלות</h2>
            <div className={`w-20 h-1.5 bg-${COLORS.dark} mx-auto mb-6`}></div>
            <p className="text-xl text-slate-600">
              המחויבות שלנו מתחילה בהתחייבות לבטיחות, מסתיימת באפס תקלות. אנו מנהלים את הסיכונים הלוגיסטיים עבורך.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             <SafetyFeature 
                icon={<ShieldCheck size={32} />} 
                title="צי רכב מבוקר"
                description="כל כלי הרכב עומד בבדיקות קפדניות ונושא את כל האישורים הנדרשים ללא יוצא מן הכלל."
             />
             <SafetyFeature 
                icon={<UserCheck size={32} />} 
                title="נהגים בכירים"
                description="צוות נהגים מורשה, ותיק ומנוסה בנהיגה מאתגרת ובשירות אישי ואדיב."
             />
             <SafetyFeature 
                icon={<Clock size={32} />} 
                title="מוקד 24/7"
                description="זמינות מלאה של המוקד התפעולי לשינויים, בקשות וטיפול מיידי באירועים דחופים."
             />
             <SafetyFeature 
                icon={<Settings size={32} />} 
                title="בקרת איכות"
                description="מערכת מעקב מתקדמת להבטחת עמידה ב-SLA ובדיוק מוחלט בזמני ההגעה והאיסוף."
             />
          </div>
        </div>
      </section>

      {/* --- 5. CONTACT SECTION (בולט וברור) --- */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className={`flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto shadow-2xl overflow-hidden border-t-8 border-${COLORS.accent}`}>
             
             {/* טופס */}
             <div className="lg:w-2/3 p-8 md:p-12 bg-white">
                <h3 className={`text-3xl font-black text-${COLORS.dark} mb-6`}>הסעה זה לא כאב ראש. זה אנחנו.</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="שם מלא / חברה" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <Input placeholder="טלפון (חובה)" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder='דוא"ל' type="email" value={formData.email} onChange={e => setFormData({...formData.email, email: e.target.value})} />
                      <Input placeholder="יעד / אזור פעילות" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                   </div>
                   <textarea
                     rows="3"
                     placeholder="כמה נוסעים? לאן ומתי? (ככל שתפרט יותר, כך ההצעה תהיה מדויקת יותר)"
                     className={`w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-${COLORS.accent} focus:bg-white outline-none transition-colors resize-none`}
                     value={formData.message}
                     onChange={e => setFormData({...formData, message: e.target.value})}
                   ></textarea>

                   <button disabled={status === 'loading' || status === 'success'}
                     className={`w-full py-4 font-black text-lg rounded-sm transition-all shadow-md 
                       ${status === 'success' ? 'bg-green-600 text-white' : `bg-${COLORS.dark} text-white hover:bg-slate-800`}`}>
                      {status === 'loading' ? 'שולח...' : status === 'success' ? 'הבקשה נשלחה בהצלחה!' : 'שליחת בקשה להצעת מחיר'}
                   </button>
                </form>
             </div>

             {/* פרטים - צד ימין בצבע ה-Call to Action */}
             <div className={`lg:w-1/3 bg-${COLORS.accent} p-8 md:p-12 text-${COLORS.dark} flex flex-col justify-between`}>
                <div>
                  <h3 className={`text-2xl font-black mb-6 border-b-2 border-${COLORS.dark} pb-4 inline-block`}>יצירת קשר מיידית</h3>
                  <div className="space-y-6 font-bold text-lg text-slate-800">
                     <ContactItem icon={<Phone className={`text-${COLORS.dark}`} />} text="08-8587626" />
                     <ContactItem icon={<MessageCircle className={`text-${COLORS.dark}`} />} text="וואטסאפ (מענה מהיר)" />
                     <ContactItem icon={<Mail className={`text-${COLORS.dark}`} />} text="yosefdaean@gmail.com" />
                  </div>
                </div>
                <div className="mt-12 text-sm font-bold pt-4 border-t border-slate-700/20">
                  <p>שירותי הסעה 24/7 לכל יעד בישראל.</p>
                </div>
             </div>

           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`bg-${COLORS.dark} text-slate-500 py-8 text-center text-sm border-t border-gray-700`}>
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} LineLogic Transport. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS (לשמירה על קוד נקי) ---
// (הקומפוננטות הנוספות נשארות זהות)
function FloatingCard({ icon, title, sub }) { /* ... */ }
function SafetyFeature({ icon, title, description }) { /* ... */ }
function ContactItem({ icon, text }) { /* ... */ }
function Input(props) { /* ... */ }
