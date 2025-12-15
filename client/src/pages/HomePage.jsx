import { useEffect, useState } from 'react';
import { Bus, Car, Accessibility, Phone, MessageCircle, MapPin, Mail, Truck, Zap, ShieldCheck, Route, ArrowRight, Clock, Settings, TrendingUp, Star, UserCheck } from 'lucide-react'; 
import api from '../services/api';

// --- צבעים מוגדרים (כחול-שחור + צהוב תעשייתי) ---
const COLORS = {
    dark: 'slate-900', // שחור כמעט
    accent: 'amber-500', // צהוב תעשייתי חזק
    light: 'slate-100',
};

// הגדרת אזורי הדף לניווט ה-ScrollSpy
const SECTIONS = [
  { id: 'top', title: 'ראשי' },
  { id: 'fleet', title: 'הצי שלנו' },
  { id: 'safety', title: 'בטיחות' },
  { id: 'contact', title: 'צור קשר' },
];

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});
  const [activeSection, setActiveSection] = useState('top'); // State לניווט אקטיבי

  // --- ScrollSpy Effect ---
  useEffect(() => {
    const handleScroll = () => {
      let currentSection = 'top';
      const scrollPosition = window.scrollY + 100; // 100px Offset

      SECTIONS.slice(1).forEach((section) => {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= scrollPosition) {
          currentSection = section.id;
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- API Init (שמירה על מבנה) ---
  useEffect(() => {
    const init = async () => {
       try {
         api.post('/track').catch(() => {});
         const [contentRes] = await Promise.all([
            api.get('/content').catch(() => ({ data: {} })),
         ]);
         setContent(contentRes.data.data || {});
       } catch (err) {
         console.error(err);
       }
    };
    init();
  }, []);

  // --- שליחת טופס ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/leads', formData);
      setStatus('success');
      setFormData({ name: '', phone: '', email: '', city: '', message: '' });
    } catch (err) { setStatus('error'); }
  };

  // --- קומפוננטת הניווט הפנימית (Navbar המותאמת ל-ScrollSpy) ---
  const InternalNavbar = () => (
     <nav className={`bg-${COLORS.dark} text-white shadow-lg sticky top-0 z-50 border-b-4 border-${COLORS.accent}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            
            {/* לוגו: חזק ותעשייתי */}
            <a href="#top" className="text-2xl font-black flex items-center gap-3 hover:opacity-90 transition">
              <div className={`text-${COLORS.accent} bg-white/5 p-2 rounded-sm border border-${COLORS.accent}`}>
                <Bus size={24} />
              </div>
              <span className="tracking-widest">Y<span className={`text-${COLORS.accent}`}>H</span>S</span>
            </a>

            {/* ניווט ScrollSpy - קישורים עם סימון אקטיבי */}
            <div className="hidden md:flex items-center gap-8">
              {SECTIONS.map((section) => (
                <a 
                  key={section.id} 
                  href={`#${section.id}`} 
                  onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(section.id).scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-sm font-bold transition-colors border-b-4 py-1 
                    ${activeSection === section.id 
                       ? `text-${COLORS.accent} border-${COLORS.accent}` 
                       : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
                >
                  {section.title}
                </a>
              ))}
            </div>

            {/* כפתור יצירת קשר מהיר (Call to Action) */}
            <button 
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              className={`bg-${COLORS.accent} text-${COLORS.dark} px-4 py-2 rounded-sm font-black text-sm hover:opacity-90 transition shadow-xl`}>
              <span className="hidden sm:inline">יצירת קשר מהירה</span>
              <Phone size={16} className="sm:hidden" />
            </button>
          </div>
        </div>
      </nav>
  );

  return (
    <div className="font-sans text-slate-800 bg-white" id="top">
      
      {/* --- Internal Navbar --- */}
      <InternalNavbar />

      {/* --- 1. HERO SECTION (Fleet Management & Reliability) --- */}
      <section className={`relative h-[750px] w-full bg-${COLORS.dark} overflow-hidden`}>
        <div className="absolute inset-0 z-0">
           {/* תמונה שמדברת אוטובוסים יוקרתיים וניהול */}
           <img
             src="https://images.unsplash.com/photo-1544620025-a6a969b82f0c?q=80&w=2070&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-30"
             alt="אוטובוסים בכביש"
           />
           {/* Overlay חזק ליצירת ניגודיות */}
           <div className={`absolute inset-0 bg-gradient-to-r from-${COLORS.dark}/90 via-${COLORS.dark}/60 to-transparent`}></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-4xl space-y-6">
             <div className={`inline-block border-b-2 border-${COLORS.accent} text-white font-bold tracking-wider uppercase text-sm pb-2 mb-4`}>
                <span className={`text-${COLORS.accent}`}>|</span>   צי האוטובוסים הגדול בישראל
             </div>

             <h1 className="text-6xl md:text-7xl font-black text-white leading-tight tracking-tight">
                פתרונות הסעה. 
                <br />
                <span className={`text-${COLORS.accent}`}>בלי פשרות על איכות.</span>
             </h1>
             
             <p className="text-xl text-gray-300 max-w-xl leading-relaxed border-r-4 border-gray-700 pr-4">
               כחברת קבלן מובילה, אנו מתחייבים לספק לך כל כלי רכב (4 עד 60 מקומות) עם הנהגים הטובים ביותר, בזמן.
             </p>
             
             <div className="pt-8 flex gap-4">
               <button onClick={() => document.getElementById('fleet').scrollIntoView({ behavior: 'smooth' })} 
                       className={`group bg-${COLORS.accent} text-${COLORS.dark} px-8 py-3 font-bold text-lg hover:bg-amber-400 transition-all shadow-lg rounded-sm flex items-center gap-2`}>
                 לצי הרכבים המלא
                 <Bus size={18} className="group-hover:scale-110 transition-transform" />
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* --- 2. FLEET (הצי שלנו - הכרטיסיות המקוריות, אבל משופרות) --- */}
      <section id="fleet" className="py-24 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-4xl mx-auto mb-16">
              <h2 className={`text-4xl font-black text-${COLORS.dark} mb-4`}>כל סוג רכב, תמיד זמין.</h2>
              <div className={`w-20 h-1.5 bg-${COLORS.accent} mx-auto mb-6`}></div>
              <p className="text-xl text-slate-600">
                הגישה שלנו לצי רכבים מגוון מאפשרת לנו להתאים לכם פתרון הסעה מיידי לכל כמות נוסעים ולכל מטרה.
              </p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
              <FloatingCard icon={<Car size={32} />} title="מוניות" sub="4 מקומות" />
              <FloatingCard icon={<Truck size={32} />} title='טרנזיטים' sub="14 מקומות" />
              <FloatingCard icon={<Accessibility size={32} />} title="מעלון" sub="לבעלי מוגבלויות" />
              <FloatingCard icon={<Bus size={32} />} title="מיניבוס" sub="19-23 מקומות" />
              <FloatingCard icon={<Bus size={32} />} title="אוטובוס" sub="60 מקומות" />
           </div>
        </div>
      </section>

      {/* --- 3. SAFETY (בטיחות וניהול - במקום ביקורות) --- */}
      <section id="safety" className={`py-24 bg-${COLORS.light}`}>
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h2 className={`text-4xl font-black text-${COLORS.dark} mb-4`}>בטיחות, ניהול ותפעול ברמה תאגידית</h2>
            <div className={`w-20 h-1.5 bg-${COLORS.dark} mx-auto mb-6`}></div>
            <p className="text-xl text-slate-600">
              השקט הנפשי שלך מתחיל בשיטה. אנו מנהלים את התהליך הלוגיסטי מאפס עד 100 בצורה מקצועית ויסודית.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             <SafetyFeature 
                icon={<ShieldCheck size={32} />} 
                title="קצין בטיחות מלווה"
                description="עמידה בתקני משרד התחבורה וליווי צמוד של קצין בטיחות לכל נסיעה."
             />
             <SafetyFeature 
                icon={<UserCheck size={32} />} 
                title="נהגים בפיקוח"
                description="כל הנהגים נבחרים בקפידה, עוברים הכשרות תקופתיות ומנוסים בהסעות מורכבות."
             />
             <SafetyFeature 
                icon={<Clock size={32} />} 
                title="עמידה ב-SLA"
                description="התחייבות לעמידה מדויקת בלוחות זמנים, כולל ניהול סיכונים וגיבוי מיידי."
             />
             <SafetyFeature 
                icon={<Settings size={32} />} 
                title="ניהול צי דינמי"
                description="יכולת שינוי מסלולים ורכבים מהרגע להרגע, עם זמינות 24/7."
             />
          </div>
        </div>
      </section>

      {/* --- 4. CONTACT SECTION (Modern & Clean) --- */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className={`flex flex-col lg:flex-row gap-0 max-w-6xl mx-auto shadow-2xl overflow-hidden border-t-8 border-${COLORS.accent}`}>
             
             {/* טופס */}
             <div className="lg:w-2/3 p-8 md:p-12 bg-white">
                <h3 className={`text-3xl font-black text-${COLORS.dark} mb-6`}>קבלו הצעת מחיר בהתאמה אישית</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="שם מלא / חברה" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <Input placeholder="טלפון (חובה)" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder='דוא"ל' type="email" value={formData.email} onChange={e => setFormData({...formData.email, email: e.target.value})} />
                      <Input placeholder="עיר/אזור פעילות" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                   </div>
                   <textarea
                     rows="3"
                     placeholder="ספרו לנו על הצרכים הלוגיסטיים שלכם (כמות נוסעים, דחיפות...)"
                     className={`w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-${COLORS.accent} focus:bg-white outline-none transition-colors resize-none`}
                     value={formData.message}
                     onChange={e => setFormData({...formData, message: e.target.value})}
                   ></textarea>

                   <button disabled={status === 'loading' || status === 'success'}
                     className={`w-full py-4 font-black text-lg rounded-sm transition-all shadow-md 
                       ${status === 'success' ? 'bg-green-600 text-white' : `bg-${COLORS.dark} text-white hover:bg-slate-800`}`}>
                      {status === 'loading' ? 'שולח...' : status === 'success' ? 'הבקשה נשלחה!' : 'שליחת בקשה להתאמה'}
                   </button>
                </form>
             </div>

             {/* פרטים - צד ימין בצבע הצהוב הבולט */}
             <div className={`lg:w-1/3 bg-${COLORS.accent} p-8 md:p-12 text-${COLORS.dark} flex flex-col justify-between`}>
                <div>
                  <h3 className={`text-2xl font-black mb-6 border-b-2 border-${COLORS.dark} pb-4 inline-block`}>צרו קשר ישיר</h3>
                  <div className="space-y-6 font-bold text-lg text-slate-800">
                     <ContactItem icon={<Phone className={`text-${COLORS.dark}`} />} text="08-8587626" />
                     <ContactItem icon={<MessageCircle className={`text-${COLORS.dark}`} />} text="וואטסאפ (מענה מהיר)" />
                     <ContactItem icon={<Mail className={`text-${COLORS.dark}`} />} text="yosefdaean@gmail.com" />
                     <ContactItem icon={<MapPin className={`text-${COLORS.dark}`} />} text="קרית מלאכי, מרכז תפעול" />
                  </div>
                </div>
                <div className="mt-12 text-sm font-bold pt-4 border-t border-slate-700/20">
                  <p>שירותי הסעה לכל מטרה. עובדים 24/7.</p>
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

// --- COMPONENTS ---

// FloatingCard - כרטיס נקי ויציב לצי רכב
function FloatingCard({ icon, title, sub }) {
  return (
    <div className={`bg-white h-32 flex flex-col items-center justify-center p-4 shadow-lg border-b-4 border-transparent hover:border-${COLORS.accent} transition-all duration-300 group cursor-default`}>
       <div className={`text-${COLORS.accent} mb-2 group-hover:scale-110 transition-transform`}>
         {icon}
       </div>
       <h3 className={`font-black text-${COLORS.dark} text-xl leading-none mb-1`}>{title}</h3>
       <p className="text-gray-500 text-xs font-medium">{sub}</p>
    </div>
  );
}

// SafetyFeature - תיבה תעשייתית לבטיחות/ניהול
function SafetyFeature({ icon, title, description }) {
    return (
        <div className={`group p-6 bg-white border-l-4 border-transparent hover:border-${COLORS.accent} transition-all duration-300 shadow-md`}>
            <div className={`w-14 h-14 bg-${COLORS.accent}/10 rounded-sm flex items-center justify-center mb-4 text-${COLORS.dark}`}>
                {icon}
            </div>
            <h3 className={`font-bold text-lg mb-2 text-${COLORS.dark}`}>{title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function ContactItem({ icon, text }) {
  return (
    <div className="flex items-center gap-4">
      {icon} <span>{text}</span>
    </div>
  )
}

function Input(props) {
    return (
        <input 
          {...props} 
          className={`w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-${COLORS.accent} focus:bg-white outline-none transition-colors rounded-t-sm text-slate-800 placeholder-gray-400`} 
        />
    )
}
