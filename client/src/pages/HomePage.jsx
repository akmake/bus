import { useEffect, useState } from 'react';
import { Bus, Car, Accessibility, Phone, MessageCircle, MapPin, Mail, Quote, Star, Truck, Zap, ShieldCheck, Route, ArrowRight } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // נתוני דמו כדי שתוכל לראות את האפקט מיד
  const defaultReviews = [
    { text: "הזמנתי אוטובוס לחתונה של הבן, הנהג הגיע 20 דקות לפני הזמן, אוטובוס מבריק וממוזג. שירות שנותן שקט נפשי.", name: "אבי כהן", role: "לקוח פרטי", company: "חתונה" },
    { text: "עובדים איתם כבר שנתיים באופן קבוע להסעות עובדים. אפס תקלות, זמינות מלאה של המוקד, פשוט תענוג.", name: "רונית אלמליח", role: "משאבי אנוש", company: "הייטק-זון" },
    { text: "המחיר היה הוגן ביותר, והתמורה מעל ומעבר. הנהג היה אדיב וסבלני לכל הבקשות שלנו בדרך.", name: "דוד לוי", role: "מארגן טיולים", company: "" },
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
         const fetchedReviews = reviewsRes.data.data?.reviews || [];
         setReviews(fetchedReviews.length > 0 ? fetchedReviews : defaultReviews);
       } catch (err) {
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
    }, 5000);
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
    <div className="font-sans text-slate-800 bg-white" id="top">

      {/* --- 1. HERO SECTION --- */}
      <section className="relative h-[700px] w-full bg-slate-900 pb-32"> {/* pb-32 נותן מקום לכרטיסיות */}
        <div className="absolute inset-0 z-0">
           <img
             src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-40 mix-blend-overlay"
             alt="צי רכבים"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-3xl space-y-6 mt-[-60px]">
             {/* כותרת משנה קטנה וצהובה - נותן טאץ' מודרני */}
             <div className="flex items-center gap-2 text-yellow-500 font-bold tracking-wider uppercase text-sm">
                <span className="w-8 h-1 bg-yellow-500"></span>
                פתרונות תחבורה מתקדמים
             </div>

             <h1 className="text-6xl md:text-8xl font-black text-white leading-none tracking-tight">
                {content.hero_title || "הסעות הגיסים"}
                <span className="text-yellow-500">.</span>
             </h1>
             
             <h2 className="text-3xl md:text-5xl font-light text-gray-300">
               {content.hero_subtitle || 'מגיעים ליעד. בבטיחות.'}
             </h2>

             <p className="text-lg text-gray-400 max-w-xl leading-relaxed border-r-2 border-yellow-500/50 pr-6">
               צי הרכבים המתקדם שלנו עומד לרשותכם. שירות מקצועי, דיוק בזמנים ושקט נפשי למנהלי רווחה ולקוחות פרטיים כאחד.
             </p>
             
             <div className="pt-6">
               <button onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} 
                       className="group bg-yellow-500 text-slate-900 px-10 py-4 font-bold text-xl hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] rounded-sm flex items-center gap-3">
                 בואו נתחיל
                 <ArrowRight className="group-hover:translate-x-[-5px] transition-transform" />
               </button>
             </div>
          </div>
        </div>

        {/* --- התיקון הגדול: כרטיסיות צפות "על הגדר" --- */}
        {/* Absolute positioned div that sits exactly on the bottom edge */}
        <div className="absolute -bottom-20 w-full z-30 px-4"> 
           <div className="container mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                 {/* כרטיסיות אופקיות (כמו בתמונה המקורית שרצית) */}
                 <FloatingCard icon={<Car size={32} />} title="מוניות" sub="עד 4 מקומות" />
                 <FloatingCard icon={<Truck size={32} />} title='אט"ז' sub="14 מקומות" />
                 <FloatingCard icon={<Accessibility size={32} />} title="נכים" sub="רכב עם מעלון" />
                 <FloatingCard icon={<Bus size={32} />} title="מיניבוס" sub="20 מקומות" />
                 <FloatingCard icon={<Bus size={32} />} title="אוטובוס" sub="60 מקומות" />
              </div>
           </div>
        </div>
      </section>

      {/* Spacer - מרווח כדי שהכרטיסיות לא יעלו על הטקסט הבא */}
      <div className="h-32 bg-white"></div>
      
      {/* --- 2. WHY US --- */}
      <section id="why-us" className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-black text-slate-900 mb-4">למה דווקא אנחנו?</h2>
              <div className="w-20 h-1.5 bg-yellow-500 mx-auto mb-6"></div>
              <p className="text-xl text-slate-500">
                בנינו מודל לוגיסטי ייחודי המבטיח לכם שקט תפעולי מלא. אנחנו לא רק מסיעים, אנחנו דואגים שתגיעו.
              </p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureBox 
                icon={<Zap size={32} />} 
                title="זמינות 24/7"
                description="מערך תפעולי המאפשר מענה מיידי לשינויים וצרכים דחופים, ביום ובלילה."
              />
               <FeatureBox 
                icon={<Route size={32} />} 
                title="מסלולים חכמים"
                description="תכנון נסיעה חכם שחוסך זמן וכסף, תוך עקיפת פקקים בזמן אמת."
              />
              <FeatureBox 
                icon={<ShieldCheck size={32} />} 
                title="בטיחות מקסימלית"
                description="רכבים חדישים, נהגים עם עבר נקי וקצין בטיחות שמפקח על הכל."
              />
              <FeatureBox 
                icon={<Star size={32} />} 
                title="שירות VIP"
                description="יחס אישי לכל לקוח. אצלנו אתם לא עוד מספר במערכת."
              />
           </div>
        </div>
      </section>
      
      {/* --- 3. REVIEWS (Dynamic but Clean) --- */}
      <section className="py-24 bg-slate-50 relative overflow-hidden">
        {/* החזרתי אלמנטים גרפיים אבל בצבעים הנכונים - בלי סגול! */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-900/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col items-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 text-center">לקוחות ממליצים</h2>
            <div className="flex gap-2 mt-4">
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
                <Star className="text-yellow-500 fill-yellow-500" size={20} />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-xl shadow-2xl p-8 md:p-12 border-r-8 border-yellow-500">
               <Quote size={80} className="absolute top-4 left-4 text-slate-100 rotate-180" />
               
               <div className="relative z-10 transition-all duration-500 ease-in-out min-h-[200px] flex flex-col justify-center">
                  <p className="text-2xl md:text-3xl font-medium text-slate-800 leading-normal mb-8 text-right">
                      "{reviews[currentReviewIndex]?.text}"
                  </p>
                  
                  <div className="flex items-center gap-4 border-t border-gray-100 pt-6">
                      <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {reviews[currentReviewIndex]?.name.charAt(0)}
                      </div>
                      <div>
                          <h4 className="font-bold text-lg text-slate-900">{reviews[currentReviewIndex]?.name}</h4>
                          <span className="text-slate-500 text-sm">{reviews[currentReviewIndex]?.role}</span>
                      </div>
                  </div>
               </div>
            </div>

            {/* אינדיקטורים של הקרוסלה */}
            <div className="flex justify-center gap-3 mt-8">
              {reviews.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentReviewIndex(idx)}
                  className={`h-3 transition-all duration-300 rounded-full 
                    ${idx === currentReviewIndex ? 'w-10 bg-yellow-500' : 'w-3 bg-slate-300 hover:bg-slate-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. CONTACT SECTION --- */}
      <section id="contact" className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
           <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto shadow-2xl rounded-2xl overflow-hidden bg-white">
             
             {/* טופס - צד שמאל ויזואלי חזק */}
             <div className="lg:w-2/3 p-8 md:p-12">
                <h3 className="text-3xl font-black text-slate-900 mb-6">בואו נסגור את הפינה</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder="שם מלא" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                      <Input placeholder="טלפון" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                   <div className="grid md:grid-cols-2 gap-6">
                      <Input placeholder='דוא"ל' type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      <Input placeholder="יעד / מטרה" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                   </div>
                   <textarea
                     rows="3"
                     placeholder="הודעה חופשית..."
                     className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-yellow-500 focus:bg-white outline-none transition-colors resize-none"
                     value={formData.message}
                     onChange={e => setFormData({...formData, message: e.target.value})}
                   ></textarea>

                   <button disabled={status === 'loading' || status === 'success'}
                     className={`w-full py-4 font-bold text-lg rounded-sm transition-all transform hover:-translate-y-1 shadow-lg
                       ${status === 'success' ? 'bg-green-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                      {status === 'loading' ? 'שולח...' : status === 'success' ? 'הפרטים התקבלו!' : 'שלח פרטים לקבלת הצעה'}
                   </button>
                </form>
             </div>

             {/* פרטים - צד ימין צהוב ובולט */}
             <div className="lg:w-1/3 bg-yellow-500 p-8 md:p-12 text-slate-900 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl font-black mb-6 border-b-2 border-slate-900 pb-4 inline-block">יצירת קשר מהירה</h3>
                  <div className="space-y-6 font-medium text-lg">
                     <ContactItem icon={<Phone className="text-slate-900" />} text="08-8587626" />
                     <ContactItem icon={<MessageCircle className="text-slate-900" />} text="וואטסאפ" />
                     <ContactItem icon={<Mail className="text-slate-900" />} text="yosefdaean@gmail.com" />
                     <ContactItem icon={<MapPin className="text-slate-900" />} text="קרית מלאכי" />
                  </div>
                </div>
                <div className="mt-12 text-sm font-bold opacity-75">
                  זמינים עבורכם לכל שאלה.
                </div>
             </div>

           </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-500 py-8 text-center text-sm border-t border-slate-800">
        <div className="container mx-auto">
          <p>© {new Date().getFullYear()} יחס הסעות. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}

// --- COMPONENTS ---

// התיקון הקריטי: FloatingCard אופקי עם צל חזק
function FloatingCard({ icon, title, sub }) {
  return (
    <div className="bg-white h-24 flex items-center justify-between px-6 shadow-xl border-r-4 border-yellow-500 cursor-default hover:translate-y-[-5px] transition-transform duration-300">
       <div className="text-right">
         <h3 className="font-bold text-slate-900 text-xl leading-none">{title}</h3>
         <p className="text-gray-500 text-xs mt-1">{sub}</p>
       </div>
       <div className="text-yellow-500">
         {icon}
       </div>
    </div>
  );
}

function FeatureBox({ icon, title, description }) {
    return (
        <div className="group p-8 bg-white border border-gray-100 rounded-xl hover:shadow-2xl transition-all duration-300 hover:border-yellow-400 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-yellow-400 transform translate-x-2 group-hover:translate-x-0 transition-transform duration-300"></div>
            <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-yellow-500 transition-colors duration-300 text-slate-700">
                {icon}
            </div>
            <h3 className="font-bold text-xl mb-3 text-slate-900">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
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
          className="w-full p-4 bg-gray-50 border-b-2 border-gray-200 focus:border-yellow-500 focus:bg-white outline-none transition-colors rounded-t-sm" 
        />
    )
}
