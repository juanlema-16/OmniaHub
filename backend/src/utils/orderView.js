// Cada rol solo ve los montos que le corresponden: el cliente no ve costos internos,
// la transportadora no ve precios ni ganancias y el proveedor no ve el margen del dropshipper.
const OCULTOS = {
  cliente: { campos: ['gananciaDropshipper', 'comision', 'efectos', 'notasProveedor'], items: ['precioProveedor'] },
  transportadora: { campos: ['gananciaDropshipper', 'comision', 'efectos', 'subtotal', 'descuento', 'cupon'], items: ['precioProveedor', 'precioVenta'] },
  proveedor: { campos: ['gananciaDropshipper', 'comision', 'efectos', 'subtotal', 'descuento', 'total', 'cupon'], items: ['precioVenta'] },
};

export const orderForRole = (order, role) => {
  const reglas = OCULTOS[role];
  if (!order || !reglas) return order;
  const o = typeof order.toJSON === 'function' ? order.toJSON() : { ...order };
  for (const campo of reglas.campos) delete o[campo];
  o.items = (o.items || []).map((item) => {
    const copia = { ...item };
    for (const campo of reglas.items) delete copia[campo];
    return copia;
  });
  // El proveedor no necesita cuánto cobra el dropshipper; la transportadora sí necesita el total a cobrar
  if (role === 'proveedor') delete o.montoRecaudado;
  return o;
};
