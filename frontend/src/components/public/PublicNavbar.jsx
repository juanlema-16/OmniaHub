import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../utils/constants';
import Logo from '../ui/Logo';

// Barra superior de la parte pública. "enlaces" son anclas de la misma página (landing)
export default function PublicNavbar({ enlaces = [] }) {
  const { autenticado, user } = useAuth();
  const boton = 'inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium transition-colors';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link to="/" aria-label="OmniaHub, ir al inicio">
          <Logo />
        </Link>
        <nav className="ml-4 hidden gap-6 text-sm font-medium text-slate-600 md:flex" aria-label="Secciones">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className="hover:text-primary">
              {e.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {autenticado ? (
            <Link to={homeFor(user.role)} className={`${boton} bg-primary text-white hover:bg-primary-hover`}>
              Ir a mi panel
            </Link>
          ) : (
            <>
              <Link to="/login" className={`${boton} text-slate-700 hover:bg-slate-100`}>
                Iniciar sesión
              </Link>
              <Link to="/registro" className={`${boton} bg-primary text-white shadow-sm hover:bg-primary-hover`}>
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
