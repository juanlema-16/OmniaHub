import { Link } from 'react-router-dom';
import { Check, ShoppingCart } from 'lucide-react';
import { formatQ } from '../../utils/formatQ';

export default function ProductoTienda({ slug, producto, enCarrito, onAgregar }) {
  const agotado = !producto.disponible;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/tienda/${slug}/producto/${producto._id}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <img src={producto.imagenes?.[0]} alt={producto.nombre} loading="lazy" className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${agotado ? 'opacity-50' : ''}`} />
        {agotado && <span className="absolute left-3 top-3 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">Agotado</span>}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {producto.categoria && <p className="text-xs font-medium text-primary">{producto.categoria.nombre}</p>}
        <Link to={`/tienda/${slug}/producto/${producto._id}`} className="mt-0.5 line-clamp-2 font-semibold text-slate-900 hover:text-primary">
          {producto.nombre}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <p className="text-xl font-bold text-slate-900">{formatQ(producto.precio)}</p>
          <button
            type="button"
            disabled={agotado}
            onClick={() => onAgregar(producto)}
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {enCarrito ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
            {enCarrito ? 'En carrito' : 'Agregar'}
          </button>
        </div>
      </div>
    </article>
  );
}
