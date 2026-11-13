import { useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Minus, Plus, ShoppingCart, Truck, Wallet } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useCart } from '../../context/CartContext';
import { getStoreProduct } from '../../api/store';
import Button from '../../components/ui/Button';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

export default function ProductoPage() {
  const { slug } = useOutletContext();
  const { productId } = useParams();
  const navigate = useNavigate();
  const carrito = useCart(slug);
  const { data, cargando, error } = useAsync(() => getStoreProduct(slug, productId), [slug, productId]);
  const [cantidad, setCantidad] = useState(1);
  const [foto, setFoto] = useState(0);
  const p = data?.producto;
  const limite = p ? Math.min(p.stock, 50) : 1;
  const enCarrito = p && carrito.items.find((i) => i.product === p._id);

  if (error) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <EmptyState
          title="Producto no disponible"
          description={error}
          action={
            <Link to={`/tienda/${slug}`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
              Volver a la tienda
            </Link>
          }
        />
      </div>
    );
  }

  const agregar = (irAlCarrito) => {
    carrito.agregar(p, cantidad);
    if (irAlCarrito) navigate(`/tienda/${slug}/carrito`);
    else toast.success(`${plural(cantidad, 'unidad', 'unidades')} de ${p.nombre} en tu carrito`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500" aria-label="Ruta">
        <Link to={`/tienda/${slug}`} className="hover:text-primary">
          Tienda
        </Link>
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
        <span className="truncate text-slate-800">{p?.nombre || 'Producto'}</span>
      </nav>

      {cargando && !p ? (
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        p && (
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img src={p.imagenes?.[foto]} alt={p.nombre} className="h-full w-full object-cover" />
              </div>
              {p.imagenes?.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {p.imagenes.map((src, i) => (
                    <button key={src} type="button" onClick={() => setFoto(i)} aria-label={`Ver imagen ${i + 1}`} aria-current={i === foto} className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === foto ? 'border-primary' : 'border-transparent'}`}>
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {p.categoria && <p className="text-sm font-medium text-primary">{p.categoria.nombre}</p>}
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{p.nombre}</h1>
              <p className="mt-4 text-4xl font-bold text-slate-900">{formatQ(p.precio)}</p>
              <p className={`mt-2 text-sm font-medium ${p.disponible ? 'text-success' : 'text-danger'}`}>{p.disponible ? (p.stock <= 5 ? `Quedan solo ${plural(p.stock, 'unidad', 'unidades')}` : 'Disponible') : 'Agotado'}</p>

              <p className="mt-5 whitespace-pre-line text-slate-600">{p.descripcion}</p>

              {p.disponible && (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white" role="group" aria-label="Cantidad">
                    <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))} disabled={cantidad <= 1} aria-label="Quitar una unidad" className="h-full px-3 text-slate-600 disabled:opacity-40">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold" aria-live="polite">
                      {cantidad}
                    </span>
                    <button type="button" onClick={() => setCantidad((c) => Math.min(limite, c + 1))} disabled={cantidad >= limite} aria-label="Agregar una unidad" className="h-full px-3 text-slate-600 disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button size="lg" icon={ShoppingCart} onClick={() => agregar(false)} variant="secondary">
                    Agregar al carrito
                  </Button>
                  <Button size="lg" onClick={() => agregar(true)}>
                    Comprar ahora
                  </Button>
                </div>
              )}
              {enCarrito && <p className="mt-3 text-sm text-slate-500">Ya tienes {plural(enCarrito.cantidad, 'unidad', 'unidades')} en tu carrito.</p>}

              <ul className="mt-8 space-y-3 rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200">
                <li className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" aria-hidden="true" /> Envío a todo Guatemala, incluido en el precio
                </li>
                <li className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-primary" aria-hidden="true" /> Paga contra entrega o con tarjeta simulada
                </li>
              </ul>
            </div>
          </div>
        )
      )}
    </div>
  );
}
