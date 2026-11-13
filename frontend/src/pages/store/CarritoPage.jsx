import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

export default function CarritoPage() {
  const { slug } = useOutletContext();
  const navigate = useNavigate();
  const carrito = useCart(slug);

  if (!carrito.items.length) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <EmptyState
            icon={ShoppingCart}
            title="Tu carrito está vacío"
            description="Agrega productos desde la tienda para continuar con tu compra."
            action={
              <Link to={`/tienda/${slug}`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
                Ver productos
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tu carrito</h1>
      <p className="mt-1 text-sm text-slate-500">{plural(carrito.cantidad, 'producto')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {carrito.items.map((i) => (
            <li key={i.product} className="flex gap-4 p-4">
              <img src={i.imagen} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link to={`/tienda/${slug}/producto/${i.product}`} className="line-clamp-2 font-semibold text-slate-900 hover:text-primary">
                    {i.nombre}
                  </Link>
                  <p className="text-sm text-slate-500">{formatQ(i.precio)} c/u</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-9 items-center rounded-lg border border-slate-300" role="group" aria-label={`Cantidad de ${i.nombre}`}>
                    <button type="button" onClick={() => carrito.cambiarCantidad(i.product, i.cantidad - 1)} disabled={i.cantidad <= 1} aria-label={`Quitar una unidad de ${i.nombre}`} className="h-full px-2.5 text-slate-600 disabled:opacity-40">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{i.cantidad}</span>
                    <button type="button" onClick={() => carrito.cambiarCantidad(i.product, i.cantidad + 1)} disabled={i.cantidad >= Math.min(i.stock ?? 50, 50)} aria-label={`Agregar una unidad de ${i.nombre}`} className="h-full px-2.5 text-slate-600 disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="w-24 text-right font-semibold text-slate-900">{formatQ(i.precio * i.cantidad)}</p>
                  <button type="button" onClick={() => carrito.quitar(i.product)} aria-label={`Quitar ${i.nombre} del carrito`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-danger">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-900">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>{formatQ(carrito.subtotal)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Envío</dt>
              <dd className="font-medium text-success">Incluido</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-lg font-bold text-slate-900">
              <dt>Total</dt>
              <dd>{formatQ(carrito.subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-slate-500">¿Tienes un cupón? Lo aplicas en el siguiente paso.</p>
          <Button className="mt-5" fullWidth size="lg" onClick={() => navigate(`/tienda/${slug}/pagar`)}>
            Continuar con la compra
          </Button>
          <Link to={`/tienda/${slug}`} className="mt-3 block text-center text-sm font-medium text-primary hover:underline">
            Seguir comprando
          </Link>
        </aside>
      </div>
    </div>
  );
}
