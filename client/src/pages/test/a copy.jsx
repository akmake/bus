import { useEffect, useState } from 'react';
import { Bus, Building2, MapPin, Phone, ShieldCheck, Clock, ArrowLeft, ArrowDown, Users } from 'lucide-react';
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
    <div className="font-sans text-slate-900 selection:bg-black selection:text-white">
      
      {/* 1. Hero Section - Bold & Minimal */}
      <section className="relative min-h-[90vh] flex items-center border-b border-gray-100">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          
          <div className="order-2 md:order-1 animate-reveal">
            <span className="text-sm font-bold tracking-widest uppercase text-gray-400 mb-4 block">
              Logistics & Transportation
            </span>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
              {content.hero_title || 'MOVE\nSMARTER.'}
            </h1>
            <div className="w-20 h-1 bg-black mb-8"></div>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-lg font-light leading-relaxed whitespace-pre-line">
              {content.hero_subtitle || 'פתרונות היסעים מתקדמים לארגונים.\nשליטה מלאה. גמישות מקסימלית.'}
            </p>
            
            <button 
               onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
               className="group flex items-center gap-4 text-lg font-bold hover:gap-6 transition-all"
            >
              <span className="border-b-2 border-black pb-1">קבלת הצעה למערך שלך</span>
              <ArrowLeft className="group-hover:-translate-x-2 transition-transform" />
            </button>
          </div>

          <div className="order-1 md:order-2 relative h-[500px] md:h-[700px] w-full bg-gray-100 animate-reveal delay-100">
             <img 
               src="https://images.unsplash.com/photo-1494515855673-b8a209971d55?q=80&w=2070&auto=format&fit=crop" 
               className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out"
               alt="Transport"
             />
             <div className="absolute bottom-0 right-0 bg-white p-8 border-t border-l border-gray-100 hidden md:block">
                <ArrowDown size={32} className="animate-bounce" />
             </div>
          </div>

        </div>
      </section>

      {/* 2. Stats Strip - Architectural Layout */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-gray-200">
           <StatBox number="01" label="פריסה ארצית" />
           <StatBox number="24/7" label="מוקד פעיל" />
           <StatBox number="100%" label="התאמה אישית" />
           <StatBox number="Top" label="רמת בטיחות" />
        </div>
      </div>

      {/* 3. Services - The "Grid" Look */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20">
             <h2 className="text-4xl font-bold tracking-tight">השירותים שלנו</h2>
             <p className="text-gray-500 max-w-md text-left md:text-right mt-4 md:mt-0">
               אנחנו מספקים מעטפת לוגיסטית שלמה, המותאמת במדויק לצרכים המשתנים של הארגון שלכם.
             </p>
          </div>

          <div className="grid md:grid-cols-3 border-t border-gray-200">
            <ServiceItem 
               num="01"
               title="מפעלים וארגונים"
               text="הסעות עובדים קבועות בדייקנות שיא. חיסכון בעלויות תפעול."
            />
            <ServiceItem 
               num="02"
               title="מוסדות ורשויות"
               text="צי רכבים העומד בכל התקנים. נהגים קבועים וליווי צמוד."
            />
            <ServiceItem 
               num="03"
               title="נסיעות מיוחדות"
               text="פתרונות VIP, טיולים ואירועים. רכבי פאר לכל כמות נוסעים."
               last={true}
            />
          </div>
        </div>
      </section>

      {/* 4. Why Us - Typography Focus */}
      <section className="py-32 bg-black text-white">
        <div className="container mx-auto px-6">
           <div className="max-w-4xl">
              <span className="text-gray-500 font-mono mb-4 block">// המודל שלנו</span>
              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-8 whitespace-pre-line">
                 {content.why_us_title || 'אנחנו לא מוכרים אוטובוסים.\nאנחנו מוכרים פתרונות.'}
              </h2>
              <div className="grid md:grid-cols-2 gap-12 text-gray-400 text-lg leading-relaxed">
                 <p>
                    {content.why_us_text || 'בניגוד לחברות מסורתיות, אנחנו לא מוגבלים למלאי הקיים במגרש. הכוח שלנו הוא ביכולת לאתר ולהפעיל את הרכב והנהג המדויקים ביותר למשימה שלכם מתוך מאגר ארצי עצום.'}
                 </p>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 text-white">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                       <span>גמישות תפעולית מקסימלית</span>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                       <span>גיבוי מלא בכל רגע נתון</span>
                    </div>
                    <div className="flex items-center gap-4 text-white">
                       <div className="w-2 h-2 bg-white rounded-full"></div>
                       <span>רכבים חדישים בלבד</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 5. Contact - Minimalist Form */}
      <section id="contact" className="py-32 bg-gray-50 border-t border-gray-200">
        <div className="container mx-auto px-6 max-w-2xl">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{content.contact_title || 'דברו איתנו'}</h2>
              <p className="text-gray-500">{content.contact_text || 'השאירו פרטים ונחזור אליכם עם הצעה מדויקת.'}</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-0">
              <div className="group relative">
                 <input 
                   type="text" 
                   required
                   className="block w-full py-4 bg-transparent border-b border-gray-300 text-lg focus:outline-none focus:border-black transition-colors peer"
                   placeholder=" "
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
                 <label className="absolute right-0 top-4 text-gray-400 text-lg transition-all peer-focus:-top-6 peer-focus:text-xs peer-focus:text-black peer-[:not(:placeholder-shown)]:-top-6 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black pointer-events-none">
                    שם מלא
                 </label>
              </div>

              <div className="group relative pt-8">
                 <input 
                   type="tel" 
                   required
                   className="block w-full py-4 bg-transparent border-b border-gray-300 text-lg focus:outline-none focus:border-black transition-colors peer"
                   placeholder=" "
                   value={formData.phone}
                   onChange={e => setFormData({...formData, phone: e.target.value})}
                 />
                 <label className="absolute right-0 top-12 text-gray-400 text-lg transition-all peer-focus:top-2 peer-focus:text-xs peer-focus:text-black peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-black pointer-events-none">
                    טלפון נייד
                 </label>
              </div>

              <div className="pt-12">
                 <button 
                   disabled={status === 'loading' || status === 'success'}
                   className={`w-full bg-black text-white h-16 text-lg font-bold tracking-wide hover:bg-gray-900 transition flex items-center justify-center gap-3
                     ${status === 'success' ? 'bg-green-600 hover:bg-green-600' : ''}`}
                 >
                    {status === 'loading' ? 'שולח...' : status === 'success' ? 'נשלח בהצלחה' : 'שליחת פרטים'}
                    {status !== 'success' && status !== 'loading' && <ArrowLeft />}
                 </button>
              </div>
           </form>

           <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center text-sm font-medium">
              <div className="flex items-center gap-2">
                 <Phone size={16} /> *2055
              </div>
              <div className="flex items-center gap-2">
                 <Clock size={16} /> מענה 24/7
              </div>
           </div>
        </div>
      </section>

    </div>
  );
}

// Minimalist Stat Box
function StatBox({ number, label }) {
  return (
    <div className="p-8 md:p-12 hover:bg-gray-50 transition-colors">
      <div className="text-3xl font-black mb-2 font-mono">{number}</div>
      <div className="text-sm text-gray-500 font-medium tracking-wide">{label}</div>
    </div>
  );
}

// Minimalist Grid Service Item
function ServiceItem({ num, title, text, last }) {
  return (
    <div className={`p-10 md:p-14 border-b md:border-b-0 border-gray-200 hover:bg-black hover:text-white transition-colors duration-300 group ${!last ? 'md:border-l' : ''}`}>
       <span className="font-mono text-sm text-gray-400 mb-6 block group-hover:text-gray-500">{num}</span>
       <h3 className="text-2xl font-bold mb-4">{title}</h3>
       <p className="text-gray-500 leading-relaxed group-hover:text-gray-400">{text}</p>
       <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
          <ArrowLeft />
       </div>
    </div>
  );
}