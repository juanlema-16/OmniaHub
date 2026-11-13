import { useEffect, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, PackageSearch, Heart, RotateCcw, Search, Warehouse } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useDebounce from '../../hooks/useDebounce';
import { getCatalog, getCategories, getProveedores } from '../../api/catalog';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import ProductCard from '../../components/dropshipper/ProductCard';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../api/axios';
import { addFavorite, removeFavorite } from '../../api/favorites';
import ImportarModal from '../../components/dropshipper/ImportarModal';
import CrearOrdenModal from '../../components/orders/CrearOrdenModal';
import { plural } from '../../utils/plural';

const FILTROS = { search: '', categoria: '', proveedor: '', precioMin: '', precioMax: '', conStock: true, verificado: false, favoritos: false, orden: 'recientes' };

const ORDENES = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'precio_asc', label: 'Precio: menor a mayor' },
  { value: 'precio_desc', label: 'Precio: mayor a menor' },
  { value: 'stock_desc', label: 'Más stock' },
  { value: 'nombre', label: 'Nombre (A-Z)' },
];

const LIMITE = 12;
const NUMERO = 'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100';

export default function CatalogoPage() {
  const [filtros, setFiltros] = useState(FILTROS);
  const [page, setPage] = useState(1);
  const [importar, setImportar] = useState(null);
  const [enviar, setEnviar] = useState(null);
  const busqueda = useDebounce(filtros.search, 350);
  const precioMin = useDebounce(filtros.precioMin, 500);
  const precioMax = useDebounce(filtros.precioMax, 500);

  const proveedores = useAsync(getProveedores, []);
  const categorias = useAsync(getCategories, []);
  const params = {
    search: busqueda || undefined,
    categoria: filtros.categoria || undefined,
    proveedor: filtros.proveedor || undefined,
    precioMin: precioMin || undefined,
    precioMax: precioMax || undefined,
    conStock: filtros.conStock || undefined,
    verificado: filtros.verificado || undefined,
    favoritos: filtros.favoritos || undefined,
    orden: filtros.orden,
    page,
    limit: LIMITE,
  };
  const catalogo = useAsync(() => getCatalog(params), [JSON.stringify(params)]);

  // Cualquier filtro nuevo vuelve a la primera página
  useEffect(() => setPage(1), [busqueda, filtros.categoria, filtros.proveedor, precioMin, precioMax, filtros.conStock, filtros.verificado, filtros.favoritos, filtros.orden]);

  const cambiar = (campo, valor) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS);
  const datos = catalogo.data;

  // Al importar, la tarjeta cambia a "En tu tienda" sin recargar todo el catálogo
  const marcarImportado = (productoId, storeProduct) =>
    catalogo.setData((d) => d && { ...d, items: d.items.map((p) => (p._id === productoId ? { ...p, importado: true, storeProduct } : p)) });

  // Marca o desmarca al instante y revierte si el servidor falla; en la vista de favoritos la tarjeta desaparece
  const alternarFavorito = async (p) => {
    const nuevo = !p.favorito;
    catalogo.setData((d) => d && { ...d, items: d.items.map((x) => (x._id === p._id ? { ...x, favorito: nuevo } : x)) });
    try {
      await (nuevo ? addFavorite(p._id) : removeFavorite(p._id));
      if (!nuevo && filtros.favoritos) catalogo.setData((d) => d && { ...d, total: d.total - 1, items: d.items.filter((x) => x._id !== p._id) });
    } catch (err) {
      catalogo.setData((d) => d && { ...d, items: d.items.map((x) => (x._id === p._id ? { ...x, favorito: !nuevo } : x)) });
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Catálogo" description="Productos de proveedores verificados listos para vender en tu tienda o enviar a tus clientes." />

      <section aria-labelledby="titulo-proveedores">
        <h2 id="titulo-proveedores" className="mb-3 text-sm font-semibold text-slate-900">
          Proveedores destacados
        </h2>
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {proveedores.cargando && [0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-72 shrink-0" />)}
          {(proveedores.data?.items || []).map((prov) => {
            const activo = filtros.proveedor === prov._id;
            return (
              <button
                key={prov._id}
                type="button"
                onClick={() => cambiar('proveedor', activo ? '' : prov._id)}
                aria-pressed={activo}
                className={`flex w-72 shrink-0 snap-start items-center gap-3 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors ${
                  activo ? 'border-primary ring-1 ring-primary' : 'border-slate-200 hover:border-primary/40'
                }`}
              >
                <Avatar nombre={prov.empresa?.nombre?.split(' ')[0]} apellido={prov.empresa?.nombre?.split(' ')[1]} size="lg" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-semibold text-slate-900">
                    <span className="truncate">{prov.empresa?.nombre}</span>
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verificado" />
                  </span>
                  <span className="block text-xs text-slate-500">{plural(prov.productos, 'producto')}</span>
                  <span className="flex items-center gap-1 truncate text-xs text-slate-400">
                    <Warehouse className="h-3 w-3 shrink-0" aria-hidden="true" /> {prov.empresa?.bodega} · {prov.categorias.slice(0, 2).join(', ')}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={filtros.search}
              onChange={(e) => cambiar('search', e.target.value)}
              placeholder="Buscar por nombre, SKU o descripción"
              aria-label="Buscar productos"
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Switch checked={filtros.favoritos} onChange={(v) => cambiar('favoritos', v)} label={<span className="inline-flex items-center gap-1.5"><Heart className="h-4 w-4 fill-orange-500 text-orange-500" aria-hidden="true" /> Solo favoritos</span>} />
            <Switch checked={filtros.conStock} onChange={(v) => cambiar('conStock', v)} label="Solo con stock" />
            <Switch checked={filtros.verificado} onChange={(v) => cambiar('verificado', v)} label="Solo verificados" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Proveedor"
            value={filtros.proveedor}
            onChange={(e) => cambiar('proveedor', e.target.value)}
            placeholder="Todos"
            options={(proveedores.data?.items || []).map((p) => ({ value: p._id, label: p.empresa?.nombre }))}
          />
          <Select
            label="Categoría"
            value={filtros.categoria}
            onChange={(e) => cambiar('categoria', e.target.value)}
            placeholder="Todas"
            options={(categorias.data || []).map((c) => ({ value: c._id, label: `${c.nombre} (${c.productos})` }))}
          />
          <fieldset className="lg:col-span-2">
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">Rango de precio proveedor</legend>
            <div className="flex items-center gap-2">
              <input type="number" min="0" inputMode="decimal" placeholder="Mínimo" aria-label="Precio mínimo" className={NUMERO} value={filtros.precioMin} onChange={(e) => cambiar('precioMin', e.target.value)} />
              <span className="text-slate-400">—</span>
              <input type="number" min="0" inputMode="decimal" placeholder="Máximo" aria-label="Precio máximo" className={NUMERO} value={filtros.precioMax} onChange={(e) => cambiar('precioMax', e.target.value)} />
            </div>
          </fieldset>
          <Select label="Ordenar por" value={filtros.orden} onChange={(e) => cambiar('orden', e.target.value)} options={ORDENES} />
        </div>
        {hayFiltros && (
          <button type="button" onClick={() => setFiltros(FILTROS)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
            <RotateCcw className="h-4 w-4" aria-hidden="true" /> Limpiar filtros
          </button>
        )}
      </section>

      {catalogo.error && <Alert tone="error">{catalogo.error}</Alert>}
      <p className="text-sm text-slate-500" aria-live="polite">
        {datos && !catalogo.cargando ? plural(datos.total, 'producto encontrado', 'productos encontrados') : ' '}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalogo.cargando && Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-[26rem] w-full" />)}
        {!catalogo.cargando && datos?.items.map((p) => <ProductCard key={p._id} producto={p} onImportar={setImportar} onEnviar={setEnviar} onFavorito={alternarFavorito} />)}
      </div>
      {!catalogo.cargando && datos?.items.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState
            icon={PackageSearch}
            title="No hay productos con esos filtros"
            description="Prueba con otra búsqueda o quita algunos filtros."
            action={hayFiltros && <Button variant="secondary" onClick={() => setFiltros(FILTROS)}>Limpiar filtros</Button>}
          />
        </div>
      )}

      {datos && datos.pages > 1 && (
        <nav className="flex items-center justify-between gap-3 text-sm text-slate-600" aria-label="Paginación del catálogo">
          <span>
            Página <strong className="text-slate-900">{datos.page}</strong> de {datos.pages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page <= 1 || catalogo.cargando} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= datos.pages || catalogo.cargando} onClick={() => setPage((p) => p + 1)}>
              Siguiente <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}

      <ImportarModal producto={importar} onClose={() => setImportar(null)} onDone={(sp) => marcarImportado(importar._id, sp)} />
      <CrearOrdenModal open={Boolean(enviar)} producto={enviar} onClose={() => setEnviar(null)} />
    </div>
  );
}
