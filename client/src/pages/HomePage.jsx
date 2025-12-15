import { useEffect, useState } from 'react';
import { Bus, Car, Accessibility, Phone, MessageCircle, MapPin, Mail, Quote } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', city: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [content, setContent] = useState({});
  
  // State לביקורות
  const [reviews, setReviews] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  useEffect(() => {
    const init = async () => {
       try {
         api.post('/track').catch(() => {});
         
         // שליפת תוכן וביקורות במקביל
         const [contentRes, reviewsRes] = await Promise.all([
            api.get('/content'),
            api.get('/reviews')
         ]);

         setContent(contentRes.data.data || {});
         setReviews(reviewsRes.data.data.reviews || []);

       } catch (err) {
         console.error(err);
       }
    };
    init();
  }, []);

  // מנגנון החלפת ביקורות אוטומטי (קרוסלה)
  useEffect(() => {
    if (reviews.length === 0) return;
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
    }, 5000); // כל 5 שניות
    return () => clearInterval(interval);
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
    <div className="font-sans" id="top">

      {/* --- HERO SECTION --- */}
      <section className="relative h-[650px] lg:h-[750px] w-full bg-slate-900">
        <div className="absolute inset-0 z-0">
           <img
             src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop"
             className="w-full h-full object-cover opacity-60"
             alt="צי רכבים"
           />
        </div>

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-4xl w-full flex flex-col lg:flex-row items-center justify-between gap-12 mt-[-50px]">
             <div className="text-right text-white space-y-2 lg:w-2/3">
                <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-none drop-shadow-xl">
                    {content.hero_title || "הסעות הגיסים"}
                </h1>
                <h2 className="text-4xl md:text-6xl font-light tracking-wide drop-shadow-md opacity-90 text-outline">
                  {content.hero_subtitle || 'הרבה מעבר ליחס'}
                </h2>
                <p className="text-lg md:text-xl font-medium mt-6 leading-relaxed drop-shadow-md max-w-2xl">
                  בואו נעביר יחד הילוך ונגיע יחד אל היעד.
                  עם צי הרכבים המתקדם של יחס הסעות ניתן להגיע בקלות, יעילות ובטיחות לכל המטרות!
                </p>
                <div className="pt-8">
                  <button onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} className="bg-brand-yellow text-white px-12 py-3 font-bold text-xl hover:bg-yellow-500 transition shadow-lg rounded-sm">
                    בואו לראות
                  </button>
                </div>
             </div>
          </div>

        </div>

        {/* --- כרטיסיות צפות (העיצוב החדש) --- */}
        <div className="absolute -bottom-20 w-full z-30 px-30">
           <div className="container mx-auto">
              {/* Gap הוקטן ל-2 כדי שיהיו צפופים */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                 <FloatingCard icon={<Bus size={28} />} title="אוטובוסים" sub="55-60 מקומות" />
                 <FloatingCard icon={<Bus size={24} />} title="מיניבוסים" sub="40 מקומות" />
                 <FloatingCard icon={<Bus size={22} />} title="מיניבוסים" sub="19-23 מקומות" />
                 <FloatingCard icon={<Accessibility size={28} />} title="רכב עם מעלון" sub="לבעלי מוגבלויות" />
                 <FloatingCard icon={<Bus size={22} />} title='אט"ז' sub="14 מקומות" />
                 <FloatingCard icon={<Car size={28} />} title="מוניות" sub="4 מקומות" />
              </div>
           </div>
        </div>
      </section>

      {/* רווח קטן יותר בגלל שהכרטיסיות נמוכות יותר */}
      <div className="h-24 bg-white"></div>

      {/* --- REVIEWS SECTION (DYNAMIC) --- */}
      <section id="reviews" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
           <div className="flex flex-col lg:flex-row items-stretch shadow-xl rounded-lg overflow-hidden bg-white min-h-[400px]">

              {/* צד ימין: הכותרת הסגולה */}
              <div className="lg:w-1/3 bg-brand-purple text-white p-12 flex flex-col justify-center items-center text-center relative">
                 <h2 className="text-5xl font-black leading-tight mb-4">
                    מה לקוחות<br/>אומרים עלינו
                 </h2>
                 <div className="hidden lg:block absolute top-1/2 -left-4 w-0 h-0 border-t-[15px] border-t-transparent border-r-[20px] border-r-brand-purple border-b-[15px] border-b-transparent -translate-y-1/2 z-10"></div>
              </div>

              {/* צד שמאל: הקרוסלה */}
              <div className="lg:w-2/3 bg-white p-10 flex items-center justify-center relative">
                 {reviews.length > 0 ? (
                    <div className="max-w-2xl w-full animate-fade-in text-center">
                        <Quote size={48} className="text-brand-yellow mx-auto mb-6 opacity-50" />
                        
                        <p className="text-xl md:text-2xl text-gray-700 font-medium leading-relaxed mb-8">
                            "{reviews[currentReviewIndex].text}"
                        </p>
                        
                        <div className="flex flex-col items-center">
                             <div className="w-16 h-1 bg-brand-yellow mb-4 rounded-full"></div>
                             <span className="block font-bold text-brand-purple text-lg">{reviews[currentReviewIndex].name}</span>
                             <span className="text-sm text-gray-500">
                                {reviews[currentReviewIndex].role} 
                                {reviews[currentReviewIndex].company && ` • ${reviews[currentReviewIndex].company}`}
                             </span>
                        </div>

                        {/* אינדיקטורים */}
                        <div className="flex justify-center gap-2 mt-8">
                            {reviews.map((_, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => setCurrentReviewIndex(idx)}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentReviewIndex ? 'bg-brand-purple w-6' : 'bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    </div>
                 ) : (
                    <p className="text-gray-400">אין עדיין ביקורות להצגה.</p>
                 )}
              </div>
           </div>
        </div>
      </section>

      {/* --- CONTACT SECTION --- */}
      <section id="contact" className="py-20 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
           <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-brand-purple mb-2">קבלו הצעה מצוינת עכשיו!</h2>
              <div className="w-16 h-1 bg-brand-yellow mx-auto"></div>
           </div>

           <div className="flex flex-col lg:flex-row gap-16 max-w-6xl mx-auto">
              <div className="lg:w-1/3 space-y-8 text-center lg:text-right">
                 <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">צור קשר</h3>
                    <p className="text-gray-600">ספרו לנו על הצרכים שלכם ואנו נתפור לכם פתרון מיידי.</p>
                 </div>
                 <div className="space-y-6">
                    <a href="tel:088502020" className="flex items-center justify-center lg:justify-start gap-4 text-xl font-bold text-gray-700 hover:text-brand-purple transition">
                      <Phone className="text-brand-purple" /> 08-8502020
                    </a>
                    <a href="https://wa.me/972526253640" className="flex items-center justify-center lg:justify-start gap-4 text-xl font-bold text-gray-700 hover:text-green-600 transition">
                       <MessageCircle className="text-green-500" /> שלחו הודעת וואטסאפ
                    </a>
                    <div className="flex items-center justify-center lg:justify-start gap-4 text-lg text-gray-600">
                      <Mail className="text-brand-purple" /> Sidur@yahas.co.il
                    </div>
                    <div className="flex items-center justify-center lg:justify-start gap-4 text-lg text-gray-600">
                      <MapPin className="text-brand-purple" /> האסיף 1, אזור התעשייה באר טוביה
                    </div>
                 </div>
              </div>

              <div className="lg:w-2/3 bg-gray-50 p-8 rounded-xl shadow-inner border border-gray-100">
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                       <input
                         type="text"
                         placeholder="שם מלא"
                         required
                         className="w-full p-3 border border-gray-300 rounded focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                       <input
                         type="email"
                         placeholder='דוא"ל'
                         className="w-full p-3 border border-gray-300 rounded focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                         value={formData.email}
                         onChange={e => setFormData({...formData, email: e.target.value})}
                       />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                       <input
                         type="text"
                         placeholder="ישוב"
                         className="w-full p-3 border border-gray-300 rounded focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                         value={formData.city}
                         onChange={e => setFormData({...formData, city: e.target.value})}
                       />
                       <input
                         type="tel"
                         placeholder="טלפון (חובה)"
                         required
                         className="w-full p-3 border border-gray-300 rounded focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                    <textarea
                      rows="4"
                      placeholder="מה עוד חשוב שנדע?"
                      className="w-full p-3 border border-gray-300 rounded focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                    ></textarea>

                    <button
                      disabled={status === 'loading' || status === 'success'}
                      className={`w-full py-3 font-bold text-white text-lg transition shadow-md
                        ${status === 'success' ? 'bg-green-600' : 'bg-brand-dark-purple hover:bg-brand-purple'}`}
                    >
                       {status === 'loading' ? 'שולח...' : status === 'success' ? 'נשלח בהצלחה!' : 'שלח פרטים'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
}

// הרכיב המעודכן לפי התמונה החדשה
function FloatingCard({ icon, title, sub }) {
  return (
    // h-32 במקום h-40, border-t במקום border-b
    <div className="bg-white h-32 flex flex-col justify-center items-center text-center shadow-xl rounded-sm border-t-4 border-brand-yellow hover:-translate-y-1 transition-transform duration-300 cursor-default relative overflow-hidden group p-2">
       <div className="text-brand-purple mb-2 group-hover:scale-110 transition duration-300">
         {icon}
       </div>
       <h3 className="font-bold text-brand-purple text-base leading-tight mb-1">{title}</h3>
       <p className="text-gray-500 text-xs">{sub}</p>
    </div>
  );
}