import { Link, Outlet, useParams } from 'react-router-dom';
import { ShoppingCart, Store, UserRound } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { getStore } from '../../api/store';
import { homeFor } from '../../utils/constants';
import PublicFooter from './PublicFooter';
import CookieBanner from './CookieBanner';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

// Encabezado y pie comunes de /tienda/:slug. Comparte los datos de la tienda con sus páginas.
export default function StoreLayout() {
  const { slug } = useParams();
  const { autenticado, user } = useAuth();
  const { cantidad } = useCart(slug);
  const { data, cargando, error } = useAsync(() => getStore(slug, { limit: 1 }), [slug]);
  const tienda = data?.tienda;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link to={`/tienda/${slug}`} className="flex min-w-0 items-center gap-3" aria-label="Ir al inicio de la tienda">
            {tienda?.logo ? (
              <img src={tienda.logo} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
                <Store className="h-5 w-5" aria-hidden="true" />
              </span>
            )}
            {cargando && !tienda ? <Skeleton className="h-5 w-32" /> : <span className="truncate text-lg font-bold text-slate-900">{tienda?.nombre || 'Tienda'}</span>}
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {autenticado ? (
              <Link to={homeFor(user.role)} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <UserRound className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Mi cuenta</span>
              </Link>
            ) : (
              <Link to="/login" state={{ from: `/tienda/${slug}` }} className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Iniciar sesión
              </Link>
            )}
            <Link
              to={`/tienda/${slug}/carrito`}
              className="relative inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-white hover:bg-primary-hover"
              aria-label={`Carrito, ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Carrito</span>
              {cantidad > 0 && <span className="rounded-full bg-white px-1.5 text-xs font-bold text-primary">{cantidad}</span>}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {error ? (
          <div className="mx-auto max-w-lg py-20">
            <EmptyState
              icon={Store}
              title="Esta tienda no está disponible"
              description={error}
              action={
                <Link to="/" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
                  Ir a OmniaHub
                </Link>
              }
            />
          </div>
        ) : (
          <Outlet context={{ tienda, slug }} />
        )}
      </main>
      <PublicFooter />
      <CookieBanner />
    </div>
  );
}
