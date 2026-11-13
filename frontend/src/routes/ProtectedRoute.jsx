import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { homeFor } from '../utils/constants';
import PageLoader from '../components/ui/PageLoader';

// Sin sesión → login (y vuelve aquí después). Con otro rol → a su propio panel.
export default function ProtectedRoute({ roles, children }) {
  const { autenticado, user, cargando } = useAuth();
  const location = useLocation();

  if (cargando && !user) return <PageLoader />;
  if (!autenticado) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

// Login, registro y verificación: si ya hay sesión, directo al panel (o, siendo cliente, de vuelta a la tienda)
export function PublicOnlyRoute({ children }) {
  const { autenticado, user } = useAuth();
  const location = useLocation();
  if (autenticado) {
    const volver = location.state?.from;
    const aTienda = user.role === 'cliente' && typeof volver === 'string' && volver.startsWith('/tienda/');
    return <Navigate to={aTienda ? volver : homeFor(user.role)} replace />;
  }
  return children;
}
