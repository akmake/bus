import { useEffect, useState } from 'react';
import { Bus, Building2, MapPin, Phone, ShieldCheck, Clock, CheckCircle2, ArrowLeft, Star, Users, Zap } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});

  useEffect(() => {
    const init = async () => {
       try {
         api.post('/track').catch(() => {});
         const res = await api.get('/content');
         setContent(res.data.data || {});
       } catch (err) {}
    };
    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/leads', formData);
      setStatus('success');
      setFormData({ name: '', phone: '', email: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="font-sans text-gray-900 bg-white selection:bg-yellow-200">
      
      {/* 1. Hero Section - Split Screen Modern */}
      <section className="relative pt-8 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* הטקסט */}
            <div className="lg:w-1/2 z-10 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 px-4 py-2 rounded-full font-bold text-sm mb-6 border border-green-100">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                זמינות מיידית בפריסה ארצית
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 tracking-tight text-slate-900">
                {content.hero_title || 'הסעות חכמות לארגונים.'}
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-lg whitespace-pre-line">
                {content.hero_subtitle || 'אנחנו דואגים ללוגיסטיקה, אתם דואגים לעסק.\nפתרונות תחבורה גמישים למוסדות, מפעלים ואירועים.'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                  className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                >
                  קבלת הצעה <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-4 px-6 py-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex -space-x-3 space-x-reverse">
                     {[1,2,3].map(i => (
                       <div key={i} className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                     ))}
                  </div>
                  <div className="text-sm font-medium">
                    <span className="font-bold block text-slate-900">500+ לקוחות</span>
                    <span className="text-gray-500">מרוצים השנה</span>
                  </div>
                </div>
              </div>
            </div>

            {/* התמונה - גדולה ומרשימה */}
            <div className="lg:w-1/2 relative animate-fade-in delay-100">
              <div className="absolute inset-0 bg-gradient-to-tr from-green-500/20 to-yellow-400/20 rounded-[2.5rem] blur-3xl transform rotate-3"></div>
              <img 
                src="https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=2070&auto=format&fit=crop" 
                alt="Transportation" 
                className="relative rounded-[2rem] shadow-2xl object-cover w-full h-[500px] lg:h-[600px] z-10"
              />
              
              {/* כרטיס צף לקישוט */}
              <div className="absolute bottom-10 -left-6 z-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg text-green-700"><CheckCircle2 size={24} /></div>
                  <div>
                    <p className="font-bold text-slate-900">100% עמידה בזמנים</p>
                    <p className="text-xs text-gray-500">דירוג שירות חודשי</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Services - Bento Grid Layout (קוביות) */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-16">
            <h2 className="text-4xl font-bold mb-4 text-slate-900">פתרון אחד. אינסוף אפשרויות.</h2>
            <p className="text-xl text-gray-500">התאמה מלאה של סוג הרכב והנהג לאופי המשימה שלכם.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            
            {/* כרטיס גדול 1 */}
            <div className="md:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-green-100 transition"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-6">
                  <Building2 />
                </div>
                <h3 className="text-2xl font-bold mb-2">הסעות מפעלים ועובדים</h3>
                <p className="text-gray-500 max-w-md">מערך הסעות קבוע, מדויק ואמין. אנחנו דואגים שהעובדים יגיעו רעננים למשמרת ובזמן.</p>
              </div>
              <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop" className="absolute bottom-0 left-0 w-1/2 h-full object-cover opacity-10 group-hover:opacity-20 transition" />
            </div>

            {/* כרטיס רגיל 2 */}
            <div className="bg-slate-900 p-8 rounded-3xl shadow-sm flex flex-col justify-between text-white group">
              <div>
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400 mb-6">
                  <ShieldCheck />
                </div>
                <h3 className="text-2xl font-bold mb-2">מוסדות חינוך</h3>
                <p className="text-gray-400">עמידה מחמירה בתקני בטיחות, נהגים קבועים ויחס אישי לתלמידים.</p>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-4">
                 <div className="w-0 h-full bg-yellow-400 group-hover:w-full transition-all duration-700"></div>
              </div>
            </div>

            {/* כרטיס רגיל 3 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-700 mb-6">
                  <Bus />
                </div>
                <h3 className="text-2xl font-bold mb-2">טיולים ואירועים</h3>
                <p className="text-gray-500">אוטובוסים מפוארים ורכבי VIP לכל מטרה ולכל כמות נוסעים.</p>
              </div>
            </div>

            {/* כרטיס רגיל 4 */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-6">
                  <Zap />
                </div>
                <h3 className="text-2xl font-bold mb-2">זמינות מיידית</h3>
                <p className="text-gray-500">בזכות רשת קבלנים ארצית, אנחנו זמינים גם להתראות קצרות.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Why Us - Clean & Minimal */}
      <section className="py-24 bg-white">
         <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="md:w-1/2">
                 <img 
                   src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2070&auto=format&fit=crop" 
                   className="rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition duration-500"
                   alt="Driver"
                 />
              </div>
              <div className="md:w-1/2 space-y-8">
                 <h2 className="text-4xl font-bold text-slate-900 leading-tight">
                    {content.why_us_title || 'לא מתפשרים על הנהג.\nלא מתפשרים על הרכב.'}
                 </h2>
                 <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
                    {content.why_us_text || 'הכוח שלנו הוא בגמישות. אנחנו לא מוגבלים לצי רכב ספציפי, מה שמאפשר לנו להתאים לכם את הפתרון המדויק ביותר.\n\nבין אם אתם צריכים נהג ייצוגי לסיור משקיעים, או אוטובוס ענק לטיול שנתי - אנחנו נדאג לשידוך המושלם.'}
                 </p>
                 
                 <div className="space-y-4">
                    <FeatureRow icon={<Users />} title="התאמה אנושית" text="נהגים שנבחרו בקפידה לפי אופי המשימה." />
                    <FeatureRow icon={<Star />} title="רכבים חדישים" text="צי רכבים מגוון משנתונים מתקדמים בלבד." />
                 </div>
              </div>
            </div>
         </div>
      </section>

      {/* 4. Contact - Bold & Clear */}
      <section id="contact" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        {/* אלמנטים גרפיים ברקע */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-600 rounded-full blur-[100px] opacity-20 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500 rounded-full blur-[100px] opacity-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {content.contact_title || 'בואו נתקדם.'}
            </h2>
            <p className="text-xl text-gray-400 max-w-xl mx-auto whitespace-pre-line">
              {content.contact_text || 'השאירו פרטים ונציג בכיר יחזור אליכם עם הצעה מותאמת אישית.'}
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 md:p-12 rounded-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">שם מלא</label>
                   <input 
                     type="text" 
                     required
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-400 mb-2">טלפון</label>
                   <input 
                     type="tel" 
                     required
                     className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition"
                     value={formData.phone}
                     onChange={e => setFormData({...formData, phone: e.target.value})}
                   />
                </div>
              </div>
              
              <button 
                disabled={status === 'loading' || status === 'success'}
                className={`w-full py-5 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2
                  ${status === 'success' ? 'bg-green-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20'}`}
              >
                 {status === 'loading' ? 'שולח...' : status === 'success' ? 'הפרטים התקבלו!' : 'שליחת פרטים'}
              </button>
            </form>

            <div className="mt-8 flex justify-center gap-8 text-sm text-gray-400 font-medium">
               <div className="flex items-center gap-2"><Phone size={16} /> מוקד: *2055</div>
               <div className="flex items-center gap-2"><Clock size={16} /> מענה מהיר</div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureRow({ icon, title, text }) {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-green-50 p-3 rounded-xl text-green-700 shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
        <p className="text-gray-500">{text}</p>
      </div>
    </div>
  );
}