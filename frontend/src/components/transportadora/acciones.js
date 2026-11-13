import { CheckCircle2, TriangleAlert, Truck, Undo2 } from 'lucide-react';

// Misma tabla de transiciones que orderStatus.service.js del backend
const PERMITIDAS = {
  GUIA_GENERADA: ['EN_TRANSITO'],
  EN_TRANSITO: ['ENTREGADO', 'NOVEDAD', 'DEVOLUCION'],
  NOVEDAD: ['DEVOLUCION'],
};

export const ACCIONES = {
  EN_TRANSITO: { label: 'En tránsito', icon: Truck, variant: 'primary', mensaje: 'Guía marcada en tránsito' },
  ENTREGADO: { label: 'Entregado', icon: CheckCircle2, variant: 'success', mensaje: 'Entrega confirmada: el dinero ya se repartió' },
  NOVEDAD: { label: 'Reportar novedad', icon: TriangleAlert, variant: 'secondary', mensaje: 'Novedad reportada al dropshipper' },
  DEVOLUCION: { label: 'Devolución', icon: Undo2, variant: 'secondary', mensaje: 'Orden enviada a devolución' },
};

export const MOTIVOS_NOVEDAD = ['Cliente ausente', 'Dirección incorrecta', 'Rechazó el pedido', 'Teléfono no contesta', 'Zona de difícil acceso'];

export const accionesPermitidas = (orden) => PERMITIDAS[orden.estado] || [];

// Con tarjeta el cliente ya pagó en línea: solo se cobra en efectivo la contraentrega
export const cobraEfectivo = (orden) => orden.tipoPago === 'CON_RECAUDO' && orden.metodoPagoCliente !== 'TARJETA';
