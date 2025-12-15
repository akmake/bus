import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

import Layout from '@/components/layout/Layout';
import HomePage from '@/pages/HomePage';
import AdminPage from '@/pages/AdminPage';
import LoginPage from '@/pages/LoginPage'; // <--- הדף החדש
import ProtectedRoute from '@/components/auth/ProtectedRoute'; // <--- השומר

// Legal Pages
import TermsPage from '@/pages/legal/TermsPage';
import PrivacyPage from '@/pages/legal/PrivacyPage';
import AccessibilityPage from '@/pages/legal/AccessibilityPage';

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        
        {/* נתיבים משפטיים */}
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="accessibility" element={<AccessibilityPage />} />

        {/* דף כניסה - פתוח לכולם */}
        <Route path="login" element={<LoginPage />} />
        
        {/* דף ניהול - מוגן! */}
        <Route 
          path="admin" 
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } 
        />
      </Route>
    </Routes>
  );
}

export default App;