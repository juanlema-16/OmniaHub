import { Link, Navigate, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { CheckCircle2, MapPin, Package, Truck } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getOrder } from '../../api/orders';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import Timeline from '../../components/ui/Timeline';
import { OrderStatusBadge } from '../../components/ui/Badge';
import { formatQ } from '../../utils/formatQ';
import { formatFechaHora } from '../../utils/dates';
import ImagenProducto from '../../components/ui/ImagenProducto';

export default function PedidoConfirmadoPage() {
  const { slug } = useOutletContext();
  const { id } = useParams();
  const location = useLocation();
  const { autenticado, user } = useAuth();
  const { data: o, cargando, error } = useAsync(() => getOrder(id), [id]);

  if (!autenticado) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'cliente') return <Navigate to={`/tienda/${slug}`} replace />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {error && <Alert tone="error">{error}</Alert>}
      {cargando && !o && <Skeleton className="h-96 w-full rounded-2xl" />}
      {o && (
        <>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">¡Gracias por tu compra!</h1>
            <p className="mt-1 text-slate-600">Recibimos tu pedido. Guarda tu número de orden para darle seguimiento:</p>
            <p className="mt-3 inline-block rounded-xl bg-white px-5 py-2 font-mono text-2xl font-bold tracking-wide text-primary shadow-sm" aria-label={`Número de orden ${o.numero}`}>
              {o.numero}
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" /> Tu pedido
              </h2>
              <ul className="mt-3 divide-y divide-slate-100">
                {o.items.map((i) => (
                  <li key={i.product} className="flex items-center gap-3 py-2.5">
                    <ImagenProducto src={i.imagen} respaldo={i.imagenActual} className="h-12 w-12 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{i.nombre}</p>
                      <p className="text-xs text-slate-500">
                        {i.cantidad} × {formatQ(i.precioVenta)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd>{formatQ(o.subtotal)}</dd>
                </div>
                {o.descuento > 0 && (
                  <div className="flex justify-between text-success">
                    <dt>Descuento{o.cupon?.codigo ? ` (${o.cupon.codigo})` : ''}</dt>
                    <dd>− {formatQ(o.descuento)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-slate-900">
                  <dt>{o.metodoPagoCliente === 'TARJETA' ? 'Total' : 'Total a pagar al recibir'}</dt>
                  <dd>{formatQ(o.total)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-slate-500">Pago: {o.metodoPagoCliente === 'TARJETA' ? 'tarjeta (simulada)' : 'contra entrega'}</p>
            </section>

            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="flex items-center gap-2 font-semibold text-slate-900">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> Entrega
                </h2>
                <p className="mt-2 text-sm text-slate-700">
                  {o.cliente.nombres} {o.cliente.apellidos} · {o.cliente.telefono}
                </p>
                <p className="text-sm text-slate-600">
                  {o.destino.direccion}, {o.destino.municipio}, {o.destino.departamento}
                </p>
                {o.destino.referencias && <p className="text-sm text-slate-500">{o.destino.referencias}</p>}
                {o.transportadora?.nombre && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                    <Truck className="h-4 w-4 text-slate-400" aria-hidden="true" /> {o.transportadora.nombre}
                  </p>
                )}
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Estado</h2>
                  <OrderStatusBadge estado={o.estado} />
                </div>
                <Timeline items={o.historial.map((h) => ({ ...h, usuario: undefined }))} />
                <p className="mt-3 text-xs text-slate-500">Pedido creado el {formatFechaHora(o.createdAt)}</p>
              </div>
            </section>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/cliente/pedidos" className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white hover:bg-primary-hover">
              Ver mis pedidos
            </Link>
            <Link to={`/tienda/${slug}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-6 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Seguir comprando
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
