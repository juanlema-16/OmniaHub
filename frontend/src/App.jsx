import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute, { PublicOnlyRoute } from './routes/ProtectedRoute';
import { PANELES, rutasDe } from './routes/panelConfig';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import VerifyEmailPage from './pages/public/VerifyEmailPage';
import NotFoundPage from './pages/public/NotFoundPage';
import PageLoader from './components/ui/PageLoader';
import { homeFor } from './utils/constants';

// Mientras no exista la landing (Prompt 12), la raíz lleva al login o al panel
function Inicio() {
  const { autenticado, user, cargando } = useAuth();
  if (cargando && !user) return <PageLoader />;
  return <Navigate to={autenticado ? homeFor(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/registro" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
      <Route path="/verificar-correo" element={<PublicOnlyRoute><VerifyEmailPage /></PublicOnlyRoute>} />

      {Object.keys(PANELES).map((role) => (
        <Route
          key={role}
          path={`/${role}`}
          element={
            <ProtectedRoute roles={[role]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {rutasDe(role).map((r) => (r.path ? <Route key={r.path} path={r.path} element={r.element} /> : <Route key="index" index element={r.element} />))}
          <Route path="*" element={<Navigate to={`/${role}`} replace />} />
        </Route>
      ))}

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
