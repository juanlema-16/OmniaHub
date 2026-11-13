import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { getPolicy, listPolicies } from '../../api/public';
import PoliticaVista from '../../components/admin/PoliticaVista';
import Skeleton from '../../components/ui/Skeleton';
import Alert from '../../components/ui/Alert';
import { formatFecha } from '../../utils/dates';

export default function PoliticaPage() {
  const { slug } = useParams();
  const politica = useAsync(() => getPolicy(slug), [slug]);
  const lista = useAsync(listPolicies, []);

  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[14rem_1fr]">
      <aside>
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al inicio
        </Link>
        <nav aria-label="Políticas">
          <ul className="space-y-1">
            {(lista.data || []).map((p) => (
              <li key={p.slug}>
                <Link
                  to={`/politicas/${p.slug}`}
                  aria-current={p.slug === slug ? 'page' : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm ${p.slug === slug ? 'bg-primary-50 font-semibold text-primary' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {p.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {politica.cargando && !politica.data && <Skeleton className="h-64 w-full" />}
        {politica.error && <Alert tone="error">{politica.error}</Alert>}
        {politica.data && (
          <>
            <PoliticaVista titulo={politica.data.titulo} contenido={politica.data.contenido} />
            <p className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">Última actualización: {formatFecha(politica.data.actualizadoEn)}</p>
          </>
        )}
      </div>
    </div>
  );
}
