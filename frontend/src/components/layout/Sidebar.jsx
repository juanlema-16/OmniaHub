import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import Logo from '../ui/Logo';
import { menuDe } from '../../routes/panelConfig';
import { ROLES } from '../../utils/constants';

function Contenido({ role, onNavigate }) {
  const items = menuDe(role);
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Menú principal">
      {items.map((item, i) => {
        const nuevaSeccion = item.section && item.section !== items[i - 1]?.section;
        return (
          <div key={item.path}>
            {nuevaSeccion && i > 0 && (
              <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{item.section}</p>
            )}
            <NavLink
              to={`/${role}${item.path ? `/${item.path}` : ''}`}
              end={!item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-50 text-primary' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          </div>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ role, abierto, onClose }) {
  return (
    <>
      {/* Escritorio: fijo */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <Logo />
        </div>
        <Contenido role={role} />
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">Panel de {ROLES[role]?.label.toLowerCase()}</p>
      </aside>

      {/* Móvil: cajón con fondo */}
      <div className={`fixed inset-0 z-40 lg:hidden ${abierto ? '' : 'pointer-events-none'}`} aria-hidden={!abierto}>
        <div className={`absolute inset-0 bg-slate-900/50 transition-opacity ${abierto ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
        <aside
          className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl transition-transform ${abierto ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <Logo />
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>
          <Contenido role={role} onNavigate={onClose} />
        </aside>
      </div>
    </>
  );
}
