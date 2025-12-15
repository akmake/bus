import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Home, Phone, LogOut, LayoutDashboard, BusFront } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  return (
    // שינוי צבע: bg-slate-900 במקום bg-primary כדי להבטיח שלא יהיה צהוב
    <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* לוגו ומיתוג */}
          <Link to="/" className="text-xl md:text-2xl font-bold flex items-center gap-3 hover:opacity-90 transition">
            <div className="bg-white/10 p-2 rounded-lg">
              <BusFront size={24} className="text-blue-400" />
            </div>
            <span className="tracking-wide">CityLine <span className="text-blue-400 font-light">Systems</span></span>
          </Link>

          {/* קישורים */}
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* כפתור לידים מהיר בנאבר */}
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-1 hover:text-blue-300 transition text-sm font-medium cursor-pointer"
            >
              <Phone size={16} /> יצירת קשר
            </button>

            {/* איזור ניהול - מופיע רק למנהל */}
            {user?.role === 'admin' && (
              <Link to="/admin" className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-md flex items-center gap-2 transition text-sm font-bold shadow-md border border-blue-400">
                <LayoutDashboard size={16} /> 
                <span className="hidden md:inline">ניהול מערכת</span>
              </Link>
            )}

            {/* כפתור התנתקות (רק אם מחובר) */}
            {user && (
              <div className="flex items-center gap-3 border-r border-white/20 pr-4 mr-2">
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition"
                  title="התנתק"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
            
            {/* הסרנו את כפתור "כניסת צוות" כבקשתך */}
          </div>
        </div>
      </div>
    </nav>
  );
}