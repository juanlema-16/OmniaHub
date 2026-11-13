import { MapPin, Package, Truck, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Timeline from '../ui/Timeline';
import Skeleton from '../ui/Skeleton';
import Alert from '../ui/Alert';
import { OrderStatusBadge } from '../ui/Badge';
import useAsync from '../../hooks/useAsync';
import { getOrder } from '../../api/orders';
import { formatQ } from '../../utils/formatQ';
import { TIPO_PAGO } from '../../utils/constants';

const Dato = ({ icon: Icon, titulo, children }) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <div className="text-slate-700">{children}</div>
    </div>
  </div>
);

// Resumen de una orden con su línea de tiempo. Cada rol recibe de la API solo sus montos.
export default function OrderQuickView({ orderId, onClose }) {
  const { data: o, cargando, error } = useAsync(() => (orderId ? getOrder(orderId) : Promise.resolve(null)), [orderId]);

  return (
    <Modal open={Boolean(orderId)} onClose={onClose} size="lg" title={o ? `Orden ${o.numero}` : 'Orden'} description={o?.guia ? `Guía ${o.guia}` : undefined}>
      {error && <Alert tone="error">{error}</Alert>}
      {cargando && (
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {o && !cargando && (
        <div className="grid gap-6 md:grid-cols-5">
          <div className="space-y-4 md:col-span-3">
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge estado={o.estado} />
              <span className="text-xs text-slate-500">
                {TIPO_PAGO[o.tipoPago]}
                {o.metodoPagoCliente === 'TARJETA' && ' · pagado con tarjeta'}
              </span>
            </div>
            <Dato icon={User} titulo="Cliente">
              {o.cliente.nombres} {o.cliente.apellidos} · {o.cliente.telefono}
            </Dato>
            <Dato icon={MapPin} titulo="Destino">
              {o.destino.direccion}, {o.destino.municipio}, {o.destino.departamento}
              {o.destino.referencias && <span className="block text-slate-500">{o.destino.referencias}</span>}
            </Dato>
            <Dato icon={Truck} titulo="Transportadora">
              {o.transportadora?.nombre}
            </Dato>
            <Dato icon={Package} titulo="Productos">
              <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200">
                {o.items.map((i) => (
                  <li key={i.product} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="truncate">
                      {i.cantidad} × {i.nombre}
                    </span>
                    {i.precioVenta !== undefined && <span className="shrink-0 font-medium">{formatQ(i.precioVenta * i.cantidad)}</span>}
                  </li>
                ))}
              </ul>
              {o.total !== undefined && (
                <p className="mt-2 flex justify-between font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatQ(o.total)}</span>
                </p>
              )}
            </Dato>
            {o.novedad?.activa && (
              <Alert tone="warning" title="Novedad activa">
                {o.novedad.motivo}
              </Alert>
            )}
          </div>
          <div className="md:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-900">Seguimiento</h3>
            <Timeline items={o.historial} />
          </div>
        </div>
      )}
    </Modal>
  );
}
