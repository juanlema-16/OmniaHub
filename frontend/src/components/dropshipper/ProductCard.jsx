import { ResumenEstrellas } from '../ui/Estrellas';
import { Link } from 'react-router-dom';
import { BadgeCheck, Check, Send, Store } from 'lucide-react';
import BotonFavorito from './BotonFavorito';
import { formatQ } from '../../utils/formatQ';

// Tarjeta del catálogo: precio proveedor, sugerido, stock y las dos acciones principales
export default function ProductCard({ producto: p, onImportar, onEnviar, onFavorito }) {
  const agotado = p.stock <= 0;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/dropshipper/catalogo/${p._id}`} className="relative block aspect-square overflow-hidden bg-slate-50">
        <img src={p.imagenes?.[0]} alt={p.nombre} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {p.verificado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verificado
            </span>
          )}
          {p.importado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              <Check className="h-3 w-3" aria-hidden="true" /> En tu tienda
            </span>
          )}
        </div>
      </Link>
      {onFavorito && <BotonFavorito activo={p.favorito} nombre={p.nombre} onClick={() => onFavorito(p)} className="absolute right-2 top-2 z-10" />}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="truncate text-slate-500">{p.categoria?.nombre}</span>
          <span className={`shrink-0 font-semibold ${agotado ? 'text-danger' : p.stockBajo ? 'text-warning' : 'text-success'}`}>{agotado ? 'Agotado' : `Stock ${p.stock}`}</span>
        </div>
        <Link to={`/dropshipper/catalogo/${p._id}`} className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-900 hover:text-primary">
          {p.nombre}
        </Link>
        <div className="mt-1">
          <ResumenEstrellas rating={p.rating} />
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">
          Proveedor: <span className="font-medium text-primary">{p.proveedor?.empresa?.nombre}</span>
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[11px] text-slate-400">Precio proveedor</p>
            <p className="text-sm font-medium text-slate-500">{formatQ(p.precioProveedor)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Precio sugerido</p>
            <p className="text-sm font-bold text-slate-900">{formatQ(p.precioSugerido)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => onEnviar(p)}
            disabled={agotado}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden="true" /> Enviar a cliente
          </button>
          <button
            type="button"
            onClick={() => onImportar(p)}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors ${
              p.importado ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-primary-50 text-primary hover:bg-primary-100'
            }`}
          >
            {p.importado ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" /> En tu tienda · {formatQ(p.storeProduct?.precioVenta)}
              </>
            ) : (
              <>
                <Store className="h-4 w-4" aria-hidden="true" /> Importar a mi tienda
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
