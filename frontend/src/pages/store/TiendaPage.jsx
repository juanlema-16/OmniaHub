import { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, PackageSearch, Search, X } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { useCart } from '../../context/CartContext';
import { getStore } from '../../api/store';
import { getCategories } from '../../api/catalog';
import ProductoTienda from '../../components/public/ProductoTienda';
import Select from '../../components/ui/Select';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import { plural } from '../../utils/plural';

const ORDENES = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
];

export default function TiendaPage() {
  const { slug, tienda } = useOutletContext();
  const [params, setParams] = useSearchParams();
  const categoria = params.get('categoria') || '';
  const orden = params.get('orden') || 'recientes';
  const page = Number(params.get('page')) || 1;
  const [texto, setTexto] = useState(() => params.get('q') || '');
  const search = useDebounce(texto, 350);
  const carrito = useCart(slug);

  const cambiar = (cambios) => {
    const siguiente = new URLSearchParams(params);
    Object.entries(cambios).forEach(([k, v]) => (v ? siguiente.set(k, v) : siguiente.delete(k)));
    setParams(siguiente, { replace: true });
  };

  // El texto escrito pasa a la URL y vuelve a la página 1
  useEffect(() => {
    if ((params.get('q') || '') !== search) cambiar({ q: search, page: '' });
  }, [search]);

  const consulta = { search: params.get('q') || undefined, categoria: categoria || undefined, orden, page, limit: 12 };
  const productos = useAsync(() => getStore(slug, consulta), [slug, JSON.stringify(consulta)]);
  const categorias = useAsync(getCategories, []);
  const data = productos.data;
  const hayFiltros = Boolean(params.get('q') || categoria);

  const agregar = (producto) => {
    carrito.agregar(producto, 1);
    toast.success(`${producto.nombre} se agregó al carrito`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-indigo-800 px-6 py-8 text-white sm:px-10">
        <p className="text-sm text-primary-100">Bienvenido a</p>
        <h1 className="text-3xl font-bold tracking-tight">{tienda?.nombre || 'la tienda'}</h1>
        <p className="mt-1 text-primary-100">Paga contra entrega y recibe en cualquier departamento de Guatemala.</p>
      </section>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Buscar productos"
            aria-label="Buscar productos"
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <Select aria-label="Ordenar por" value={orden} onChange={(e) => cambiar({ orden: e.target.value === 'recientes' ? '' : e.target.value, page: '' })} options={ORDENES} className="sm:w-56" />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Categorías">
        {[{ slug: '', nombre: 'Todas' }, ...(categorias.data || [])].map((c) => (
          <button
            key={c.slug || 'todas'}
            type="button"
            aria-pressed={categoria === c.slug}
            onClick={() => cambiar({ categoria: c.slug, page: '' })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${categoria === c.slug ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            {c.nombre}
          </button>
        ))}
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              setTexto('');
              setParams({}, { replace: true });
            }}
            className="inline-flex items-center gap-1 px-2 text-sm font-medium text-primary"
          >
            <X className="h-4 w-4" aria-hidden="true" /> Quitar filtros
          </button>
        )}
      </div>

      {productos.error && <Alert tone="error">{productos.error}</Alert>}

      {productos.cargando && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
          ))}
        </div>
      ) : data && !data.items.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState icon={PackageSearch} title={hayFiltros ? 'No encontramos productos con esos filtros' : 'Esta tienda aún no tiene productos'} description={hayFiltros ? 'Prueba con otra búsqueda o quita los filtros.' : 'Vuelve pronto.'} />
        </div>
      ) : (
        data && (
          <>
            <p className="mb-4 text-sm text-slate-500">{plural(data.total, 'producto')}</p>
            <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-4 ${productos.cargando ? 'opacity-60' : ''}`}>
              {data.items.map((p) => (
                <ProductoTienda key={p._id} slug={slug} producto={p} enCarrito={carrito.items.some((i) => i.product === p._id)} onAgregar={agregar} />
              ))}
            </div>
            {data.pages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Paginación">
                <button type="button" disabled={page <= 1} onClick={() => cambiar({ page: page > 2 ? String(page - 1) : '' })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-50">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Anterior
                </button>
                <span className="text-sm text-slate-600">
                  Página {data.page} de {data.pages}
                </span>
                <button type="button" disabled={page >= data.pages} onClick={() => cambiar({ page: String(page + 1) })} className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium disabled:opacity-50">
                  Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        )
      )}
    </div>
  );
}
