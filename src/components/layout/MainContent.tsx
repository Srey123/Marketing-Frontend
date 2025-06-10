// src/app/MainContent.tsx
"use client";

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Routes, Route, Navigate } from 'react-router-dom';



import DashboardSection from '@/components/sections/Dashboard';
import SEOScoreSection from '@/components/sections/SEOScoreSection';
import IterationsSection from '@/components/sections/IterationsSection';
import BlogDetailPage from '@/components/pages/blogpage';




const MainContent = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out"
      )}
    >
      <Routes>
        {/* Option 1: If /login should just redirect to /dashboard (which then handles login via modal) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} /> {/* Redirect to dashboard */}


        {/* Option 2 (Recommended for a cleaner /login URL):
            Create a simple LoginPage component that uses useAuth().openLoginModal()
            when a user clicks a "Login" button.
            Then, you would use: <Route path="/login" element={<LoginPage />} />
        */}
        {/* For now, we'll use Option 1 to get rid of the error. */}


        <Route path="/dashboard" element={<DashboardSection />} />
        <Route path="/dashboard/seo" element={<SEOScoreSection />} />
        <Route path="/dashboard/iterations" element={<IterationsSection />} />

        <Route path="/dashboard/blog/:id" element={<BlogDetailPage />} />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </main>
  );
};

export default MainContent;