import { useEffect, useState } from 'react';
import { Bus, Building2, MapPin, Phone, ShieldCheck, Clock, CheckCircle2, ArrowLeft, Star, Users, Briefcase, ChevronDown } from 'lucide-react';
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
    <div className="font-sans text-slate-800 overflow-x-hidden">
      
      {/* 1. Hero Section - Centered & Clean */}
      <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-48 bg-white overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
           <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
           <div className="absolute bottom-[10%] left-[-10%] w-[400px] h-[400px] bg-orange-50 rounded-full blur-3xl opacity-60"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 animate-fade-in">
             <Star size={14} className="fill-indigo-700" />
             הסטנדרט החדש בהסעות
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 mb-8 tracking-tight leading-tight animate-fade-in">
            {content.hero_title || 'אנחנו מזיזים את הארגון שלך.'}
          </h1>
          
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-75 whitespace-pre-line">
            {content.hero_subtitle || 'פתרונות תחבורה חכמים למפעלים ומוסדות.\nבלי פשרות על איכות, בלי דאגות לוגיסטיות.'}
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-in delay-100">
            <button 
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              קבלת הצעת מחיר
            </button>
            <button className="bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2">
              <Phone size={20} /> שיחה עם מומחה
            </button>
          </div>

          {/* Floating Image/Card Effect */}
          <div className="mt-16 relative mx-auto max-w-4xl animate-float hidden md:block">
             <img 
               src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop" 
               className="rounded-2xl shadow-2xl border-4 border-white w-full h-[400px] object-cover"
               alt="Hero"
             />
             {/* Stats Card Overlay */}
             <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border border-gray-100 text-right">
                <div className="text-3xl font-bold text-indigo-600">98%</div>
                <div className="text-sm text-gray-500 font-medium">דיוק בזמני הגעה</div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. Services - Cards with Icons */}
      <section className="py-24 bg-gray-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-slate-900 mb-4">לכל צורך יש לנו רכב</h2>
             <p className="text-gray-500 max-w-2xl mx-auto">אנחנו לא רק מספקים הסעה, אנחנו מספקים שקט נפשי.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard 
               icon={<Building2 />} 
               title="מפעלים וארגונים" 
               desc="הסעות עובדים במשמרות קבועות. אופטימיזציה של מסלולים לחיסכון בעלויות."
               color="indigo"
            />
            <ServiceCard 
               icon={<ShieldCheck />} 
               title="מוסדות ורשויות" 
               desc="עמידה בסטנדרטים המחמירים ביותר. נהגים קבועים, רכבים חדישים ומונגשים."
               color="orange"
            />
            <ServiceCard 
               icon={<Bus />} 
               title="תיירות ואירועים" 
               desc="צי רכבי פאר לאירועים, כנסים ומשלחות VIP. חווית נסיעה ברמה אחרת."
               color="indigo"
            />
          </div>
        </div>
      </section>

      {/* 3. Why Us - "The Matchmaker" Concept */}
      <section className="py-24 bg-white overflow-hidden relative">
         <div className="container mx-auto px-4 max-w-6xl">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-16 text-white relative overflow-hidden">
               
               {/* Background Pattern */}
               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px]"></div>
                  <div className="absolute left-0 bottom-0 w-64 h-64 bg-orange-500 rounded-full blur-[100px]"></div>
               </div>

               <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                  <div className="md:w-1/2 space-y-6">
                     <div className="inline-block bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-sm font-bold border border-indigo-500/30">
                        השיטה שלנו
                     </div>
                     <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                        {content.why_us_title || 'ההתאמה המושלמת,\nבכל נסיעה.'}
                     </h2>
                     <p className="text-lg text-gray-400 leading-relaxed whitespace-pre-line">
                        {content.why_us_text || 'אנחנו לא מוגבלים לצי רכב ספציפי. המודל שלנו מאפשר לנו לבחור עבורכם את הרכב המדויק ואת הנהג המתאים ביותר מתוך מאגר עצום.\n\nצריכים נהג שמדבר אנגלית לאורחים מחו"ל? אוטובוס עם WIFI? קיבלתם.'}
                     </p>
                     
                     <div className="grid grid-cols-2 gap-6 pt-4">
                        <div>
                           <div className="text-3xl font-bold text-indigo-400 mb-1">∞</div>
                           <div className="text-sm text-gray-400">אפשרויות בחירה</div>
                        </div>
                        <div>
                           <div className="text-3xl font-bold text-orange-400 mb-1">100%</div>
                           <div className="text-sm text-gray-400">התאמה אישית</div>
                        </div>
                     </div>
                  </div>
                  
                  <div className="md:w-1/2 flex justify-center">
                     <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 max-w-sm w-full">
                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center">
                              <Briefcase size={24} />
                           </div>
                           <div className="h-1 flex-1 bg-white/20 rounded-full relative">
                              <div className="absolute right-0 top-0 h-full w-1/2 bg-green-400 rounded-full"></div>
                           </div>
                           <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                              <Bus size={24} />
                           </div>
                        </div>
                        <div className="space-y-3">
                           <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-green-400" />
                              <span className="text-sm">נהג: אדיב, ייצוגי</span>
                           </div>
                           <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-green-400" />
                              <span className="text-sm">רכב: שנתון 2024</span>
                           </div>
                           <div className="bg-white/5 p-3 rounded-lg flex items-center gap-3">
                              <CheckCircle2 size={16} className="text-green-400" />
                              <span className="text-sm">מחיר: תחרותי והוגן</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* 4. Stats / Trust Strip */}
      <section className="py-16 bg-white border-b border-gray-100">
         <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="24/7" label="זמינות במוקד" />
            <StatItem number="50+" label="ערים בפריסה" />
            <StatItem number="0" label="תקלות בחודש האחרון" />
            <StatItem number="Top" label="דירוג שירות" />
         </div>
      </section>

      {/* 5. Contact Section - Clean White */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10">
             <h2 className="text-3xl font-bold text-slate-900 mb-2">{content.contact_title || 'בואו נתחיל לעבוד'}</h2>
             <p className="text-gray-500 whitespace-pre-line">{content.contact_text || 'מלאו את הפרטים וקבלו הצעה מסודרת תוך דקות.'}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 md:p-12">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">שם מלא</label>
                    <input 
                      type="text" 
                      required
                      placeholder="ישראל ישראלי"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">טלפון נייד</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="050-0000000"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                 </div>
              </div>

              <button 
                disabled={status === 'loading' || status === 'success'}
                className={`w-full py-4 rounded-xl font-bold text-lg text-white transition shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  ${status === 'success' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                 {status === 'loading' ? 'שולח...' : status === 'success' ? 'הפרטים נשלחו בהצלחה!' : 'שליחת פרטים'}
              </button>

              <p className="text-center text-xs text-gray-400 mt-4">
                 בלחיצה על שליחה אני מאשר את <a href="/terms" className="underline hover:text-indigo-600">תנאי השימוש</a>.
              </p>
            </form>
          </div>

          <div className="mt-12 flex justify-center gap-8 text-gray-500">
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2"><Phone size={20} /></div>
                <span className="font-bold text-slate-900">*2055</span>
             </div>
             <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-2"><Clock size={20} /></div>
                <span className="font-bold text-slate-900">24/7</span>
             </div>
          </div>

        </div>
      </section>

    </div>
  );
}

function ServiceCard({ icon, title, desc, color }) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    orange: "bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${colorClasses[color]}`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function StatItem({ number, label }) {
  return (
     <div>
        <div className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-1">{number}</div>
        <div className="text-sm text-gray-500 font-medium">{label}</div>
     </div>
  );
}