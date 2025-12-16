import { useEffect, useState, useRef } from 'react';
import { 
  Bus, MapPin, Phone, ShieldCheck, Clock, 
  CheckCircle2, ArrowLeft, Star, Quote, MessageCircle, Mail 
} from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [formData, setFormData] = useState({ 
    name: '', phone: '', email: '', city: '', message: '' 
  });
  const [status, setStatus] = useState('idle');
  
  // State לביקורות דינמיות
  const [reviews, setReviews] = useState([]); 
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // טעינה ראשונית: מעקב כניסות + משיכת ביקורות
  useEffect(() => {
    const initData = async () => {
      try {
        // ניסיון לשלוח מעקב
        api.post('/track').catch(() => {}); 
        
        // משיכת הביקורות
        const res = await api.get('/reviews');
        
        // בדיקת בטיחות: האם התשובה היא באמת מידע ולא HTML?
        const isHtml = typeof res.data === 'string' && res.data.startsWith('<!doctype html>');
        
        if (!isHtml && res.data?.data?.reviews) {
          // רק אם זה מידע תקין - נעדכן את הסטייט
          setReviews(res.data.data.reviews);
        } else {
          console.warn("השרת החזיר HTML במקום נתונים - וודא שה-Backend דלוק בפורט 5000");
        }

      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };
    initData();
  }, []);

  // רוטציה של הביקורות
  useEffect(() => {
    if (reviews.length === 0) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [reviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/leads', formData);
      setStatus('success');
      setFormData({ name: '', phone: '', email: '', city: '', message: '' });
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="font-sans text-slate-800">
      
      {/* --- HERO SECTION: אפקט Ken Burns ואלמנטים צפים --- */}
      <section id="hero" className="relative h-[700px] flex items-center justify-center text-white overflow-hidden">
        
        {/* שכבת רקע נעה */}
        <div className="absolute inset-0 overflow-hidden">
           <img 
             src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop" 
             alt="Luxury Bus" 
             className="w-full h-full object-cover animate-ken-burns"
           />
           {/* שכבת כהות לקריאות טקסט */}
           <div className="absolute inset-0 bg-slate-900/60"></div>
        </div>
        
        {/* תוכן מרכזי */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-400/30 backdrop-blur-sm px-4 py-1.5 rounded-full mb-8 animate-float-slow">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-blue-100">זמינות מיידית בפריסה ארצית</span>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h1 className="text-5xl md:text-8xl font-bold mb-6 tracking-tight drop-shadow-2xl">
              תחבורה <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">בסטנדרט אחר</span>
            </h1>
          </Reveal>
          
          <Reveal delay={200}>
            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md">
              פתרונות היסעים מתקדמים לארגונים, מפעלים ורשויות.
              <br className="hidden md:block" />
              אנחנו דואגים לדרך, אתם דואגים למטרה.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
                className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-[0_10px_40px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.7)] hover:-translate-y-1 flex items-center gap-2"
              >
                קבלת הצעה למערך שלך <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              </button>
              
              <button 
                className="px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/20 hover:bg-white/10 transition backdrop-blur-sm flex items-center gap-2"
                onClick={() => document.getElementById('services').scrollIntoView({ behavior: 'smooth' })}
              >
                 השירותים שלנו
              </button>
            </div>
          </Reveal>
        </div>

        {/* כרטיס צף למטה - Parallax Effect */}
        <div className="absolute bottom-10 left-10 hidden lg:block animate-float-slow" style={{ animationDelay: '1s' }}>
           <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                 <ShieldCheck size={24} />
              </div>
              <div className="text-left">
                 <div className="text-sm text-gray-300">בטיחות מעל הכל</div>
                 <div className="text-lg font-bold text-white">קצין בטיחות מוסמך</div>
              </div>
           </div>
        </div>
      </section>

      {/* --- STATS STRIP: מספרים רצים --- */}
      <section className="bg-white border-b border-gray-100 relative z-20 -mt-8 mx-4 md:mx-auto max-w-5xl rounded-2xl shadow-xl p-8 flex flex-wrap justify-around gap-8 text-center animate-fade-in-up">
          <StatCounter end={500} suffix="+" label="לקוחות מרוצים" />
          <StatCounter end={120} label="רכבים בצי" />
          <StatCounter end={24} suffix="/7" label="זמינות במוקד" />
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-24 bg-white overflow-hidden">
         <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-16 mb-12">
               <div className="lg:w-1/2 relative group">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full z-0 group-hover:scale-125 transition-transform duration-700"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=2070&auto=format&fit=crop" 
                    className="rounded-2xl shadow-2xl relative z-10 w-full object-cover h-[450px] transition-transform duration-500 hover:scale-[1.02]"
                    alt="ניהול צי רכב"
                  />
               </div>
               
               <div className="lg:w-1/2 space-y-8">
                  <Reveal>
                    <div>
                      <h3 className="text-4xl font-bold text-slate-900 leading-tight">הכוח שלנו הוא <span className="text-blue-600">הגמישות שלכם</span></h3>
                      <div className="w-24 h-1.5 bg-blue-600 mt-4 rounded-full"></div>
                    </div>
                  </Reveal>
                  
                  <div className="text-lg text-gray-600 leading-relaxed space-y-6 font-light">
                     <Reveal delay={200}>
                       <p>
                          הרבה חברות הסעה מוגבלות לצי הרכבים שעומד אצלן במגרש. אם האוטובוס תפוס או במוסך – אתם בבעיה. 
                          <strong className="font-bold text-slate-900 block mt-1">אנחנו עובדים אחרת.</strong>
                       </p>
                     </Reveal>
                     <Reveal delay={300}>
                       <p>
                          כחברת ניהול הפועלת כקבלן ראשי, אנחנו מחזיקים ברשת ארצית עצומה של רכבים ונהגים. 
                          המשמעות עבורכם היא פשוטה: אנחנו מתאימים לכם את הרכב המדויק לצרכים שלכם, ולא מנסים "לדחוף" לכם את מה שפנוי כרגע.
                       </p>
                     </Reveal>
                     <Reveal delay={400}>
                       <p>
                          בין אם מדובר בסיור VIP למשקיעים, ובין אם מדובר בהסעת עובדים יומית – יש לנו את הפתרון המושלם בקנה, זמין ומיידי.
                       </p>
                     </Reveal>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- REVIEWS SECTION --- */}
      <section id="reviews" className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden relative">
         <div className="absolute top-0 right-0 text-slate-100 transform -translate-y-1/2 translate-x-1/4 pointer-events-none">
            <Quote size={400} />
         </div>

         <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
               <div className="lg:w-1/3 space-y-6 text-center lg:text-right">
                  <Reveal>
                    <h2 className="text-4xl font-black text-slate-900 leading-tight">
                       מה הלקוחות<br/><span className="text-blue-600">אומרים עלינו?</span>
                    </h2>
                    <p className="text-lg text-gray-600 font-light mt-4">
                       השקט הנפשי של הלקוחות שלנו הוא המדד להצלחה שלנו.
                    </p>
                    <div className="flex justify-center lg:justify-start gap-1 pt-4">
                       {[1,2,3,4,5].map(i => <Star key={i} size={24} className="text-yellow-400 fill-yellow-400" />)}
                    </div>
                  </Reveal>
               </div>

               <div className="lg:w-2/3 w-full">
                  {reviews.length > 0 ? (
                     <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl shadow-blue-900/5 border-r-[6px] border-blue-600 relative min-h-[320px] flex flex-col justify-center transition-all hover:shadow-2xl hover:-translate-y-1 duration-500">
                        <Quote size={40} className="text-blue-200 mb-6" />
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500" key={currentReviewIndex}>
                           <p className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-8 italic">
                              "{reviews[currentReviewIndex].text}"
                           </p>
                           <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center font-bold text-blue-700 text-2xl">
                                 {reviews[currentReviewIndex].name.charAt(0)}
                              </div>
                              <div>
                                 <span className="block font-bold text-slate-900 text-lg">{reviews[currentReviewIndex].name}</span>
                                 <span className="text-sm text-gray-500">
                                    {reviews[currentReviewIndex].role} 
                                    {reviews[currentReviewIndex].company && ` | ${reviews[currentReviewIndex].company}`}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>
                  ) : (
                    <div className="text-center text-gray-400 p-10 border-2 border-dashed border-gray-200 rounded-3xl animate-pulse">
                        טוען המלצות...
                    </div>
                  )}
               </div>
            </div>
         </div>
      </section>

      {/* --- FEATURES STRIP --- */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-x-16 gap-y-6 text-gray-600">
           <FeatureItem icon={<Clock className="text-blue-600" />} text="זמינות 24/7 בימי חול"/>
           <FeatureItem icon={<MapPin className="text-blue-600" />} text="פריסה ארצית מלאה" />
           <FeatureItem icon={<CheckCircle2 className="text-blue-600" />} text="צי רכבים חדיש ומפואר" />
           <FeatureItem icon={<ShieldCheck className="text-blue-600" />} text="בטיחות ותקינות מעל הכל" />
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            
            {/* צד ימין - פרטים */}
            <div className="lg:w-5/12 space-y-10 lg:sticky lg:top-24">
              <Reveal>
                <h2 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">בואו נתקדם.</h2>
                <p className="text-xl text-gray-600 font-light leading-relaxed">
                  השאירו פרטים ונציג בכיר יחזור אליכם בהקדם עם פתרון מותאם אישית למערך ההסעות שלכם.
                </p>
              </Reveal>

              <div className="space-y-8 py-8 border-t border-b border-gray-100">
                <ContactItem icon={<Phone size={22} />} title="טלפון משרד" value="08-8587626" link="tel:088587626" />
                <ContactItem icon={<MessageCircle size={22} />} title="וואטסאפ ישיר" value="שלחו לנו הודעה" link="https://wa.me/972546205955" isWhatsApp={true} />
                <ContactItem icon={<Mail size={22} />} title="אימייל" value="yosefdaean@gmail.com" link="mailto:yosefdaean@gmail.com" />
                <ContactItem icon={<MapPin size={22} />} title="כתובת" value="שדרות ירושלים, קריית מלאכי" />
              </div>
            </div>

            {/* צד שמאל - טופס */}
            <div className="lg:w-7/12 w-full bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                   <InputField label="שם מלא" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="ישראל ישראלי" />
                   <InputField label="טלפון נייד" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="050-0000000" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                   <InputField label='דוא"ל' type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="your@email.com" />
                   <InputField label="עיר/ישוב" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="לדוגמה: תל אביב" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">הודעה (לא חובה)</label>
                  <textarea rows="4" className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition resize-none placeholder-gray-400"
                    placeholder="פרטים נוספים שחשוב שנדע..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
                </div>

                <button disabled={status === 'loading' || status === 'success'} 
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex justify-center items-center gap-3
                    ${status === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                >
                  {status === 'loading' ? 'שולח...' : status === 'success' ? <>נשלח בהצלחה! <CheckCircle2 size={22} /></> : <>קבלת הצעה <ArrowLeft size={22} /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- קומפוננטות עזר ואנימציה ---

function Reveal({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
        }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function StatCounter({ end, label, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [hasStarted, setHasStarted] = useState(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !hasStarted) setHasStarted(true); }, { threshold: 0.5 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [hasStarted]);
    useEffect(() => {
        if (!hasStarted) return;
        let start = 0; const duration = 2000; const increment = end / (duration / 16);
        const timer = setInterval(() => { start += increment; if (start >= end) { setCount(end); clearInterval(timer); } else { setCount(Math.ceil(start)); } }, 16);
        return () => clearInterval(timer);
    }, [hasStarted, end]);
    return (
        <div ref={ref} className="text-center min-w-[150px]">
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">{count}{suffix}</div>
            <div className="text-gray-500 font-medium">{label}</div>
        </div>
    );
}

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 font-medium group cursor-default">
      <div className="p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">{icon}</div>
      <span className="text-slate-700">{text}</span>
    </div>
  );
}

function ContactItem({ icon, title, value, link, isWhatsApp }) {
  const Wrapper = link ? 'a' : 'div';
  return (
    <Wrapper href={link} target={isWhatsApp ? '_blank' : undefined} className={`flex items-center gap-4 group ${link ? 'hover:translate-x-2 transition-transform cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isWhatsApp ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>{icon}</div>
      <div><span className="block text-sm text-gray-500 font-medium mb-0.5">{title}</span><span className={`text-lg font-bold ${isWhatsApp ? 'text-green-700' : 'text-slate-900'}`}>{value}</span></div>
    </Wrapper>
  );
}

function InputField({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label} {props.required && <span className="text-blue-600">*</span>}</label>
      <input type={type} className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition placeholder-gray-400" {...props} />
    </div>
  );
}