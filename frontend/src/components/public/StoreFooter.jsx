import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { listPolicies } from '../../api/public';
import { LogoMark } from '../ui/Logo';

// Pie de la tienda pública: políticas y crédito a la plataforma que la respalda
export default function StoreFooter({ tienda }) {
  const { data } = useAsync(listPolicies, []);
  const politicas = data || [];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          {tienda?.nombre && <p className="text-sm font-semibold text-slate-900">{tienda.nombre}</p>}
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} · Todos los derechos reservados</p>
        </div>
        <nav aria-label="Políticas" className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
          {politicas.map((p) => (
            <Link key={p.slug} to={`/politicas/${p.slug}`} className="hover:text-primary">
              {p.titulo}
            </Link>
          ))}
        </nav>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary">
          <LogoMark className="h-5 w-5 text-primary" />
          <span>
            Con tecnología de <span className="font-semibold text-slate-700">OmniaHub</span>
          </span>
        </Link>
      </div>
    </footer>
  );
}
