import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import type { User } from "@supabase/supabase-js";

interface AppLayoutProps {
  children: React.ReactNode;
  session: User;
  currentView: "dashboard" | "settings";
  onNavigate: (view: "dashboard" | "settings") => void;
  loading: boolean;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  session,
  currentView,
  onNavigate,
  loading,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for mobile sidebar

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar
        user={session}
        currentView={currentView}
        onNavigate={onNavigate}
        loading={loading}
        onToggleSidebar={toggleSidebar} // Pass toggle function
      />
      <div className="flex flex-1 overflow-hidden">
        {" "}
        {/* Use overflow-hidden here */}
        <Sidebar
          currentView={currentView}
          onNavigate={onNavigate}
          isOpen={isSidebarOpen} // Control visibility
          onClose={() => setIsSidebarOpen(false)} // Allow closing via overlay click
        />
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          {" "}
          {/* Allow content to scroll */}
          {children} {/* Render the current page content */}
        </main>
      </div>
      {/* Footer is now included */}
      <Footer />
    </div>
  );
};

export default AppLayout;
