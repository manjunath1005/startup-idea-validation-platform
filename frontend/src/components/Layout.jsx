import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, PlusCircle, User, LogOut, Lightbulb, Menu, X } from 'lucide-react';

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
    <div className="flex min-h-screen bg-brand-950 text-slate-100 overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none z-0"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-panel m-4 mr-0 rounded-2xl border-r border-slate-800/50 z-10 shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800/40">
          <div className="w-10 h-10 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center justify-center text-sky-400">
            <Lightbulb size={22} className="animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-white block text-sm tracking-wide">IDEA VALIDATOR</span>
            <span className="text-[10px] text-sky-400 font-semibold uppercase tracking-wider">AI Platform</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-sky-500/10 border border-sky-500/30 text-white font-semibold shadow-md shadow-sky-500/5'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800/40 space-y-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-sky-400 border border-slate-700 font-bold">
              {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <span className="text-sm font-medium text-white block truncate">{user?.full_name || 'Founder'}</span>
              <span className="text-[11px] text-slate-500 block truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-300"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
        {/* Top Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-brand-950/20 backdrop-blur-md">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900/60 md:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-white uppercase tracking-wider">
              {location.pathname === '/dashboard'
                ? 'Your Startups'
                : location.pathname === '/submit'
                ? 'Create New Validation'
                : 'Concept Report'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs text-slate-400 block">Workspace</span>
              <span className="text-xs text-sky-400 font-medium">Personal Account</span>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
            <div className="absolute top-0 left-0 bottom-0 w-64 bg-brand-950 border-r border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <Lightbulb size={24} className="text-sky-400" />
                    <span className="font-bold text-white text-sm">IDEA VALIDATOR</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                    <X size={20} />
                  </button>
                </div>
                <nav className="py-6 space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-sky-500/10 text-white'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900/40'
                        }`}
                      >
                        <Icon size={18} />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center font-bold text-sky-400 text-sm">
                    {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">{user?.full_name || 'Founder'}</span>
                    <span className="text-[10px] text-slate-500 block">{user?.email}</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <LogOut size={16} />
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
