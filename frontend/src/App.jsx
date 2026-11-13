import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute, { PublicOnlyRoute } from './routes/ProtectedRoute';
import { PANELES, rutasDe } from './routes/panelConfig';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import VerifyEmailPage from './pages/public/VerifyEmailPage';
import NotFoundPage from './pages/public/NotFoundPage';
import LandingPage from './pages/public/LandingPage';
import PoliticaPage from './pages/public/PoliticaPage';
import PublicLayout from './components/public/PublicLayout';
import StoreLayout from './components/public/StoreLayout';
import TiendaPage from './pages/store/TiendaPage';
import ProductoPage from './pages/store/ProductoPage';
import CarritoPage from './pages/store/CarritoPage';
import CheckoutPage from './pages/store/CheckoutPage';
import PedidoConfirmadoPage from './pages/store/PedidoConfirmadoPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/politicas/:slug" element={<PoliticaPage />} />
      </Route>

      <Route path="/tienda/:slug" element={<StoreLayout />}>
        <Route index element={<TiendaPage />} />
        <Route path="producto/:productId" element={<ProductoPage />} />
        <Route path="carrito" element={<CarritoPage />} />
        <Route path="pagar" element={<CheckoutPage />} />
        <Route path="pedido/:id" element={<PedidoConfirmadoPage />} />
      </Route>

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
