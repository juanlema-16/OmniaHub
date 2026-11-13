import { Store } from 'lucide-react';

// Logo y nombre de la tienda donde se hizo una orden, para las tablas del cliente
export default function TiendaCelda({ tienda }) {
  return (
    <div className="flex max-w-48 items-center gap-2.5">
      {tienda?.logo ? (
        <img src={tienda.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg border border-slate-200 object-cover" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <Store className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
      <span className="truncate text-slate-800">{tienda?.nombre || 'Tienda'}</span>
    </div>
  );
}
