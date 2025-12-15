import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Phone, LogOut, LayoutDashboard, BusFront, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  // האזנה לגלילה - לשינוי עיצוב הנאבר ולזיהוי המיקום
  useEffect(() => {
    const handleScroll = () => {
      // 1. שינוי רקע הנאבר בגלילה
      setIsScrolled(window.scrollY > 50);

      // 2. זיהוי האזור הנוכחי (Scroll Spy) - רץ רק בדף הבית
      if (isHomePage) {
        const sections = ['hero', 'services', 'reviews', 'contact'];
        let current = 'hero';
        
        for (const section of sections) {
          const element = document.getElementById(section);
          if (element) {
            const rect = element.getBoundingClientRect();
            // אם החלק העליון של האלמנט נמצא בשליש העליון של המסך
            if (rect.top <= 300 && rect.bottom >= 300) {
              current = section;
            }
          }
        }
        setActiveSection(current);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHomePage]);

  const scrollToSection = (id) => {
    if (!isHomePage) return; // אם אנחנו לא בדף הבית, הלינק יעביר אותנו (צריך לוגיקה נוספת למעבר עמוד+גלילה, כרגע פשוט נשאר בדף הבית)
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // פונקציית עזר לקישור
  const NavLink = ({ id, label }) => (
    <button
      onClick={() => scrollToSection(id)}
      className={`text-sm font-medium transition-colors duration-300 relative
        ${activeSection === id && isHomePage ? 'text-yellow-400 font-bold' : 'text-gray-300 hover:text-white'}
      `}
    >
      {label}
      {activeSection === id && isHomePage && (
        <span className="absolute -bottom-2 right-0 w-full h-0.5 bg-yellow-400 rounded-full animate-fade-in"></span>
      )}
    </button>
  );

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/95 shadow-lg py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">

          {/* לוגו */}
          <Link to="/" className="text-xl md:text-2xl font-bold flex items-center gap-3 text-white">
            <div className={`p-2 rounded-lg transition-colors ${isScrolled ? 'bg-white/10' : 'bg-white/20 backdrop-blur-sm'}`}>
              <BusFront size={24} className="text-yellow-400" />
            </div>
            <span className="tracking-wide text-shadow">CityLine <span className="text-yellow-400 font-light">Systems</span></span>
          </Link>
          
          {/* תפריט אמצעי (דסקטופ) */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink id="hero" label="ראשי" />
            <NavLink id="services" label="שירותים" />
            <NavLink id="reviews" label="לקוחות ממליצים" />
            <NavLink id="contact" label="צור קשר" />
          </div>

          {/* צד שמאל - כפתורים */}
          <div className="hidden md:flex items-center gap-4">
            <button
               onClick={() => scrollToSection('contact')}
               className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 px-5 py-2 rounded-full font-bold text-sm transition shadow-lg hover:shadow-yellow-500/20 flex items-center gap-2"
            >
              <Phone size={16} /> שיחה מיידית
            </button>

            {/* איזור ניהול */}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-white hover:text-blue-300 transition" title="ניהול מערכת">
                 <LayoutDashboard size={20} />
              </Link>
            )}
            
            {user && (
               <button onClick={logout} className="text-gray-400 hover:text-white"><LogOut size={20} /></button>
            )}
          </div>

          {/* כפתור מובייל (לא ממומש במלואו בקוד זה לקיצור, אבל קיים ויזואלית) */}
          <button className="md:hidden text-white">
            <Menu size={28} />
          </button>
        </div>
      </div>
    </nav>
  );
}
