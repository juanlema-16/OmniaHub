export const DEPARTAMENTOS = [
  'Alta Verapaz',
  'Baja Verapaz',
  'Chimaltenango',
  'Chiquimula',
  'El Progreso',
  'Escuintla',
  'Guatemala',
  'Huehuetenango',
  'Izabal',
  'Jalapa',
  'Jutiapa',
  'Petén',
  'Quetzaltenango',
  'Quiché',
  'Retalhuleu',
  'Sacatepéquez',
  'San Marcos',
  'Santa Rosa',
  'Sololá',
  'Suchitepéquez',
  'Totonicapán',
  'Zacapa',
];

export const ROLES = ['admin', 'proveedor', 'dropshipper', 'transportadora', 'cliente'];
export const ROLES_REGISTRO = ['proveedor', 'dropshipper', 'cliente'];
export const ACCOUNT_STATUS = ['pendiente_email', 'activo', 'bloqueado'];
export const KYC_STATUS = ['no_enviado', 'pendiente', 'aprobado', 'rechazado'];

export const ORDER_STATUS = [
  'PENDIENTE_CONFIRMACION',
  'PENDIENTE',
  'GUIA_GENERADA',
  'EN_TRANSITO',
  'ENTREGADO',
  'NOVEDAD',
  'DEVOLUCION',
  'CANCELADO',
];
export const ORDER_ORIGEN = ['PANEL', 'TIENDA'];
export const TIPO_PAGO = ['CON_RECAUDO', 'SIN_RECAUDO'];

export const TRANSACTION_TIPO = ['ENTRADA', 'SALIDA'];
export const TRANSACTION_CONCEPTO = [
  'VENTA_ENTREGADA',
  'PAGO_PROVEEDOR',
  'PAGO_ENVIO',
  'COMISION_PLATAFORMA',
  'ORDEN_SIN_RECAUDO',
  'FLETE_DEVOLUCION',
  'RECARGA',
  'RETIRO',
  'AJUSTE_ADMIN',
];

export const SOLICITUD_ESTADO = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];
export const METODO_RECARGA = ['TRANSFERENCIA', 'TARJETA'];
export const TIPO_CUENTA = ['MONETARIA', 'AHORRO'];
export const BANCOS = ['Banco Industrial', 'Banrural', 'BAM', 'G&T Continental', 'BAC Credomatic', 'Banco Promerica'];

export const COUPON_TIPO = ['PORCENTAJE', 'FIJO'];
export const INVENTORY_TIPO = ['ENTRADA_COMPRA', 'SALIDA_VENTA', 'AJUSTE', 'DEVOLUCION'];
export const CASH_SESSION_ESTADO = ['ABIERTA', 'CERRADA'];
export const METODO_PAGO_POS = ['EFECTIVO', 'TARJETA'];
export const TICKET_CATEGORIA = ['PEDIDO', 'PAGO', 'CUENTA', 'TECNICO', 'OTRO'];
export const TICKET_PRIORIDAD = ['BAJA', 'MEDIA', 'ALTA'];
export const TICKET_ESTADO = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
export const BANNER_UBICACION = ['LANDING', 'PANEL'];
export const POLICY_SLUGS = ['terminos-y-condiciones', 'privacidad', 'cookies', 'envios-y-devoluciones'];

export const SETTINGS_DEFAULT = {
  comisionPorcentaje: 3,
  montoMinimoRetiro: 100,
};

export const TELEFONO_REGEX = /^\d{8}$/;
