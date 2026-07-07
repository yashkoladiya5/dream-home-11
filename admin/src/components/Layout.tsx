import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ShieldCheck,
  Settings,
  HeadphonesIcon,
  Bell,
  ClipboardList,
  LogOut,
  Menu,
  X,
  DollarSign,
  Award,
  Home,
  Image,
  AlertTriangle,
  Siren,
  Banknote,
  Gift,
  Share2,
  Vote,
  FileText,
} from 'lucide-react';
import { getStoredUser, logout } from '@/lib/auth';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/contests', label: 'Contests', icon: Trophy },
  { to: '/prize-homes', label: 'Prize Homes', icon: Home },
  { to: '/banners', label: 'Banners', icon: Image },
  { to: '/leaderboard', label: 'Leaderboard', icon: Award },
  { to: '/kyc', label: 'KYC', icon: ShieldCheck },
  { to: '/config', label: 'Config', icon: Settings },
  { to: '/support', label: 'Support', icon: HeadphonesIcon },
  { to: '/warnings', label: 'Warnings', icon: AlertTriangle },
  { to: '/fraud', label: 'Fraud', icon: Siren },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/compensations', label: 'Compensations', icon: DollarSign },
  { to: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { to: '/payments', label: 'Payments', icon: Banknote },
  { to: '/withdrawals', label: 'Withdrawals', icon: DollarSign },
  { to: '/rewards', label: 'Rewards', icon: Gift },
  { to: '/referrals', label: 'Referrals', icon: Share2 },
  { to: '/polls', label: 'Polls', icon: Vote },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getStoredUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0b0f19]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950/70 border-r border-slate-900 backdrop-blur-xl flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top brand header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-900/60">
          <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-lg shadow-brand-500/20 brand-glow">
              <img src="/logo.svg" alt="D11" className="w-6 h-6 invert" />
            </div>
            <div className="flex flex-col">
              <span className="text-md font-bold text-white tracking-tight leading-tight">
                Dream Home <span className="text-brand-500">11</span>
              </span>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-0.5">Admin Console</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/40 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} className="shrink-0 transition-transform group-hover:scale-105" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Profile Card and Logout */}
        <div className="border-t border-slate-900/60 p-4 bg-slate-950/20">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-slate-900/20 border border-slate-900/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name || 'Administrator'}</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{user?.role || 'admin'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800/60 hover:border-rose-500/25 transition-all duration-300 shrink-0"
              title="Logout"
            >
              <LogOut size={13} />
            </button>
          </div>
          <p className="text-center text-[9px] text-slate-600 font-bold tracking-widest pt-3 uppercase">V1.2.0 PREMIUM</p>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Floating Glass Top Bar */}
        <header className="h-20 bg-slate-950/40 border-b border-slate-900/60 flex items-center justify-between px-6 shrink-0 z-20 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800/30 transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:block text-slate-500 text-xs font-medium tracking-wide">
            SYSTEM STATUS: <span className="text-emerald-500 font-semibold">● OPERATIONAL</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-semibold text-slate-300">{user?.name || 'Admin'}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{user?.role || 'Administrator'}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 text-sm font-semibold shadow-md">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0b0f19]/30">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
