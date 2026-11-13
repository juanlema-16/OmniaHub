import { Link } from 'react-router-dom';
import { MapPin, Package, ShoppingBag, Truck, User } from 'lucide-react';
import Modal from '../ui/Modal';
import Timeline from '../ui/Timeline';
import Skeleton from '../ui/Skeleton';
import Alert from '../ui/Alert';
import { OrderStatusBadge } from '../ui/Badge';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getOrder } from '../../api/orders';
import { formatQ } from '../../utils/formatQ';
import { TIPO_PAGO } from '../../utils/constants';
import ImagenProducto from '../ui/ImagenProducto';

const Dato = ({ icon: Icon, titulo, children }) => (
  <div className="flex gap-3">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    <div className="min-w-0 text-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{titulo}</p>
      <div className="text-slate-700">{children}</div>
    </div>
  </div>
);

const Linea = ({ label, value, className = '' }) => (
  <div className={`flex justify-between gap-3 ${className}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

// Resumen de una orden con su línea de tiempo. Cada rol recibe de la API solo sus montos.
// renderAcciones(orden, { recargar }) dibuja los botones que ese rol puede usar.
export default function OrderQuickView({ orderId, onClose, renderAcciones }) {
  const { data: o, cargando, error, recargar } = useAsync(() => (orderId ? getOrder(orderId) : Promise.resolve(null)), [orderId]);
  const { user } = useAuth();
  const tienda = o?.dropshipper?.tienda;
  // El cliente puede volver a la tienda donde compró desde el detalle de su pedido
  const volverAComprar =
    o && !cargando && user?.role === 'cliente' && tienda?.slug ? (
      <Link to={`/tienda/${tienda.slug}`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover">
        <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Volver a comprar en {tienda.nombre}
      </Link>
    ) : null;
  const acciones = o && !cargando && renderAcciones ? renderAcciones(o, { recargar }) : volverAComprar;

  return (
    <Modal
      open={Boolean(orderId)}
      onClose={onClose}
      size="lg"
      title={o ? `Orden ${o.numero}` : 'Orden'}
      description={o?.guia ? `Guía ${o.guia}` : undefined}
      footer={acciones}
    >
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
                    <span className="flex min-w-0 items-center gap-2.5">
                      <ImagenProducto src={i.imagen} respaldo={i.imagenActual} className="h-8 w-8" />
                      <span className="truncate">
                        {i.cantidad} × {i.nombre}
                      </span>
                    </span>
                    {i.precioVenta !== undefined && <span className="shrink-0 font-medium">{formatQ(i.precioVenta * i.cantidad)}</span>}
                  </li>
                ))}
              </ul>
              {o.total !== undefined && (
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  {o.descuento > 0 && <Linea label={`Descuento${o.cupon?.codigo ? ` (${o.cupon.codigo})` : ''}`} value={`− ${formatQ(o.descuento)}`} />}
                  <Linea label="Total" value={formatQ(o.total)} className="font-semibold text-slate-900" />
                  {o.costoEnvio !== undefined && o.gananciaDropshipper !== undefined && (
                    <>
                      {o.items.every((i) => i.precioProveedor !== undefined) && (
                        <Linea label="Precio proveedor" value={`− ${formatQ(o.items.reduce((s, i) => s + i.precioProveedor * i.cantidad, 0))}`} />
                      )}
                      <Linea label="Envío" value={`− ${formatQ(o.costoEnvio)}`} />
                      {o.comision !== undefined && <Linea label="Comisión de la plataforma" value={`− ${formatQ(o.comision)}`} />}
                      <Linea label="Tu ganancia" value={formatQ(o.gananciaDropshipper)} className={`font-semibold ${o.gananciaDropshipper < 0 ? 'text-danger' : 'text-success'}`} />
                    </>
                  )}
                </div>
              )}
            </Dato>
            {o.novedad?.activa && (
              <Alert tone="warning" title="Novedad activa">
                {o.novedad.motivo}
              </Alert>
            )}
            {o.notasProveedor && (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <strong className="text-slate-700">Notas para el proveedor:</strong> {o.notasProveedor}
              </p>
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
