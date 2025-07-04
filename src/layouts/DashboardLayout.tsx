import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Help from '../components/Help';

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#EEF2FF]">
      {/* Sidebar with overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      
      <div className={`
        fixed lg:static lg:flex flex-col w-64 min-h-screen z-30 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#EEF2FF]">
          <Outlet />
        </main>
        <footer className="bg-[#1E3A8A] text-white p-4 text-center text-sm">
          © Home & Own 2025. All Rights Reserved
        </footer>
      </div>
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
        <Help />
      </div>
    </div>
  );
};

export default DashboardLayout;