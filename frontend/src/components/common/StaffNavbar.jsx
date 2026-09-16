import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlert } from '../../context/AlertContext';
import { Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'; 

const navItems = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )},
  { id: 'medicines', label: 'Medicines', path: '/medicines', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  )},
  { id: 'sales', label: 'Point of Sale', path: '/sales', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )},
  { id: 'sales-history', label: 'Sales History', path: '/sales/history', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  )},
  { id: 'online-orders', label: 'Online Orders', path: '/online-orders', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )},
  { id: 'reports', label: 'Reports', path: '/reports', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )},
  /* { id: 'dead-stock', label: 'Dead Stock', path: '/dead-stock', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )}, */
  { id: 'smart-replenishment', label: 'Replenishment', path: '/smart-replenishment', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )},
  { id: 'expiry-intelligence', label: 'Expiry', path: '/expiry-intelligence', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )},
  { id: 'admin', label: 'Admin', path: '/admin', icon: (
    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )},
];

const StaffNavbar = ({ activePage }) => {
  const navigate = useNavigate();
  const { showConfirm } = useAlert();
  
  // Mobile overlay state
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // Desktop collapse state
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Determine the class based on collapse state
    const className = isCollapsed ? 'has-sidebar-collapsed' : 'has-sidebar';
    document.body.classList.add(className);
    return () => {
      document.body.classList.remove(className);
    };
  }, [isCollapsed]);

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to logout from Medi-Flow?', 'Confirm Logout', 'Logout');
    if (confirmed) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const sidebarWidthClass = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Top Bar (Only visible on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src="/logo.png" alt="MediFlow" className="h-8 w-auto" onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50?text=MF'; }} />
        </div>
        <button onClick={toggleMobileSidebar} className="p-2 text-slate-500 hover:text-slate-700 focus:outline-none">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 transition-opacity" 
          onClick={toggleMobileSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 flex flex-col z-50 transform transition-all duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 ' + sidebarWidthClass}
        `}
      >
        <div className="h-20 flex items-center justify-between border-b border-slate-200 px-4">
          <div 
            className={`flex items-center cursor-pointer overflow-hidden transition-all duration-300 ${isCollapsed && !isMobileOpen ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100 block'}`}
            onClick={() => { navigate('/dashboard'); setIsMobileOpen(false); }}
          >
            <img 
              src="/logo.png" 
              alt="MediFlow" 
              className="h-8 w-auto transition-transform hover:scale-105" 
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x50?text=MF'; }} 
            />
          </div>
          
          {/* Desktop Toggle Button (Hamburger) */}
          <button 
            onClick={toggleCollapse} 
            className="hidden lg:flex p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg focus:outline-none mx-auto"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar py-4 space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                title={isCollapsed ? item.label : ''}
                onClick={() => { navigate(item.path); setIsMobileOpen(false); }}
                className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-inset ring-primary-500/20' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                } ${isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'}`}
              >
                {item.icon}
                <span 
                  className={`font-bold text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                    isCollapsed && !isMobileOpen ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Logout" : ""}
            className={`w-full flex items-center p-3 border border-slate-200 rounded-xl shadow-sm font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
              isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span 
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed && !isMobileOpen ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default StaffNavbar;
