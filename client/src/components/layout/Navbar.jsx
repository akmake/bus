// src/components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Phone, LogOut, LayoutDashboard, BusFront, MapPin } from 'lucide-react';

const COLORS = {
    dark: 'slate-900',
    accent: 'amber-500', 
};

// הגדרת האזורים כפי שהוגדרו בקובץ ה-HomePage
const SECTIONS = [
  { id: 'top', title: 'ראשי' },
  { id: 'fleet', title: 'הצי שלנו' },
  { id: 'management', title: 'ניהול ובטיחות' },
  { id: 'contact', title: 'צור קשר' },
];

/**
 * קומפוננטת ניווט עליונה
 * @param {object} props
 * @param {string} props.activeSection - מזהה האזור הפעיל (לצורך ScrollSpy)
 */
export default function Navbar({ activeSection }) {
  const { user, logout } = useAuthStore();
  
  // פונקציה פשוטה לגלול לאלמנט
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`bg-${COLORS.dark} text-white shadow-xl sticky top-0 z-50 border-b-4 border-${COLORS.accent}`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* לוגו: חזק ותעשייתי */}
          <a href="#top" onClick={() => scrollToSection('top')} className="text-2xl font-black flex items-center gap-3 hover:opacity-90 transition cursor-pointer">
            <div className={`text-${COLORS.accent} bg-white/5 p-2 rounded-sm border border-${COLORS.accent}`}>
              <BusFront size={24} />
            </div>
            <span className="tracking-widest">Y<span className={`text-${COLORS.accent}`}>H</span>S</span>
          </a>

          {/* ניווט ScrollSpy - קישורים עם סימון אקטיבי */}
          <div className="hidden md:flex items-center gap-8">
            {SECTIONS.map((section) => (
              <a 
                key={section.id} 
                href={`#${section.id}`} 
                onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(section.id);
                }}
                className={`text-sm font-bold transition-colors border-b-4 py-1 
                  ${activeSection === section.id 
                     ? `text-${COLORS.accent} border-${COLORS.accent}` 
                     : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`}
              >
                {section.title}
              </a>
            ))}
          </div>

          {/* Call to Action & Admin Links */}
          <div className="flex items-center gap-4">
              {/* איזור ניהול - מופיע רק למנהל */}
              {user?.role === 'admin' && (
                <Link to="/admin" className={`bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-sm flex items-center gap-2 transition text-sm font-bold shadow-md`}>
                  <LayoutDashboard size={16} /> 
                  <span className="hidden md:inline">ניהול מערכת</span>
                </Link>
              )}

              {/* כפתור יצירת קשר מהיר */}
              <button 
                onClick={() => scrollToSection('contact')}
                className={`bg-${COLORS.accent} text-${COLORS.dark} px-4 py-2 rounded-sm font-black text-sm hover:opacity-90 transition shadow-xl flex items-center gap-2`}>
                <Phone size={16} />
                <span className="hidden sm:inline">התחילו עבודה</span>
              </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
