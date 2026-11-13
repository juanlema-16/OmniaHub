import { Link } from 'react-router-dom';
import { ArrowRight, Package, Store } from 'lucide-react';
import { ResumenEstrellas } from '../ui/Estrellas';
import { plural } from '../../utils/plural';

// Tarjeta de una tienda del directorio. "accion" cambia el texto del botón ("Visitar tienda" o "Seguir comprando").
export default function TiendaCard({ tienda, accion = 'Visitar tienda', detalle }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        {tienda.logo ? (
          <img src={tienda.logo} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary">
            <Store className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">{tienda.nombre}</h3>
          <ResumenEstrellas rating={tienda.rating} />
        </div>
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Package className="h-4 w-4 text-slate-400" aria-hidden="true" /> {plural(tienda.productos, 'producto')}
      </p>
      {detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>}
      <Link
        to={`/tienda/${tienda.slug}`}
        className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {accion} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}
