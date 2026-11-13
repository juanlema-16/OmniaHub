import { Link } from 'react-router-dom';
import useAsync from '../../hooks/useAsync';
import { listPolicies } from '../../api/public';
import Logo from '../ui/Logo';

export default function PublicFooter() {
  const { data } = useAsync(listPolicies, []);
  const politicas = data || [];

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-slate-500">El centro donde proveedores, emprendedores y transportadoras se conectan para vender.</p>
        </div>
        <nav aria-label="Plataforma">
          <p className="text-sm font-semibold text-slate-900">Plataforma</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link to="/registro" className="hover:text-primary">
                Crear cuenta
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-primary">
                Iniciar sesión
              </Link>
            </li>
            <li>
              <Link to="/tienda/tienda-demo" className="hover:text-primary">
                Ver una tienda de ejemplo
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Políticas">
          <p className="text-sm font-semibold text-slate-900">Políticas</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {politicas.map((p) => (
              <li key={p.slug}>
                <Link to={`/politicas/${p.slug}`} className="hover:text-primary">
                  {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} OmniaHub · Hecho para Guatemala</div>
    </footer>
  );
}
