import { useEffect, useState } from 'react';
import api from '../services/api';
import { CheckCircle, XCircle, Clock, AlertCircle, Save, Layout, Users, MessageSquare, Trash2, Plus } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' | 'content' | 'reviews'
  
  // Data States
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState([]);
  const [content, setContent] = useState({});
  const [reviews, setReviews] = useState([]); // <--- חדש
  const [loading, setLoading] = useState(true);

  // Form State for new review
  const [newReview, setNewReview] = useState({ name: '', role: '', company: '', text: '' });

  // טעינה ראשונית
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [leadsRes, statsRes, contentRes, reviewsRes] = await Promise.all([
        api.get('/admin/leads'),
        api.get('/admin/stats'),
        api.get('/content'),
        api.get('/admin/reviews') // <--- קריאה חדשה
      ]);
      setLeads(leadsRes.data.data.leads);
      setStats(statsRes.data.data.stats);
      setContent(contentRes.data.data || {});
      setReviews(reviewsRes.data.data.reviews || []);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  // --- לוגיקה ללידים ---
  const handleStatusChange = async (id, newStatus) => {
    const oldLeads = [...leads];
    setLeads(leads.map(l => l._id === id ? { ...l, status: newStatus } : l));
    try {
      await api.patch(`/admin/leads/${id}`, { status: newStatus });
    } catch (err) {
      setLeads(oldLeads);
      alert('שגיאה בעדכון סטטוס');
    }
  };

  // --- לוגיקה לתוכן ---
  const handleContentChange = (key, value) => {
    setContent(prev => ({ ...prev, [key]: value }));
  };

  const saveContent = async (key) => {
    try {
      await api.put('/admin/content', { key, value: content[key] });
      alert('נשמר!');
    } catch (err) {
      alert('שגיאה בשמירה');
    }
  };

  // --- לוגיקה לביקורות (חדש) ---
  const handleAddReview = async (e) => {
      e.preventDefault();
      try {
          const res = await api.post('/admin/reviews', newReview);
          setReviews([res.data.data.review, ...reviews]);
          setNewReview({ name: '', role: '', company: '', text: '' });
          alert('ביקורת נוספה בהצלחה');
      } catch (err) {
          alert('שגיאה בהוספת ביקורת');
      }
  };

  const handleDeleteReview = async (id) => {
      if(!window.confirm('בטוח למחוק?')) return;
      try {
          await api.delete(`/admin/reviews/${id}`);
          setReviews(reviews.filter(r => r._id !== id));
      } catch (err) {
          alert('שגיאה במחיקה');
      }
  };

  if (loading) return <div className="text-center mt-20">טוען נתונים...</div>;

  return (
    <div className="container mx-auto p-6 space-y-8 min-h-screen bg-gray-50">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">מערכת ניהול</h1>
          <p className="text-gray-500 text-sm">ניהול פניות ותוכן האתר</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <TabButton active={activeTab === 'leads'} onClick={() => setActiveTab('leads')} icon={<Users size={18} />} label="ניהול פניות" />
          <TabButton active={activeTab === 'content'} onClick={() => setActiveTab('content')} icon={<Layout size={18} />} label="עריכת תוכן" />
          <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon={<MessageSquare size={18} />} label="ביקורות" />
        </div>
      </header>

      {/* --- Tab: Leads --- */}
      {activeTab === 'leads' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard title="כניסות השבוע" value={stats.reduce((acc, curr) => acc + curr.count, 0)} />
             <StatCard title="לידים חדשים" value={leads.filter(l => l.status === 'new').length} color="text-blue-600" />
             <StatCard title="סה'כ פניות" value={leads.length} />
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-medium">תאריך</th>
                    <th className="p-4 font-medium">שם</th>
                    <th className="p-4 font-medium">עיר</th> {/* חדש */}
                    <th className="p-4 font-medium">הודעה</th> {/* חדש */}
                    <th className="p-4 font-medium">טלפון</th>
                    <th className="p-4 font-medium">סטטוס</th>
                    <th className="p-4 font-medium">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {leads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-blue-50/30 transition">
                      <td className="p-4 text-gray-500 text-sm">
                        {new Date(lead.createdAt).toLocaleDateString('he-IL')}
                        <span className="block text-xs text-gray-400">{new Date(lead.createdAt).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{lead.name}</td>
                      <td className="p-4 text-sm text-gray-600">{lead.city || '-'}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={lead.message}>{lead.message || '-'}</td>
                      <td className="p-4 font-mono text-gray-600">
                        <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                      </td>
                      <td className="p-4"><StatusBadge status={lead.status} /></td>
                      <td className="p-4">
                        <select
                          className="text-sm border border-gray-200 rounded px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                        >
                          <option value="new">טרם טופל</option>
                          <option value="in_progress">בטיפול</option>
                          <option value="done">טופל/נסגר</option>
                          <option value="irrelevant">לא רלוונטי</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        </div>
      )}

      {/* --- Tab: Content Editing --- */}
      {activeTab === 'content' && (
        <div className="grid gap-6 max-w-3xl mx-auto animate-fade-in">
             <ContentBlock title="איזור ראשי (Hero)" description="מה שהלקוח רואה כשהוא נכנס לאתר">
                 <InputField label="כותרת ראשית" value={content.hero_title} onChange={(val) => handleContentChange('hero_title', val)} onSave={() => saveContent('hero_title')} />
                 <InputField label="תת כותרת" value={content.hero_subtitle} onChange={(val) => handleContentChange('hero_subtitle', val)} onSave={() => saveContent('hero_subtitle')} textarea />
             </ContentBlock>
        </div>
      )}

      {/* --- Tab: Reviews (חדש לגמרי) --- */}
      {activeTab === 'reviews' && (
          <div className="grid lg:grid-cols-3 gap-8 animate-fade-in">
              {/* טופס הוספה */}
              <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 sticky top-24">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Plus size={20}/> הוספת המלצה</h3>
                      <form onSubmit={handleAddReview} className="space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">שם הממליץ</label>
                              <input type="text" required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                  value={newReview.name} onChange={e => setNewReview({...newReview, name: e.target.value})} placeholder="ישראל ישראלי" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד (אופציונלי)</label>
                              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                  value={newReview.role} onChange={e => setNewReview({...newReview, role: e.target.value})} placeholder="מנכ'ל" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">חברה (אופציונלי)</label>
                              <input type="text" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                  value={newReview.company} onChange={e => setNewReview({...newReview, company: e.target.value})} placeholder="אלביט מערכות" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">תוכן ההמלצה</label>
                              <textarea required rows="4" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                  value={newReview.text} onChange={e => setNewReview({...newReview, text: e.target.value})} placeholder="היה שירות מצוין..." />
                          </div>
                          <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded font-bold hover:bg-slate-800 transition">שמור המלצה</button>
                      </form>
                  </div>
              </div>

              {/* רשימת המלצות */}
              <div className="lg:col-span-2 space-y-4">
                  {reviews.length === 0 && <div className="text-center text-gray-500 mt-10">אין המלצות עדיין.</div>}
                  {reviews.map(review => (
                      <div key={review._id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-start gap-4">
                          <div>
                              <h4 className="font-bold text-lg">{review.name}</h4>
                              <p className="text-sm text-gray-500 mb-2">{review.role} {review.company && `• ${review.company}`}</p>
                              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">"{review.text}"</p>
                          </div>
                          <button onClick={() => handleDeleteReview(review._id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition" title="מחק">
                              <Trash2 size={20} />
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

    </div>
  );
}

// Helper Components
function TabButton({ active, onClick, icon, label }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${active ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {icon} {label}
        </button>
    );
}

function StatCard({ title, value, color = "text-slate-800" }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
      new: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle, label: 'חדש' },
      in_progress: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: Clock, label: 'בטיפול' },
      done: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle, label: 'טופל' },
      irrelevant: { bg: 'bg-gray-100', text: 'text-gray-500', icon: XCircle, label: 'לא רלוונטי' },
    };
    const current = styles[status] || styles.new;
    const Icon = current.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${current.bg} ${current.text}`}>
        <Icon size={12} /> {current.label}
      </span>
    );
}

function ContentBlock({ title, description, children }) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    );
}

function InputField({ label, value, onChange, onSave, textarea }) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="flex gap-2">
          {textarea ? (
             <textarea className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition min-h-[80px]"
               value={value || ''} onChange={(e) => onChange(e.target.value)} />
          ) : (
             <input type="text" className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition"
               value={value || ''} onChange={(e) => onChange(e.target.value)} />
          )}
          <button onClick={onSave} className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-3 rounded-lg transition"><Save size={20} /></button>
        </div>
      </div>
    );
}