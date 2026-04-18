import { NavLink } from 'react-router-dom';
import { TrendingUp, LayoutDashboard, CreditCard, ArrowUpFromLine, BarChart2, Bot, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/markets', icon: BarChart2, label: 'Markets' },
  { to: '/deposit', icon: CreditCard, label: 'Deposit' },
  { to: '/withdraw', icon: ArrowUpFromLine, label: 'Withdraw' },
  { to: '/ai-trade', icon: Bot, label: 'AI Trade' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo"><TrendingUp size={22} /></div>
        <span>CoinPilot</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-logout" onClick={() => supabase.auth.signOut()}>
        <LogOut size={18} /><span>Sign Out</span>
      </button>
    </aside>
  );
}
