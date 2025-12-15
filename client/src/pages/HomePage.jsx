import { useEffect, useState } from 'react';
import { Bus, Car, Accessibility, Phone, MessageCircle, MapPin, Mail, Quote, Star, Truck, Zap, ShieldCheck, Route, Check } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // --- דמי נתונים לבדיקה (אם ה-API לא עובד) ---
  // אם יש לך API אמיתי, הקוד ב-useEffect למטה ידרוס את זה.
  const defaultReviews = [
    { text: "שירות מעולה, הנהג הגיע בדיוק בזמן והרכב היה נקי ומצוחצח. ממליץ בחום!", name: "ישראל ישראלי", role: "מנהל רכש", company: "אינטל" },
    { text: "אנחנו עובדים עם יחס הסעות כבר שנתיים, השקט הנפשי שווה הכל.", name: "דנה כהן", role: "מנהלת רווחה", company: "" },
  ];

  useEffect(() => {
    const init = async () => {
       try {
         api.post('/track').catch(() => {});
         
         const [contentRes, reviewsRes] = await Promise.all([
            api.get('/content').catch(() => ({ data: {} })),
            api.get('/reviews').catch(() => ({ data: { data: { reviews: [] } } }))
         ]);

         setContent(contentRes.data.data || {});
         // אם אין ביקורות מהשרת, נשתמש בדיפולט כדי שהעיצוב יראה טוב
         const fetchedReviews = reviewsRes.data.data?.reviews || [];
         setReviews(fetchedReviews.length > 0 ? fetchedReviews : defaultReviews);

       } catch (err) {
         console.error(err);
         setReviews(defaultReviews);
       }
    };
    init();
  }, []);

  // קרוסלה
  useEffect(() => {
    if (reviews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [reviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/leads', formData);
      setStatus('success');
      setFormData({ name: '', phone: '', email: '', city: '', message: '' });
    } catch (err) { setStatus('error'); }
  };

  return (
    <div className="font-sans text-slate-800 bg-white selection:bg-yellow-200" id="top">

      {/* --- 1. HERO SECTION --- */}
      {/* שמרנו על העיצוב המקורי כי הוא היה המוצלח, רק חידדנו צבעים */}
      <section className="relative h-[650px] lg:h-[750px] w-full bg-slate-900 border-b-4 border-yellow-500">
        <div className="absolute inset-0 z-0">
           <img
             src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-50 grayscale-[30%]" // הוספתי קצת Grayscale למראה תעשייתי
             alt="צי רכבים"
           />
           {/* שכבה כהה נוספת לקריאות טקסט */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 mt-[-50px]">
             <div className="text-right text-white space-y-4 lg:w-2/3">
                <div className="inline-block bg-yellow-500 text-slate-900 font-bold px-3 py-1 text-sm rounded-sm mb-2">
                    פתרונות תחבורה מתקדמים
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none drop-shadow-xl">
                    {content.hero_title || "הסעות הגיסים"}
                </h1>
                <h2 className="text-3xl md:text-5xl font-light tracking-wide text-gray-200">
                  {content.hero_subtitle || 'מגיעים ליעד. בבטיחות.'}
                </h2>
                <p className="text-lg md:text-xl font-medium mt-6 leading-relaxed text-gray-300 max-w-2xl border-r-4 border-yellow-500 pr-4">
                  בואו נעביר הילוך. עם צי הרכבים המתקדם שלנו, אתם מקבלים שקט תפעולי, דיוק בזמנים ובטיחות מעל הכל.
                </p>
                <div className="pt-8">
                  <button onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} 
                          className="bg-yellow-500 text-slate-900 px-10 py-4 font-bold text-xl hover:bg-yellow-400 transition shadow-lg rounded-sm uppercase tracking-wide">
                    בואו נתחיל לעבוד
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* --- כרטיסיות צפות --- */}
        <div className="absolute -bottom-16 w-full z-30 px-4">
           <div className="container mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                 <FloatingCard icon={<Car size={40} />} title="מוניות" sub="4 מקומות" />
                 <FloatingCard icon={<Truck size={40} />} title='אט"ז' sub="14 מקומות" />
                 <FloatingCard icon={<Accessibility size={40} />} title="מעלון" sub="נגישות מלאה" />
                 <FloatingCard icon={<Bus size={40} />} title="מיניבוס" sub="19-23 מקומות" />
                 <FloatingCard icon={<Bus size={40} />} title="אוטובוס" sub="55-60 מקומות" />
              </div>
           </div>
        </div>
      </section>

      {/* רווח בגלל הכרטיסיות */}
      <div className="h-28 bg-white"></div>
      
      {/* --- 2. WHY US (Clean & Industrial) --- */}
      <section id="why-us" className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className="flex flex-col lg:flex-row justify-between items-end mb-16 gap-8 border-b border-gray-100 pb-8">
              <div className="lg:w-2/3 text-center lg:text-right">
                 <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-3">
                    {content.why_us_title || "לוגיסטיקה חכמה בתנועה"}
                 </h2>
                 <p className="text-xl text-slate-500 max-w-2xl lg:mr-auto font-light">
                    {content.why_us_subtitle || "בנינו מודל לוגיסטי ייחודי המבטיח לכם שקט תפעולי מלא, ללא הפתעות וללא איחורים."}
                 </p>
              </div>
              <button onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} 
                      className="text-slate-900 font-bold text-lg border-b-2 border-yellow-500 hover:text-yellow-600 transition pb-1 shrink-0">
                  דברו איתנו &larr;
              </button>
           </div>
           
           <div className="grid md:grid-cols-4 gap-6">
              <FeatureBox 
                icon={<Zap size={28} />} 
                title="זמינות 24/7"
                description="מערך תפעולי המאפשר מענה מיידי לשינויים וצרכים דחופים מסביב לשעון."
              />
               <FeatureBox 
                icon={<Route size={28} />} 
                title="אופטימיזציה"
                description="תכנון מסלולים חכם לחסכון בעלויות ולצמצום זמני נסיעה מיותרים."
              />
              <FeatureBox 
                icon={<ShieldCheck size={28} />} 
                title="בטיחות מעל הכל"
                description="קצין בטיחות בתעבורה במשרה מלאה וצי רכבים חדיש ומתוחזק."
              />
              <FeatureBox 
                icon={<Star size={28} />} 
                title="שירות אישי (VIP)"
                description="מנהל תיק לקוח אישי המלווה אתכם ומכיר את הצרכים הספציפיים של הארגון."
              />
           </div>
        </div>
      </section>
      
      {/* --- 3. REVIEWS (No Blobs, Clean Box) --- */}
      <section id="reviews" className="py-24 bg-slate-50 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              מה הלקוחות אומרים
            </h2>
            <div className="w-12 h-1.5 bg-yellow-500 mx-auto"></div>
          </div>

          <div className="max-w-3xl mx-auto">
            {reviews.length > 0 ? (
              <div className="relative">
                {/* Clean Card Design */}
                <div key={currentReviewIndex} className="bg-white p-10 md:p-14 shadow-xl border border-gray-100 rounded-sm relative animate-in fade-in duration-500">
                  <Quote size={60} className="absolute top-6 right-6 text-gray-100 rotate-180" />
                  
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className="flex gap-1 mb-6 text-yellow-500">
                        {[...Array(5)].map((_, i) => <Star key={i} size={22} fill="currentColor" strokeWidth={0} />)}
                    </div>

                    <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-8">
                        "{reviews[currentReviewIndex].text}"
                    </p>

                    <div className="flex items-center gap-4 border-t border-gray-100 pt-6 w-full justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-lg">
                          {reviews[currentReviewIndex].name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-lg leading-none">
                            {reviews[currentReviewIndex].name}
                          </h4>
                          <p className="text-sm text-slate-500 mt-1 font-medium">
                            {reviews[currentReviewIndex].role} 
                            {reviews[currentReviewIndex].company && <span className="mx-1 text-yellow-500">|</span>}
                            {reviews[currentReviewIndex].company}
                          </p>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                  {reviews.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentReviewIndex(idx)}
                      className={`h-1.5 rounded-none transition-all duration-300 
                        ${idx === currentReviewIndex ? 'w-8 bg-slate-900' : 'w-4 bg-gray-300 hover:bg-gray-400'}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
               <div className="text-center py-10">
                  <p className="text-gray-400">טוען נתונים...</p>
               </div>
            )}
          </div>
        </div>
      </section>

      {/* --- 4. CONTACT SECTION (Unified Colors) --- */}
      <section id="contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto bg-white">
             
             {/* Info Side */}
             <div className="lg:w-1/3 space-y-8 text-center lg:text-right pt-4">
                <div>
                   <h3 className="text-3xl font-black text-slate-900 mb-4">בואו נדבר תכלס</h3>
                   <p className="text-slate-500 text-lg">השאירו פרטים או צרו קשר ישיר לקבלת הצעת מחיר מיידית ומותאמת אישית.</p>
                </div>
                
                <div className="space-y-6 pt-4 border-t border-gray-100">
                   <ContactItem icon={<Phone />} text="08-8587626" href="tel:088587626" />
                   <ContactItem icon={<MessageCircle />} text="שלחו לנו וואטסאפ" href="https://wa.me/972546205955" />
                   <ContactItem icon={<Mail />} text="yosefdaean@gmail.com" href="mailto:yosefdaean@gmail.com" />
                   <ContactItem icon={<MapPin />} text="שדרות ירושלים, קרית מלאכי" />
                </div>
             </div>

             {/* Form Side */}
             <div className="lg:w-2/3 bg-slate-50 p-8 md:p-10 border border-gray-100 shadow-lg relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 -z-10 rounded-bl-full"></div>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                   <div className="grid md:grid-cols-2 gap-5">
                      <Input 
                        placeholder="שם מלא" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                      />
                      <Input 
                        placeholder='דוא"ל' 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})} 
                      />
                   </div>
                   <div className="grid md:grid-cols-2 gap-5">
                      <Input 
                        placeholder="עיר / ישוב" 
                        value={formData.city} 
                        onChange={e => setFormData({...formData, city: e.target.value})} 
                      />
                      <Input 
                        placeholder="טלפון נייד (חובה)" 
                        required 
                        type="tel"
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                      />
                   </div>
                   <textarea
                     rows="4"
                     placeholder="פרטים נוספים / בקשות מיוחדות"
                     className="w-full p-4 bg-white border border-gray-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors rounded-sm text-slate-800 placeholder-gray-400 resize-none"
                     value={formData.message}
                     onChange={e => setFormData({...formData, message: e.target.value})}
                   ></textarea>

                   <button
                     disabled={status === 'loading' || status === 'success'}
                     className={`w-full py-4 font-bold text-lg transition shadow-md rounded-sm uppercase tracking-wide flex justify-center items-center gap-2
                       ${status === 'success' 
                         ? 'bg-green-600 text-white cursor-default' 
                         : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                   >
                      {status === 'loading' && <span className="animate-spin">⌛</span>}
                      {status === 'loading' ? 'שולח...' : status === 'success' ? 'הפרטים נשלחו בהצלחה' : 'שליחת פרטים'}
                   </button>
                </form>
             </div>
           </div>
        </div>
      </section>

      {/* Footer Minimal */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm border-t border-slate-800">
        <p>© {new Date().getFullYear()} יחס הסעות. כל הזכויות שמורות.</p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS (Refactored) ---

function FloatingCard({ icon, title, sub }) {
  return (
    <div className="bg-white h-36 flex flex-col justify-center items-center text-center px-4 shadow-xl border-b-4 border-transparent hover:border-yellow-500 transition-all duration-300 group cursor-default relative top-0 hover:-top-1">
       <div className="text-slate-300 group-hover:text-yellow-500 transition-colors duration-300 mb-3">
         {icon}
       </div>
       <h3 className="font-bold text-slate-900 text-xl leading-none mb-1">{title}</h3>
       <p className="text-gray-500 text-sm">{sub}</p>
    </div>
  );
}

function FeatureBox({ icon, title, description }) {
    return (
        <div className="p-6 bg-white border border-gray-100 hover:border-yellow-500 hover:shadow-lg transition-all duration-300 group rounded-sm">
            <div className="w-12 h-12 bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-yellow-500 transition-colors duration-300">
                <div className="text-slate-900">
                    {icon}
                </div>
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

function ContactItem({ icon, text, href }) {
    const content = (
        <>
            <span className="text-yellow-500">{icon}</span>
            <span className="font-medium">{text}</span>
        </>
    );

    if (href) {
        return (
            <a href={href} className="flex items-center justify-center lg:justify-start gap-4 text-lg text-slate-600 hover:text-slate-900 transition group">
                {content}
            </a>
        );
    }
    return (
        <div className="flex items-center justify-center lg:justify-start gap-4 text-lg text-slate-600">
            {content}
        </div>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className="w-full p-4 bg-white border border-gray-200 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors rounded-sm text-slate-800 placeholder-gray-400"
        />
    );
}
