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
