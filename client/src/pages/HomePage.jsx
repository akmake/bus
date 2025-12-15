import { useEffect, useState } from 'react';
import { Bus, Building2, ShieldCheck, Star, ArrowLeft, MapPin, Users, Quote, Phone, Clock } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  // --- 1. State Management ---
  const [content, setContent] = useState({});
  const [reviews, setReviews] = useState([]);
  
  // טופס לידים מעודכן לפי המודל החדש (כולל עיר והודעה)
  const [formData, setFormData] = useState({ name: '', phone: '', city: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle'); // idle, loading, success, error

  // קרוסלת ביקורות
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  // --- 2. Data Fetching ---
  useEffect(() => {
    const init = async () => {
       try {
         // דיווח כניסה לסטטיסטיקה
         api.post('/track').catch(() => {});
         
         // שליפת תוכן (CMS)
         const contentRes = await api.get('/content');
         setContent(contentRes.data.data || {});

         // שליפת ביקורות
         try {
             // נסה לשלוף מהשרת
             const reviewsRes = await api.get('/reviews'); // שים לב: צריך לוודא שיש Route כזה בשרת
             const fetchedReviews = reviewsRes.data.data || [];
             
             if (fetchedReviews.length > 0) {
                 setReviews(fetchedReviews);
             } else {
                 // אם אין ביקורות בשרת, זרוק שגיאה כדי להפעיל את ה-Fallback
                 throw new Error('No reviews found');
             }
         } catch (e) {
             // נתוני דמה (Fallback) למקרה שהשרת ריק או שאין עדיין נתיב
             console.log("Using fallback reviews");
             setReviews([
                 { _id: '1', name: 'ישראל ישראלי', role: 'מנהל תפעול', company: 'אינטל', text: 'שירות יוצא דופן, הנהגים תמיד מגיעים בזמן והרכבים נקיים ומתוחזקים. חוויה מתקנת לעומת חברות אחרות.' },
                 { _id: '2', name: 'שרה כהן', role: 'מנהלת רווחה', company: 'עיריית תל אביב', text: 'אנחנו עובדים עם יחס הסעות כבר שנתיים ומרוצים מכל רגע. הזמינות של המוקד 24/7 היא יתרון עצום עבורנו.' },
                 { _id: '3', name: 'יוסי לוי', role: 'מפיק אירועים', company: '', text: 'הזמנו אוטובוסים לחתונה, הכל תיקתק כמו שעון. הנהגים היו אדיבים והאורחים לא הפסיקו לשבח.' },
             ]);
         }

       } catch (err) {
           console.error('Error initializing home page', err);
       }
    };
    init();
  }, []);

  // --- 3. Auto Rotate Reviews Logic ---
  useEffect(() => {
      if (reviews.length === 0) return;
      
      const interval = setInterval(() => {
          setCurrentReviewIndex((prev) => (prev + 1) % reviews.length);
      }, 6000); // החלפה כל 6 שניות

      return () => clearInterval(interval);
  }, [reviews]);

  // --- 4. Form Submission Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('loading');
    
    try {
      // שליחת הנתונים לשרת (כולל השדות החדשים)
      await api.post('/leads', formData);
      
      setFormStatus('success');
      setFormData({ name: '', phone: '', city: '', message: '' }); // איפוס טופס
      
      // איפוס הודעת הצלחה אחרי 3 שניות
      setTimeout(() => setFormStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setFormStatus('error');
    }
  };

  // --- 5. Main Render ---
  return (
    <div className="font-sans text-slate-800 bg-white">

      {/* === ZONE 1: HERO SECTION === */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900">
        
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
            <img 
                src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2069&auto=format&fit=crop" 
                alt="Luxury Bus" 
                className="w-full h-full object-cover opacity-40 scale-105 animate-slow-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 z-10 text-center mt-16">
            <div className="inline-block mb-4 px-4 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 backdrop-blur-md">
                <span className="text-yellow-400 font-bold text-sm tracking-wider uppercase">CityLine Systems</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight leading-tight drop-shadow-2xl">
                {content.hero_title || 'הדרך שלך.\nהמחויבות שלנו.'}
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed whitespace-pre-line">
                {content.hero_subtitle || 'פתרונות היסעים מתקדמים לארגונים, חברות ומוסדות.\nצי רכבים חדיש בפריסה ארצית וזמינות 24/7.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })} 
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-10 py-4 rounded-xl font-bold text-lg transition shadow-[0_0_20px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2 group"
                >
                    קבלת הצעה בקליק 
                    <ArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <button 
                    onClick={() => window.location.href = "tel:*2055"}
                    className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2"
                >
                    <Phone size={20} /> חייגו *2055
                </button>
            </div>
        </div>
      </section>

      {/* === ZONE 2: TRANSITION BAR (Stats Strip) === */}
      <div className="relative z-20 -mt-16 container mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-gray-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-x-reverse divide-gray-100">
              <StatItem icon={<Clock className="text-blue-600" />} number="24/7" label="מוקד זמין" />
              <StatItem icon={<MapPin className="text-yellow-500" />} number="פריסה" label="כל הארץ" />
              <StatItem icon={<ShieldCheck className="text-green-600" />} number="100%" label="בטיחות" />
              <StatItem icon={<Users className="text-purple-600" />} number="VIP" label="שירות אישי" />
          </div>
      </div>

      {/* === ZONE 3: SALES / SERVICES SECTION === */}
      <section id="services" className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
              <div className="text-center mb-16 max-w-3xl mx-auto">
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-4">למה לבחור ב-CityLine?</h2>
                  <p className="text-gray-500 text-lg">אנחנו לא רק חברת הסעות. אנחנו השותף הלוגיסטי השקט שלך, זה שדואג שהכל יתקתק בזמן שאתה מתמקד בעבודה.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <ServiceCard 
                      icon={<Building2 size={40} />}
                      title="מפעלים וארגונים"
                      desc="חיסכון בעלויות תפעול, מסלולים חכמים והגעה בזמן למשמרת. הראש השקט של מנהל התפעול."
                      tags={['חיסכון', 'דיוק', 'יעילות']}
                  />
                  <ServiceCard 
                      icon={<Star size={40} />}
                      title="אירועים ו-VIP"
                      desc="רכבי פאר ממוזגים ומאובזרים, נהגים ייצוגיים דוברי שפות ושירות ברמה בינלאומית."
                      tags={['יוקרה', 'נוחות', 'ייצוגיות']}
                      highlight
                  />
                  <ServiceCard 
                      icon={<Bus size={40} />}
                      title="מוסדות חינוך"
                      desc="בטיחות מעל הכל. רכבים העומדים בכל התקנים המחמירים, חגורות בטיחות ונהגים עם בדיקות רקע."
                      tags={['בטיחות', 'תקן משרד החינוך']}
                  />
              </div>
          </div>
      </section>

      {/* === ZONE 4: DYNAMIC REVIEWS SECTION === */}
      <section id="reviews" className="py-24 bg-slate-900 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-[100px]"></div>

          <div className="container mx-auto px-4 relative z-10">
              <div className="flex flex-col items-center mb-12">
                  <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm mb-2">לקוחות מספרים</span>
                  <h2 className="text-3xl md:text-5xl font-bold text-white text-center">ההצלחה שלהם, הגאווה שלנו</h2>
              </div>

              {/* Slider Component */}
              <div className="max-w-4xl mx-auto relative min-h-[300px]">
                  {reviews.length > 0 ? (
                      <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 text-center transition-all duration-700 ease-in-out">
                          <div className="mb-6 text-yellow-400 flex justify-center">
                              <Quote size={48} className="opacity-50" />
                          </div>
                          
                          {/* Review Content - with key for animation */}
                          <div key={currentReviewIndex} className="animate-fade-in">
                              <p className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
                                  "{reviews[currentReviewIndex].text}"
                              </p>
                              <div className="flex flex-col items-center">
                                  <div className="w-16 h-1 bg-yellow-500 mb-4 rounded-full"></div>
                                  <h4 className="text-xl font-bold text-white">{reviews[currentReviewIndex].name}</h4>
                                  <p className="text-gray-400 text-sm">
                                      {reviews[currentReviewIndex].role}
                                      {reviews[currentReviewIndex].role && reviews[currentReviewIndex].company && ' | '}
                                      {reviews[currentReviewIndex].company}
                                  </p>
                              </div>
                          </div>

                          {/* Slider Dots/Controls */}
                          <div className="flex justify-center gap-2 mt-8">
                             {reviews.map((_, idx) => (
                                 <button 
                                    key={idx}
                                    onClick={() => setCurrentReviewIndex(idx)}
                                    className={`h-2 rounded-full transition-all duration-300 ${idx === currentReviewIndex ? 'bg-yellow-500 w-8' : 'bg-white/30 w-2 hover:bg-white/50'}`}
                                    aria-label={`Go to review ${idx + 1}`}
                                 />
                             ))}
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-gray-500">טוען המלצות...</div>
                  )}
              </div>
          </div>
      </section>

      {/* === ZONE 5: CONTACT SECTION === */}
      <section id="contact" className="py-24 bg-white relative">
          <div className="container mx-auto px-4">
              <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
                  
                  {/* Left Side: Info */}
                  <div className="lg:w-2/5 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                      
                      <div className="relative z-10">
                          <h3 className="text-3xl font-bold mb-6">פרטי התקשרות</h3>
                          <p className="text-gray-400 mb-10 leading-relaxed">
                              המוקד שלנו זמין עבורכם 24 שעות ביממה.
                              צרו קשר לקבלת הצעת מחיר מותאמת אישית תוך דקות.
                          </p>

                          <div className="space-y-8">
                              <div className="flex items-center gap-4 group">
                                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500 group-hover:text-slate-900 transition-colors">
                                      <Phone size={24} />
                                  </div>
                                  <div>
                                      <p className="text-gray-400 text-xs">מוקד ארצי</p>
                                      <p className="text-xl font-bold">08-8502020</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4 group">
                                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-yellow-400 group-hover:bg-yellow-500 group-hover:text-slate-900 transition-colors">
                                      <Building2 size={24} />
                                  </div>
                                  <div>
                                      <p className="text-gray-400 text-xs">כתובת</p>
                                      <p className="text-lg font-medium">האסיף 1, א.ת באר טוביה</p>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="relative z-10 mt-12">
                          <div className="bg-yellow-500 text-slate-900 p-6 rounded-xl shadow-lg">
                              <p className="font-bold text-lg mb-1">זמינים בוואטסאפ!</p>
                              <p className="text-sm opacity-90">שלחו הודעה וקבלו מענה מיידי</p>
                          </div>
                      </div>
                  </div>

                  {/* Right Side: Form */}
                  <div className="lg:w-3/5 p-8 md:p-12 bg-gray-50">
                      <div className="mb-8">
                          <h3 className="text-3xl font-bold text-slate-900 mb-2">בואו נתקדם</h3>
                          <p className="text-gray-500">מלאו את הפרטים ונחזור אליכם בהקדם</p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700">שם מלא</label>
                                  <input 
                                      type="text" 
                                      required
                                      placeholder="ישראל ישראלי"
                                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                                      value={formData.name}
                                      onChange={e => setFormData({...formData, name: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-sm font-medium text-slate-700">טלפון נייד</label>
                                  <input 
                                      type="tel" 
                                      required
                                      placeholder="050-0000000"
                                      className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                                      value={formData.phone}
                                      onChange={e => setFormData({...formData, phone: e.target.value})}
                                  />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">עיר / ישוב</label>
                              <input 
                                  type="text" 
                                  placeholder="לדוגמה: תל אביב"
                                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                                  value={formData.city}
                                  onChange={e => setFormData({...formData, city: e.target.value})}
                              />
                          </div>

                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700">הודעה / פרטים נוספים</label>
                              <textarea 
                                  rows="4"
                                  placeholder="אני צריך הסעה ל-50 עובדים..."
                                  className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition"
                                  value={formData.message}
                                  onChange={e => setFormData({...formData, message: e.target.value})}
                              ></textarea>
                          </div>

                          <button 
                              disabled={formStatus === 'loading' || formStatus === 'success'}
                              className={`w-full py-4 rounded-xl font-bold text-lg text-white transition-all transform hover:-translate-y-1 shadow-lg
                                  ${formStatus === 'success' ? 'bg-green-600' : 'bg-slate-900 hover:bg-slate-800'}
                              `}
                          >
                              {formStatus === 'loading' ? 'שולח פרטים...' : formStatus === 'success' ? 'הפרטים נשלחו בהצלחה!' : 'שליחת פרטים'}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      </section>

    </div>
  );
}

// --- Helper Functions (Components) ---

function StatItem({ icon, number, label }) {
    return (
        <div className="flex flex-col items-center text-center group">
            <div className="mb-3 p-3 bg-gray-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <span className="text-3xl font-black text-slate-900 mb-1">{number}</span>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
    );
}

function ServiceCard({ icon, title, desc, tags, highlight }) {
    return (
        <div className={`p-8 rounded-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full border
            ${highlight 
                ? 'bg-slate-900 text-white shadow-2xl shadow-slate-900/20 border-slate-800' 
                : 'bg-white text-slate-800 shadow-sm hover:shadow-xl border-gray-100'
            }`}
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 
                ${highlight ? 'bg-yellow-500 text-slate-900' : 'bg-blue-50 text-blue-600'}`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className={`mb-8 leading-relaxed ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
            
            <div className="mt-auto flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                    <span key={i} className={`text-xs px-3 py-1 rounded-full font-medium
                        ${highlight ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}
