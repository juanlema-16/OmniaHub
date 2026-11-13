export const ROLES = {
  admin: { label: 'Administrador', home: '/admin' },
  proveedor: { label: 'Proveedor', home: '/proveedor' },
  dropshipper: { label: 'Dropshipper', home: '/dropshipper' },
  transportadora: { label: 'Transportadora', home: '/transportadora' },
  cliente: { label: 'Cliente', home: '/cliente' },
};

export const ROLES_REGISTRO = [
  { value: 'dropshipper', label: 'Dropshipper', descripcion: 'Vende productos de proveedores en tu tienda en línea, sin inventario.' },
  { value: 'proveedor', label: 'Proveedor', descripcion: 'Publica tus productos y deja que miles de emprendedores los vendan.' },
  { value: 'cliente', label: 'Cliente', descripcion: 'Compra en las tiendas de OmniaHub y sigue tus pedidos.' },
];

export const homeFor = (role) => ROLES[role]?.home ?? '/login';

export const tieneBilletera = (role) => ['admin', 'proveedor', 'dropshipper', 'transportadora'].includes(role);
export const necesitaKyc = (role) => ['proveedor', 'dropshipper'].includes(role);

// Tonos de Badge: definidos una sola vez para que todos los estados se vean igual en toda la app
export const ORDER_STATUS = {
  PENDIENTE_CONFIRMACION: { label: 'Pendiente de confirmación', tone: 'amber' },
  PENDIENTE: { label: 'Pendiente', tone: 'sky' },
  GUIA_GENERADA: { label: 'Guía generada', tone: 'indigo' },
  EN_TRANSITO: { label: 'En tránsito', tone: 'violet' },
  ENTREGADO: { label: 'Entregado', tone: 'green' },
  NOVEDAD: { label: 'Novedad', tone: 'orange' },
  DEVOLUCION: { label: 'Devolución', tone: 'red' },
  CANCELADO: { label: 'Cancelado', tone: 'slate' },
};

export const KYC_STATUS = {
  no_enviado: { label: 'Sin enviar', tone: 'slate' },
  pendiente: { label: 'En revisión', tone: 'amber' },
  aprobado: { label: 'Aprobado', tone: 'green' },
  rechazado: { label: 'Rechazado', tone: 'red' },
};

export const TIPO_PAGO = {
  CON_RECAUDO: 'Contraentrega',
  SIN_RECAUDO: 'Prepagado',
};

export const NOTIFICATION_TONE = {
  ORDEN: 'indigo',
  NOVEDAD: 'orange',
  KYC: 'green',
  BILLETERA: 'sky',
  SISTEMA: 'slate',
};

export const DEPARTAMENTOS = [
  'Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso', 'Escuintla', 'Guatemala',
  'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa', 'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu',
  'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa',
];

export const CONCEPTO_TRANSACCION = {
  VENTA_ENTREGADA: 'Venta entregada',
  PAGO_PROVEEDOR: 'Pago a proveedor',
  PAGO_ENVIO: 'Pago de envío',
  COMISION_PLATAFORMA: 'Comisión de la plataforma',
  ORDEN_SIN_RECAUDO: 'Orden sin recaudo',
  FLETE_DEVOLUCION: 'Flete de devolución',
  RECARGA: 'Recarga',
  RETIRO: 'Retiro',
  AJUSTE_ADMIN: 'Ajuste del administrador',
};

export const SOLICITUD_ESTADO = {
  PENDIENTE: { label: 'Pendiente', tone: 'amber' },
  APROBADA: { label: 'Aprobada', tone: 'green' },
  RECHAZADA: { label: 'Rechazada', tone: 'red' },
};

export const METODO_RECARGA = {
  TRANSFERENCIA: 'Transferencia bancaria',
  TARJETA: 'Tarjeta (simulada)',
};

export const BANCOS = ['Banco Industrial', 'Banrural', 'BAM', 'G&T Continental', 'BAC Credomatic', 'Banco Promerica'];
export const TIPO_CUENTA = { MONETARIA: 'Monetaria', AHORRO: 'Ahorro' };

export const TICKET_CATEGORIA = { PEDIDO: 'Pedido', PAGO: 'Pago', CUENTA: 'Cuenta', TECNICO: 'Problema técnico', OTRO: 'Otro' };
export const TICKET_PRIORIDAD = { BAJA: { label: 'Baja', tone: 'slate' }, MEDIA: { label: 'Media', tone: 'sky' }, ALTA: { label: 'Alta', tone: 'red' } };
export const TICKET_ESTADO = {
  ABIERTO: { label: 'Abierto', tone: 'amber' },
  EN_PROCESO: { label: 'En proceso', tone: 'sky' },
  RESUELTO: { label: 'Resuelto', tone: 'green' },
  CERRADO: { label: 'Cerrado', tone: 'slate' },
};
