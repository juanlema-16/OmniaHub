import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BadgeCheck, Check, ChevronRight, Copy, Home, MapPin, Phone, Send, Store, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useAsync from '../../hooks/useAsync';
import { getCatalogProduct } from '../../api/catalog';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { ResumenEstrellas } from '../../components/ui/Estrellas';
import ResenasProducto from '../../components/reviews/ResenasProducto';
import ImportarModal from '../../components/dropshipper/ImportarModal';
import CrearOrdenModal from '../../components/orders/CrearOrdenModal';
import { formatQ } from '../../utils/formatQ';

export default function ProductoDetallePage() {
  const { id } = useParams();
  const { data: p, setData, cargando, error } = useAsync(() => getCatalogProduct(id), [id]);
  const [imagen, setImagen] = useState(0);
  const [importar, setImportar] = useState(false);
  const [enviar, setEnviar] = useState(false);

  useEffect(() => setImagen(0), [id]);

  if (cargando) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  if (error || !p) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white">
        <EmptyState icon={TriangleAlert} title="No encontramos este producto" description={error || 'Puede que el proveedor lo haya retirado del catálogo.'} action={<Link to="/dropshipper/catalogo" className="text-sm font-semibold text-primary">Volver al catálogo</Link>} />
      </div>
    );
  }

  const margen = p.precioSugerido - p.precioProveedor;
  const agotado = p.stock <= 0;

  return (
    <div className="space-y-6">
      <nav aria-label="Ruta" className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
        <Link to="/dropshipper" aria-label="Inicio" className="hover:text-primary">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        <Link to="/dropshipper/catalogo" className="hover:text-primary">
          Catálogo
        </Link>
        <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        <span>Proveedor: {p.proveedor?.empresa?.nombre}</span>
        <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        <span className="truncate font-medium text-slate-700">{p.nombre}</span>
      </nav>

      <section className="grid gap-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-2 lg:p-6">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <img src={p.imagenes[imagen]} alt={p.nombre} className="h-full w-full object-cover" />
          </div>
          {p.imagenes.length > 1 && (
            <div className="mt-3 flex gap-2">
              {p.imagenes.map((src, i) => (
                <button key={src} type="button" onClick={() => setImagen(i)} aria-label={`Ver imagen ${i + 1}`} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === imagen ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate">{p.categoria?.nombre}</Badge>
            {p.verificado && (
              <Badge tone="indigo">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verificado
              </Badge>
            )}
            {p.importado && (
              <Badge tone="green">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> En tu tienda a {formatQ(p.storeProduct?.precioVenta)}
              </Badge>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{p.nombre}</h1>
          <div className="mt-1.5">
            <ResumenEstrellas rating={p.rating} size="h-4 w-4" />
          </div>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(p.sku).then(() => toast.success('SKU copiado'))}
            className="mt-1 inline-flex w-fit items-center gap-1 text-sm text-slate-500 hover:text-primary"
          >
            SKU: {p.sku} <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div className="mt-5 flex divide-x divide-slate-200 rounded-xl bg-slate-50 py-4">
            <div className="flex-1 px-4">
              <p className="text-xs text-slate-500">Precio del proveedor</p>
              <p className="text-xl font-semibold text-slate-600">{formatQ(p.precioProveedor)}</p>
            </div>
            <div className="flex-1 px-4">
              <p className="text-xs text-slate-500">Precio sugerido</p>
              <p className="text-xl font-bold text-slate-900">{formatQ(p.precioSugerido)}</p>
            </div>
            <div className="flex-1 px-4">
              <p className="text-xs text-slate-500">Margen sugerido</p>
              <p className="text-xl font-bold text-success">{formatQ(margen)}</p>
            </div>
          </div>

          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-slate-500">Disponible en:</dt>
              <dd className="font-medium text-slate-800">{p.bodega}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-slate-500">Stock:</dt>
              <dd className={`font-semibold ${agotado ? 'text-danger' : p.stockBajo ? 'text-warning' : 'text-success'}`}>{agotado ? 'Agotado' : `${p.stock} unidades`}</dd>
              {p.stockBajo && !agotado && <Badge tone="amber">Stock bajo</Badge>}
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" icon={Send} onClick={() => setEnviar(true)} disabled={agotado} className="sm:flex-1">
              Enviar al cliente
            </Button>
            <Button size="lg" variant={p.importado ? 'secondary' : 'soft'} icon={p.importado ? Check : Store} onClick={() => setImportar(true)} className="sm:flex-1">
              {p.importado ? 'Cambiar precio en mi tienda' : 'Importar a mi tienda'}
            </Button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Vendido por</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar nombre={p.proveedor?.empresa?.nombre?.split(' ')[0]} apellido={p.proveedor?.empresa?.nombre?.split(' ')[1]} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 font-semibold text-slate-900">
                  {p.proveedor?.empresa?.nombre}
                  {p.proveedor?.kyc?.status === 'aprobado' && <BadgeCheck className="h-4 w-4 text-primary" aria-label="Proveedor verificado" />}
                </p>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Bodega: {p.proveedor?.empresa?.bodega}
                </p>
              </div>
              {p.proveedor?.telefono && (
                <a href={`tel:+502${p.proveedor.telefono}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <Phone className="h-4 w-4" aria-hidden="true" /> Contactar
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {p.descripcion && (
        <Card title="Descripción">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{p.descripcion}</p>
        </Card>
      )}

      <ResenasProducto productId={p._id} />

      {p.relacionados?.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Productos relacionados</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {p.relacionados.map((r) => (
              <Link key={r._id} to={`/dropshipper/catalogo/${r._id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
                <img src={r.imagenes?.[0]} alt="" className="aspect-square w-full object-cover" />
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-slate-900 group-hover:text-primary">{r.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {formatQ(r.precioProveedor)} · Sugerido <strong className="text-slate-800">{formatQ(r.precioSugerido)}</strong>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {p.importado === false && !p.verificado && (
        <Alert tone="info">Este producto aún no está verificado por OmniaHub. Puedes venderlo, pero revisa bien la descripción con el proveedor.</Alert>
      )}

      {importar && <ImportarModal producto={p} onClose={() => setImportar(false)} onDone={(sp) => setData((d) => ({ ...d, importado: true, storeProduct: sp }))} />}
      <CrearOrdenModal open={enviar} producto={p} onClose={() => setEnviar(false)} />
    </div>
  );
}
