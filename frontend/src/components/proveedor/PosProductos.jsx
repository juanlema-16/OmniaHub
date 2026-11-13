import { useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { listMyProducts } from '../../api/products';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';
import Alert from '../ui/Alert';
import { formatQ } from '../../utils/formatQ';

// Buscador y cuadrícula de productos propios activos para agregar al carrito
export default function PosProductos({ enCarrito, onAdd, version }) {
  const [texto, setTexto] = useState('');
  const search = useDebounce(texto, 300);
  const [page, setPage] = useState(1);
  const { data, cargando, error } = useAsync(() => listMyProducts({ search: search || undefined, activo: true, page, limit: 12 }), [search, page, version]);

  useEffect(() => setPage(1), [search]);

  return (
    <Card title="Productos" padding={false}>
      <div className="border-b border-slate-100 p-4">
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por nombre o SKU"
          aria-label="Buscar productos"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>
      <div className="p-4">
        {error && <Alert tone="error">{error}</Alert>}
        {cargando && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        )}
        {!cargando && data && data.items.length === 0 && <EmptyState icon={PackageSearch} title="No hay productos" description={search ? 'Prueba con otra búsqueda.' : 'Publica productos para venderlos en caja.'} compact />}
        {!cargando && data && data.items.length > 0 && (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {data.items.map((p) => {
              const cantidad = enCarrito[p._id] || 0;
              const sinStock = p.stock <= 0;
              const tope = cantidad >= p.stock;
              return (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => onAdd(p)}
                    disabled={sinStock || tope}
                    className="group relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Agregar ${p.nombre} al carrito`}
                  >
                    <img src={p.imagenes?.[0]} alt="" loading="lazy" className="aspect-square w-full bg-slate-50 object-cover" />
                    {cantidad > 0 && <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">{cantidad}</span>}
                    <span className="flex flex-1 flex-col gap-0.5 p-2.5">
                      <span className="line-clamp-2 text-xs font-medium text-slate-900">{p.nombre}</span>
                      <span className="mt-auto text-sm font-bold text-slate-900">{formatQ(p.precioSugerido)}</span>
                      <span className={`text-xs ${sinStock ? 'font-semibold text-danger' : p.stock <= p.stockMinimo ? 'text-warning' : 'text-slate-500'}`}>{sinStock ? 'Agotado' : `Stock ${p.stock}`}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
          <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || cargando} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
            Anterior
          </button>
          <span>
            Página {data.page} de {data.pages}
          </span>
          <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page >= data.pages || cargando} className="rounded-lg border border-slate-300 px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40">
            Siguiente
          </button>
        </div>
      )}
    </Card>
  );
}
