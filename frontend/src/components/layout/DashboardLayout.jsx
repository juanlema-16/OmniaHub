import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import KycBanner from './KycBanner';

export default function DashboardLayout() {
  const { user } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMenuAbierto(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar role={user.role} abierto={menuAbierto} onClose={() => setMenuAbierto(false)} />
      <div className="lg:pl-64">
        <Header onMenu={() => setMenuAbierto(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <KycBanner />
          <Outlet />
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-6 text-xs text-slate-400 sm:px-6 lg:px-8">© {new Date().getFullYear()} OmniaHub · Guatemala</footer>
      </div>
    </div>
  );
}
