import { useEffect, useState } from 'react';
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
  
  // --- שינוי 1: State לביקורות במקום מערך קבוע ---
  const [reviews, setReviews] = useState([]); 
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // טעינה ראשונית - גם מעקב וגם משיכת ביקורות
  useEffect(() => {
    const initData = async () => {
      try {
        api.post('/track').catch(err => console.error(err));
        
        // משיכת הביקורות מהשרת
        const res = await api.get('/reviews');
        if (res.data.data.reviews) {
          setReviews(res.data.data.reviews);
        }
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      }
    };
    initData();
  }, []);

  // טיימר להחלפת ביקורות (רץ רק אם יש ביקורות)
  useEffect(() => {
    if (reviews.length === 0) return; // לא מריץ אם אין ביקורות

    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [reviews]); // תלוי ב-reviews

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
      
      {/* --- Section: Hero (הוספנו id="hero") --- */}
      <section id="hero" className="relative h-[600px] flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-slate-900">
           <img 
             src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop" 
             alt="Luxury Bus" 
             className="w-full h-full object-cover opacity-40"
           />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            פתרונות תחבורה <span className="text-blue-500">חכמים</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
            ניהול מערכי היסעים מתקדמים למוסדות, מפעלים ורשויות. 
            שקט תפעולי מלא וזמינות בפריסה ארצית.
          </p>
          <button 
            onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg transition shadow-lg hover:shadow-blue-500/30"
          >
            קבלת הצעה למערך שלך
          </button>
        </div>
      </section>

      {/* --- Section: Services / Flexibility (הוספנו id="services") --- */}
      <section id="services" className="py-24 bg-white overflow-hidden">
         <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col lg:flex-row items-center gap-16 mb-12">
               <div className="lg:w-1/2 relative">
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full z-0"></div>
                  <img 
                    src="https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=2070&auto=format&fit=crop" 
                    className="rounded-2xl shadow-2xl relative z-10 w-full object-cover h-[450px]"
                    alt="ניהול צי רכב"
                  />
               </div>
               <div className="lg:w-1/2 space-y-8">
                  <div>
                    <h3 className="text-4xl font-bold text-slate-900 leading-tight">הכוח שלנו הוא <span className="text-blue-600">הגמישות שלכם</span></h3>
                    <div className="w-24 h-1.5 bg-blue-600 mt-4 rounded-full"></div>
                  </div>
                  <div className="text-lg text-gray-600 leading-relaxed space-y-6 font-light">
                     <p>
                        הרבה חברות הסעה מוגבלות לצי הרכבים שעומד אצלן במגרש. אם האוטובוס תפוס או במוסך – אתם בבעיה. 
                        <strong className="font-bold text-slate-900 block mt-1">אנחנו עובדים אחרת.</strong>
                     </p>
                     <p>
                        כחברת ניהול הפועלת כקבלן ראשי, אנחנו מחזיקים ברשת ארצית עצומה של רכבים ונהגים. 
                        המשמעות עבורכם היא פשוטה: אנחנו מתאימים לכם את הרכב המדויק לצרכים שלכם, ולא מנסים "לדחוף" לכם את מה שפנוי כרגע.
                     </p>
                     <p>
                        בין אם מדובר בסיור VIP למשקיעים שדורש מיניבוס מפואר ונהג ייצוגי, ובין אם מדובר בהסעת עובדים יומית שדורשת דייקנות ושירותיות – יש לנו את הפתרון המושלם בקנה, זמין ומיידי.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- Section: Reviews (id="reviews" כבר היה קיים, שמרנו עליו) --- */}
      <section id="reviews" className="py-24 bg-slate-50 border-y border-slate-100 overflow-hidden relative">
         <div className="absolute top-0 right-0 text-slate-100 transform -translate-y-1/2 translate-x-1/4 pointer-events-none">
            <Quote size={400} />
         </div>

         <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-16">
               <div className="lg:w-1/3 space-y-6 text-center lg:text-right">
                  <h2 className="text-4xl font-black text-slate-900 leading-tight">
                     מה הלקוחות<br/><span className="text-blue-600">אומרים עלינו?</span>
                  </h2>
                  <p className="text-lg text-gray-600 font-light">
                     השקט הנפשי של הלקוחות שלנו הוא המדד להצלחה שלנו.
                  </p>
                  <div className="flex justify-center lg:justify-start gap-1 pt-2">
                     {[1,2,3,4,5].map(i => <Star key={i} size={24} className="text-blue-500 fill-blue-500" />)}
                  </div>
               </div>

               <div className="lg:w-2/3 w-full">
                  {/* מציג רק אם יש ביקורות מהשרת */}
                  {reviews.length > 0 ? (
                     <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl shadow-blue-900/5 border-r-[6px] border-blue-600 relative min-h-[320px] flex flex-col justify-center">
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
                        <div className="absolute bottom-0 left-0 h-1.5 bg-blue-50 w-full rounded-bl-3xl overflow-hidden">
                           <div key={currentReviewIndex} className="h-full bg-blue-600 w-full origin-left animate-[progress_5s_linear]"></div>
                        </div>
                     </div>
                  ) : (
                    <div className="text-center text-gray-400 p-10 border-2 border-dashed border-gray-200 rounded-3xl">
                        טוען המלצות...
                    </div>
                  )}
               </div>
            </div>
         </div>
      </section>

      {/* Features Strip */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4 flex flex-wrap justify-center gap-x-16 gap-y-6 text-gray-600">
           <FeatureItem icon={<Clock className="text-blue-600" />} text="זמינות 24/7 בימי חול"/>
           <FeatureItem icon={<MapPin className="text-blue-600" />} text="פריסה ארצית מלאה" />
           <FeatureItem icon={<CheckCircle2 className="text-blue-600" />} text="צי רכבים חדיש ומפואר" />
           <FeatureItem icon={<ShieldCheck className="text-blue-600" />} text="בטיחות ותקינות מעל הכל" />
        </div>
      </section>

      {/* --- Section: Contact (id="contact" כבר היה קיים) --- */}
      <section id="contact" className="py-24 bg-white">
        {/* תוכן הסקשן ללא שינוי, רק מוודא שה-ID קיים בשורה למעלה */}
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-16 items-start">
            
            {/* צד ימין - פרטים */}
            <div className="lg:w-5/12 space-y-10 lg:sticky lg:top-24">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">בואו נתקדם.</h2>
                <p className="text-xl text-gray-600 font-light leading-relaxed">
                  השאירו פרטים ונציג בכיר יחזור אליכם בהקדם עם פתרון מותאם אישית למערך ההסעות שלכם.
                </p>
              </div>

              <div className="space-y-8 py-8 border-t border-b border-gray-100">
                <ContactItem 
                  icon={<Phone size={22} />}
                  title="טלפון משרד"
                  value="08-8587626"
                  link="tel:088587626"
                />
                <ContactItem 
                  icon={<MessageCircle size={22} />}
                  title="וואטסאפ ישיר"
                  value="שלחו לנו הודעה"
                  link="https://wa.me/972546205955"
                  isWhatsApp={true}
                />
                <ContactItem 
                  icon={<Mail size={22} />}
                  title="אימייל"
                  value="yosefdaean@gmail.com"
                  link="mailto:yosefdaean@gmail.com"
                />
                 <ContactItem 
                  icon={<MapPin size={22} />}
                  title="כתובת"
                  value="שדרות ירושלים, קריית מלאכי"
                />
              </div>
            </div>

            {/* צד שמאל - טופס */}
            <div className="lg:w-7/12 w-full bg-gray-50 p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                   <InputField 
                     label="שם מלא" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})} 
                     required 
                     placeholder="ישראל ישראלי"
                   />
                   <InputField 
                     label="טלפון נייד" 
                     type="tel"
                     value={formData.phone} 
                     onChange={e => setFormData({...formData, phone: e.target.value})} 
                     required 
                     placeholder="050-0000000"
                   />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                   <InputField 
                     label='דוא"ל' 
                     type="email"
                     value={formData.email} 
                     onChange={e => setFormData({...formData, email: e.target.value})} 
                     placeholder="your@email.com"
                   />
                   <InputField 
                     label="עיר/ישוב" 
                     value={formData.city} 
                     onChange={e => setFormData({...formData, city: e.target.value})} 
                     placeholder="לדוגמה: תל אביב"
                   />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">הודעה (לא חובה)</label>
                  <textarea
                    rows="4"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition resize-none placeholder-gray-400"
                    placeholder="פרטים נוספים שחשוב שנדע..."
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  disabled={status === 'loading' || status === 'success'}
                  className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex justify-center items-center gap-3
                    ${status === 'success' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                >
                  {status === 'loading' ? 'שולח...' : status === 'success' ? (
                    <>נשלח בהצלחה! <CheckCircle2 size={22} /></>
                  ) : (
                    <>קבלת הצעה <ArrowLeft size={22} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// --- קומפוננטות עזר ל-HomePage ---
function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 font-medium group cursor-default">
      <div className="p-2 rounded-full bg-blue-50 group-hover:bg-blue-100 transition-colors">
        {icon}
      </div>
      <span className="text-slate-700">{text}</span>
    </div>
  );
}

function ContactItem({ icon, title, value, link, isWhatsApp }) {
  const Wrapper = link ? 'a' : 'div';
  const linkProps = link ? { href: link, target: isWhatsApp ? '_blank' : undefined } : {};

  return (
    <Wrapper {...linkProps} className={`flex items-center gap-4 group ${link ? 'hover:translate-x-2 transition-transform cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors
        ${isWhatsApp ? 'bg-green-50 text-green-600 group-hover:bg-green-100' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
        {icon}
      </div>
      <div>
        <span className="block text-sm text-gray-500 font-medium mb-0.5">{title}</span>
        <span className={`text-lg font-bold ${isWhatsApp ? 'text-green-700' : 'text-slate-900'}`}>{value}</span>
      </div>
    </Wrapper>
  );
}

function InputField({ label, type = "text", ...props }) {
  return (
    <div>
      <label className="block text-sm font-bold text-slate-700 mb-2">{label} {props.required && <span className="text-blue-600">*</span>}</label>
      <input 
        type={type}
        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition placeholder-gray-400"
        {...props}
      />
    </div>
  );
}