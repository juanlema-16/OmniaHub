import { useEffect, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { getProductReviews } from '../../api/reviews';
import { getErrorMessage } from '../../api/axios';
import Estrellas from '../ui/Estrellas';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import Alert from '../ui/Alert';
import { formatFecha } from '../../utils/dates';
import { plural } from '../../utils/plural';

const LOTE = 5;

// Resumen con distribución y lista de reseñas visibles de un producto (tienda pública y catálogo)
export default function ResenasProducto({ productId }) {
  const [items, setItems] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [pagina, setPagina] = useState(1);
  const [pages, setPages] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    getProductReviews(productId, { page: pagina, limit: LOTE })
      .then((data) => {
        if (cancelado) return;
        setItems((anteriores) => (pagina === 1 ? data.items : [...anteriores, ...data.items]));
        setResumen(data.resumen);
        setPages(data.pages);
        setError('');
      })
      .catch((err) => !cancelado && setError(getErrorMessage(err)))
      .finally(() => !cancelado && setCargando(false));
    return () => {
      cancelado = true;
    };
  }, [productId, pagina]);

  useEffect(() => {
    setItems([]);
    setPagina(1);
  }, [productId]);

  return (
    <section aria-labelledby="titulo-resenas" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 id="titulo-resenas" className="text-lg font-semibold text-slate-900">
        Reseñas de clientes
      </h2>
      {error && <Alert tone="error" className="mt-3">{error}</Alert>}
      {cargando && !resumen && <Skeleton className="mt-4 h-24 w-full" />}

      {resumen && resumen.cantidad === 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          <MessageSquareText className="h-5 w-5 text-slate-400" aria-hidden="true" /> Este producto aún no tiene reseñas. Solo pueden calificarlo quienes ya recibieron su pedido.
        </div>
      )}

      {resumen && resumen.cantidad > 0 && (
        <>
          <div className="mt-4 grid gap-6 sm:grid-cols-[10rem_1fr] sm:items-center">
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-slate-900">{resumen.promedio.toFixed(1)}</p>
              <Estrellas valor={resumen.promedio} size="h-5 w-5" />
              <p className="mt-1 text-sm text-slate-500">{plural(resumen.cantidad, 'reseña')}</p>
            </div>
            <ul className="space-y-1.5" aria-label="Distribución de calificaciones">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-20 shrink-0 whitespace-nowrap">{n} {n === 1 ? 'estrella' : 'estrellas'}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(resumen.distribucion[n] / resumen.cantidad) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right">{resumen.distribucion[n]}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="mt-6 divide-y divide-slate-100">
            {items.map((r) => (
              <li key={r._id} className="py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Estrellas valor={r.rating} />
                  <span className="text-sm font-semibold text-slate-800">{r.autor}</span>
                  <span className="text-xs text-slate-400">{formatFecha(r.createdAt)}</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600">{r.comentario}</p>
              </li>
            ))}
          </ul>
          {pagina < pages && (
            <div className="mt-2 text-center">
              <Button variant="secondary" loading={cargando} onClick={() => setPagina((p) => p + 1)}>
                Ver más reseñas
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
