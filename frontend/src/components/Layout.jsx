import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, LogOut, Lightbulb, Menu, X } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Validation', path: '/submit', icon: PlusCircle },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/2 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/2 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 z-10 shrink-0">
        {/* Sidebar Header */}
        <div className="p-4 flex items-center gap-2.5 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
            <Lightbulb size={18} />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block text-xs tracking-tight">Idea Validator</span>
            <span className="text-[9px] text-slate-400 font-medium block uppercase tracking-widest -mt-0.5">AI Engine</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-slate-800' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-50/50 border border-slate-100">
            <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 border border-slate-200 text-xs font-semibold uppercase">
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'F'}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-semibold text-slate-800 block truncate leading-none mb-1">
                {user?.full_name || 'Founder'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate leading-none">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 rounded-lg text-slate-550 hover:text-slate-800 hover:bg-slate-100 md:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden md:block">
            <h1 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">
              {location.pathname === '/dashboard'
                ? 'Your Startups'
                : location.pathname === '/submit'
                ? 'Create New Validation'
                : 'Concept Report'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-bold">Workspace</span>
              <span className="text-xs text-blue-600 font-semibold">Personal Account</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm md:hidden">
            <div className="absolute top-0 left-0 bottom-0 w-60 bg-white border-r border-slate-200 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-100">
                      <Lightbulb size={18} />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block leading-none mb-1">Idea Validator</span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest block leading-none">AI Platform</span>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100">
                    <X size={18} />
                  </button>
                </div>

                <nav className="py-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-slate-800' : 'text-slate-400'} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-700 border border-slate-200 text-xs">
                    {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'F'}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-850 block leading-none mb-1">{user?.full_name || 'Founder'}</span>
                    <span className="text-[10px] text-slate-400 block leading-none">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-650 hover:bg-red-50/50 transition-all cursor-pointer"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto p-6 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
