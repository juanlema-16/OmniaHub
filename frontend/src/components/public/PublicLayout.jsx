import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';
import CookieBanner from './CookieBanner';

const ENLACES = [
  { href: '/#como-funciona', label: 'Cómo funciona' },
  { href: '/#beneficios', label: 'Beneficios' },
];

// Landing y páginas de políticas
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicNavbar enlaces={ENLACES} />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <CookieBanner />
    </div>
  );
}
