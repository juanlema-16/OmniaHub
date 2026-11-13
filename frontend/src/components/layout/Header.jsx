import { Link } from 'react-router-dom';
import { Menu, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { rutaDisponible } from '../../routes/panelConfig';
import { tieneBilletera } from '../../utils/constants';
import { formatQ } from '../../utils/formatQ';
import HeaderSearch from './HeaderSearch';
import NotificationBell from './NotificationBell';
import ProfileMenu from './ProfileMenu';

function Saldo({ role, wallet }) {
  if (!tieneBilletera(role) || !wallet) return null;
  const contenido = (
    <>
      <Wallet className="h-4 w-4 text-primary" aria-hidden="true" />
      <span className="text-sm font-semibold text-slate-900">{formatQ(wallet.saldoDisponible)}</span>
    </>
  );
  const clase = 'flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5';
  const ruta = `/${role}/billetera`;
  return rutaDisponible(role, ruta) ? (
    <Link to={ruta} className={`${clase} hover:border-primary-100 hover:bg-primary-50`} title="Saldo disponible">
      {contenido}
    </Link>
  ) : (
    <span className={clase} title="Saldo disponible">
      {contenido}
    </span>
  );
}

export default function Header({ onMenu }) {
  const { user, wallet } = useAuth();
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button type="button" onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú">
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden flex-1 sm:block">
        <HeaderSearch />
      </div>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Saldo role={user.role} wallet={wallet} />
        <NotificationBell role={user.role} />
        <ProfileMenu />
      </div>
    </header>
  );
}
