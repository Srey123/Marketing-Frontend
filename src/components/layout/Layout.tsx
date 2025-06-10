// src/app/layout.tsx
"use client";

// Removed useState as activeSection is no longer managed here
// import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MainContent from './MainContent';

import { AuthModalProvider } from '../../components/auth/auth_model';
import { Toaster } from '@/components/ui/toaster';

const Layout = () => {
  // Removed sidebarAlwaysOpen and activeSection state as they are no longer used for MainContent
  // const sidebarAlwaysOpen = true;
  // const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <AuthModalProvider>
      <div className="h-screen flex flex-col">
        <Navbar />

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar no longer needs specific props if its content is driven by React Router */}
          {/* If Sidebar still needs 'open' or 'activeSection', you will need to keep
              those states and props, and define them in Sidebar.tsx as well.
              For now, simplifying as per the MainContent change. */}
          <Sidebar
          // open={sidebarAlwaysOpen} // Remove if Sidebar doesn't use it or manages its own state
          // activeSection={activeSection} // Remove if Sidebar doesn't use it or manages its own state
          // setActiveSection={setActiveSection} // Remove if Sidebar doesn't use it
          />

          {/* MainContent now gets its content from React Router DOM, so these props are removed */}
          <MainContent
          // activeSection={activeSection} // REMOVED
          // sidebarOpen={sidebarAlwaysOpen} // REMOVED
          />
        </div>
      </div>
      <Toaster />
    </AuthModalProvider>
  );
};

export default Layout;