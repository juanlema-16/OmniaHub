import { useCallback, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import useNotifications from '../../hooks/useNotifications';
import useClickOutside from '../../hooks/useClickOutside';
import { rutaDisponible } from '../../routes/panelConfig';
import { formatRelativa } from '../../utils/dates';
import { NOTIFICATION_TONE } from '../../utils/constants';
import { DOT } from '../ui/Badge';
import Skeleton from '../ui/Skeleton';

export default function NotificationBell({ role }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { noLeidas, items, cargando, cargarUltimas, marcarLeida, marcarTodas } = useNotifications();
  const cerrar = useCallback(() => setAbierto(false), []);
  useClickOutside(ref, cerrar, abierto);

  const alternar = () => {
    if (!abierto) cargarUltimas();
    setAbierto((v) => !v);
  };

  const abrir = async (n) => {
    if (!n.leida) await marcarLeida(n._id);
    if (rutaDisponible(role, n.link)) {
      setAbierto(false);
      navigate(n.link);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={alternar}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label={noLeidas ? `Notificaciones: ${noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={abierto}
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-12 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            {noLeidas > 0 && (
              <button type="button" onClick={marcarTodas} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover">
                <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
              </button>
            )}
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {cargando && items.length === 0 &&
              [1, 2, 3].map((i) => (
                <li key={i} className="space-y-2 px-4 py-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full" />
                </li>
              ))}
            {!cargando && items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">No tienes notificaciones</li>}
            {items.map((n) => (
              <li key={n._id}>
                <button type="button" onClick={() => abrir(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.leida ? '' : 'bg-primary-50/40'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.leida ? 'bg-transparent' : DOT[NOTIFICATION_TONE[n.tipo] || 'indigo']}`} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className={`block text-sm ${n.leida ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titulo}</span>
                    <span className="mt-0.5 block text-xs text-slate-500">{n.mensaje}</span>
                    <span className="mt-1 block text-[11px] text-slate-400">{formatRelativa(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link to={`/${role}/notificaciones`} onClick={cerrar} className="block border-t border-slate-100 px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-slate-50">
            Ver todas
          </Link>
        </div>
      )}
    </div>
  );
}
