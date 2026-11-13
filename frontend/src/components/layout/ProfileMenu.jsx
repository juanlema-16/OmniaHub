import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, ShieldCheck, UserCircle, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useClickOutside from '../../hooks/useClickOutside';
import { rutaDisponible } from '../../routes/panelConfig';
import { ROLES, necesitaKyc } from '../../utils/constants';
import Avatar from '../ui/Avatar';
import { KycBadge } from '../ui/Badge';

export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const cerrar = useCallback(() => setAbierto(false), []);
  useClickOutside(ref, cerrar, abierto);

  const base = `/${user.role}`;
  const opciones = [
    { to: `${base}/perfil`, label: 'Mi perfil', icon: UserCircle },
    { to: `${base}/billetera`, label: 'Mi billetera', icon: Wallet },
    // Solo quien debe verificar su identidad; el admin revisa la de otros desde su menú de KYC
    ...(necesitaKyc(user.role) ? [{ to: `${base}/kyc`, label: 'Verificación de identidad', icon: ShieldCheck }] : []),
  ].filter((o) => rutaDisponible(user.role, o.to));

  const salir = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-slate-100"
        aria-expanded={abierto}
        aria-label="Menú de perfil"
      >
        <Avatar nombre={user.nombre} apellido={user.apellido} src={user.avatar} size="sm" />
        <span className="hidden text-left md:block">
          <span className="block max-w-[9rem] truncate text-sm font-medium text-slate-900">{user.nombre}</span>
          <span className="block text-xs text-slate-500">{ROLES[user.role]?.label}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" aria-hidden="true" />
      </button>

      {abierto && (
        <div className="absolute right-0 top-12 z-40 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {user.nombre} {user.apellido}
            </p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
            {necesitaKyc(user.role) && (
              <div className="mt-2">
                <KycBadge status={user.kyc?.status} />
              </div>
            )}
          </div>
          <div className="py-1">
            {opciones.map((o) => (
              <Link key={o.to} to={o.to} onClick={cerrar} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <o.icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                {o.label}
              </Link>
            ))}
            <button type="button" onClick={salir} className="flex w-full items-center gap-3 px-4 py-2 text-sm text-danger hover:bg-red-50">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
