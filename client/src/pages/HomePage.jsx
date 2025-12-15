import { useEffect, useState } from 'react';
import { Star, Shield, MapPin, Phone, ArrowLeft, Clock, Check, ChevronDown } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
  // --- States ---
  const [formData, setFormData] = useState({ name: '', phone: '', city: '', message: '' });
  const [formStatus, setFormStatus] = useState('idle');
  const [scrolled, setScrolled] = useState(false);

  // נתונים סטטיים לגיבוי (כדי שהדף לא יהיה ריק אם השרת לא מגיב)
  const [reviews, setReviews] = useState([
    { id: 1, text: "סטנדרט שירות שלא הכרנו בענף ההיסעים. דיוק, רכבים ברמה הגבוהה ביותר ושקט נפשי.", name: "אלון מזרחי", role: "מנכ״ל", company: "HighTech Group" },
    { id: 2, text: "פתרון מושלם למשלחות האח״מים שלנו. הנהגים ייצוגיים והרכבים ללא רבב.", name: "דנה וייס", role: "מנהלת משאבי אנוש", company: "בנק לאומי" },
    { id: 3, text: "זמינות של 24/7 באמת. בכל שעה שצריכים פתרון, יש מענה מיידי ומקצועי.", name: "רונן בר", role: "מפיק אירועים", company: "Global Productions" },
  ]);
  const [activeReview, setActiveReview] = useState(0);

  // --- Effects ---
  useEffect(() => {
    // מנסה לשלוף נתונים, אם נכשל - נשאר עם הסטטיים
    const fetchData = async () => {
      try {
        api.post('/track').catch(() => {}); // ספירת כניסות
        const reviewsRes = await api.get('/reviews');
        if (reviewsRes.data.data && reviewsRes.data.data.length > 0) {
          setReviews(reviewsRes.data.data);
        }
      } catch (err) {
        console.log("Using static luxury content");
      }
    };
    fetchData();

    // רוטציה לביקורות
    const interval = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [reviews.length]);

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus('loading');
    try {
      await api.post('/leads', formData);
      setFormStatus('success');
      setFormData({ name: '', phone: '', city: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 3000);
    } catch (err) {
      setFormStatus('error');
    }
  };

  return (
    <div className="font-sans bg-black text-white selection:bg-yellow-600 selection:text-white">
      
      {/* 1. HERO SECTION - ULTRA PREMIUM */}
      <section id="hero" className="relative h-screen flex flex-col justify-center items-center overflow-hidden">
        {/* Dark Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1632243292408-013d5069f969?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-50 grayscale" // Grayscale for seriousness
            alt="Luxury Fleet"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 text-center mt-[-50px]">
          <div className="inline-block border-b border-yellow-600 pb-2 mb-6">
            <span className="text-yellow-600 tracking-[0.3em] text-sm font-semibold uppercase">CityLine Systems</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-8 leading-tight tracking-tight">
            הזמן שלך יקר.<br />
            <span className="text-gray-400">אנחנו נדאג לדרך.</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light tracking-wide leading-relaxed">
            פתרונות שינוע יוקרתיים לארגונים שלא מתפשרים.
            <br className="hidden md:block"/>
            דיוק מבצעי, צי רכבי עילית ושירות אישי מסביב לשעון.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
              className="bg-yellow-700 hover:bg-yellow-600 text-white px-10 py-4 min-w-[200px] text-sm font-bold tracking-widest uppercase transition-all duration-300 border border-transparent hover:scale-105"
            >
              תיאום נסיעה
            </button>
            <button 
              onClick={() => window.location.href = "tel:*2055"}
              className="px-10 py-4 min-w-[200px] text-sm font-bold tracking-widest uppercase border border-white/20 hover:border-white text-white transition-all duration-300 hover:bg-white/5"
            >
              מוקד 24/7
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown className="w-6 h-6 text-white" />
        </div>
      </section>


      {/* 2. STATS STRIP - MINIMALIST */}
      <div className="border-y border-white/10 bg-zinc-900/50 backdrop-blur-sm relative z-20">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-white/10">
          <StatItem value="100%" label="דיוק בזמנים" />
          <StatItem value="50+" label="ערים בישראל" />
          <StatItem value="VIP" label="צי רכבי פאר" />
          <StatItem value="24/7" label="זמינות מלאה" />
        </div>
      </div>


      {/* 3. SERVICES - "THE STANDARD" */}
      <section id="services" className="py-32 bg-zinc-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 border-b border-white/10 pb-8">
            <h2 className="text-4xl font-serif text-white">הסטנדרט שלנו</h2>
            <p className="text-gray-500 mt-4 md:mt-0 max-w-md text-left md:text-right">
              אנחנו מספקים מעטפת לוגיסטית מלאה. החל מהסעות עובדים קבועות ועד למשלחות דיפלומטיות.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard 
              title="תאגידים ומפעלים"
              subtitle="Corporate Logistics"
              desc="מערך הסעות חכם לעובדים. אופטימיזציה של מסלולים לחיסכון בעלויות ועמידה קפדנית בלוחות זמנים."
            />
            <ServiceCard 
              title="משלחות ואירועים"
              subtitle="Executive & Events"
              desc="רכבי מרצדס וצי פאר לאורחים חשובים. נהגים ייצוגיים דוברי אנגלית ושירות ברמת 5 כוכבים."
              active
            />
            <ServiceCard 
              title="מוסדות ורשויות"
              subtitle="Institutions"
              desc="בטיחות ללא פשרות. עמידה בכל התקנים המחמירים, רכבים מונגשים ופיקוח צמוד של קצין בטיחות."
            />
          </div>
        </div>
      </section>


      {/* 4. REVIEWS - TYPOGRAPHIC & SERIOUS */}
      <section id="reviews" className="py-32 bg-white text-black relative">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Star className="w-8 h-8 text-yellow-600 mx-auto mb-8 fill-current" />
            
            <div className="min-h-[250px] flex flex-col justify-center">
              <p className="text-2xl md:text-4xl font-serif leading-tight mb-10 transition-opacity duration-500">
                "{reviews[activeReview]?.text || 'טוען...'}"
              </p>
              
              <div className="border-t border-black/10 pt-8 inline-block mx-auto min-w-[200px]">
                <h4 className="font-bold tracking-widest uppercase text-sm">
                  {reviews[activeReview]?.name || ''}
                </h4>
                <p className="text-gray-500 text-sm mt-1">
                  {reviews[activeReview]?.role} {reviews[activeReview]?.company ? `• ${reviews[activeReview].company}` : ''}
                </p>
              </div>
            </div>

            {/* Pagination Lines */}
            <div className="flex justify-center gap-4 mt-12">
              {reviews.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveReview(idx)}
                  className={`h-[2px] transition-all duration-300 ${idx === activeReview ? 'w-16 bg-black' : 'w-8 bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* 5. CONTACT - "CONCIERGE" FEEL */}
      <section id="contact" className="py-32 bg-zinc-900 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-20">
            
            {/* Contact Info */}
            <div className="lg:w-1/3 space-y-12">
              <div>
                <h2 className="text-4xl font-serif text-white mb-6">יצירת קשר</h2>
                <div className="w-12 h-1 bg-yellow-700"></div>
              </div>
              
              <div className="space-y-8">
                <ContactRow title="מוקד הזמנות" value="08-8502020" sub="זמין 24/7" />
                <ContactRow title="דואר אלקטרוני" value="office@cityline.co.il" sub="מענה תוך שעה" />
                <ContactRow title="משרדים" value="האסיף 1, באר טוביה" sub="פארק תעשיות" />
              </div>
            </div>

            {/* Premium Form */}
            <div className="lg:w-2/3">
              <form onSubmit={handleSubmit} className="bg-black p-10 md:p-14 border border-white/10">
                <h3 className="text-2xl text-white mb-10 font-light">פתיחת קריאה / בקשת הצעה</h3>
                
                <div className="grid md:grid-cols-2 gap-10 mb-10">
                  <InputGroup 
                    label="שם מלא" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <InputGroup 
                    label="טלפון נייד" 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-10 mb-10">
                   <InputGroup 
                    label="עיר / יעד" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                  />
                  <InputGroup 
                    label="סוג שירות מבוקש" 
                    placeholder="לדוגמה: הסעת עובדים יומית"
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <div className="flex justify-between items-center mt-12">
                   <p className="text-gray-500 text-xs tracking-wide">
                     * בלחיצה אתה מאשר את מדיניות הפרטיות
                   </p>
                   <button 
                     disabled={formStatus !== 'idle'}
                     className="bg-white text-black px-12 py-4 font-bold tracking-widest uppercase hover:bg-yellow-600 hover:text-white transition-all duration-300 disabled:opacity-50"
                   >
                     {formStatus === 'loading' ? 'שולח...' : formStatus === 'success' ? 'נשלח בהצלחה' : 'שלח פרטים'}
                   </button>
                </div>
                
                {formStatus === 'success' && (
                  <div className="mt-6 text-green-500 text-sm tracking-wide flex items-center gap-2">
                    <Check size={16} /> הפרטים התקבלו. נציג יצור קשר בדקות הקרובות.
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}


// --- Premium Sub-Components ---

function StatItem({ value, label }) {
  return (
    <div className="py-8 md:py-12 text-center group hover:bg-white/5 transition-colors cursor-default">
      <div className="text-3xl md:text-4xl font-light text-white mb-2 tracking-tight group-hover:text-yellow-600 transition-colors">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-[0.2em]">{label}</div>
    </div>
  );
}

function ServiceCard({ title, subtitle, desc, active }) {
  return (
    <div className={`p-10 border transition-all duration-500 group cursor-pointer
      ${active ? 'border-yellow-700/50 bg-white/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}
    `}>
      <div className="text-yellow-700 text-xs font-bold tracking-widest uppercase mb-4">{subtitle}</div>
      <h3 className="text-2xl text-white mb-6 font-serif">{title}</h3>
      <p className="text-gray-400 font-light leading-relaxed text-sm">
        {desc}
      </p>
      <div className="mt-8 flex items-center text-white text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
        למידע נוסף <ArrowLeft className="mr-2 w-4 h-4" />
      </div>
    </div>
  );
}

function ContactRow({ title, value, sub }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs uppercase tracking-widest mb-1">{title}</span>
      <span className="text-white text-xl md:text-2xl font-light">{value}</span>
      <span className="text-yellow-700 text-sm mt-1">{sub}</span>
    </div>
  );
}

function InputGroup({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="relative group">
      <input 
        type={type}
        required
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full py-4 bg-transparent border-b border-white/20 text-white placeholder-gray-700 focus:outline-none focus:border-yellow-600 transition-colors"
      />
      <label className="absolute top-0 right-0 text-gray-500 text-xs uppercase tracking-widest transform -translate-y-6 pointer-events-none group-focus-within:text-yellow-600 transition-colors">
        {label}
      </label>
    </div>
  );
}
