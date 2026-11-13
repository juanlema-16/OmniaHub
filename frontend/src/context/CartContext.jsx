import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatQ } from '../utils/formatQ';
import { plural } from '../utils/plural';

const CLAVE = 'omniahub_carritos';
const MAX_POR_PRODUCTO = 50;

// Un carrito por tienda: { [slug]: [{ product, nombre, imagen, precio, cantidad, stock }] }
const leer = () => {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE));
    return guardado && typeof guardado === 'object' ? guardado : {};
  } catch {
    return {};
  }
};

// Aplica lo que respondió la API: quita lo que ya no se vende, actualiza precio y stock y ajusta cantidades.
// Devuelve el carrito nuevo y los avisos (en español) de lo que cambió.
export const aplicarValidacion = (items, resultado) => {
  const porProducto = new Map(resultado.items.map((r) => [r.product, r]));
  const avisos = [];
  const nuevos = [];
  items.forEach((i) => {
    const r = porProducto.get(i.product);
    if (!r) {
      nuevos.push(i);
      return;
    }
    if (!r.disponible) {
      avisos.push(r.motivo === 'AGOTADO' ? `"${r.nombre}" se agotó y lo quitamos de tu carrito.` : `"${i.nombre}" ya no está disponible en la tienda y lo quitamos de tu carrito.`);
      return;
    }
    let cantidad = i.cantidad;
    const limite = Math.min(r.stock, MAX_POR_PRODUCTO);
    if (cantidad > limite) {
      avisos.push(`De "${r.nombre}" solo quedan ${plural(r.stock, 'unidad', 'unidades')}: ajustamos la cantidad de ${cantidad} a ${limite}.`);
      cantidad = limite;
    }
    if (r.precio !== i.precio) avisos.push(`El precio de "${r.nombre}" cambió de ${formatQ(i.precio)} a ${formatQ(r.precio)}.`);
    nuevos.push({ ...i, nombre: r.nombre, imagen: r.imagen ?? i.imagen, precio: r.precio, stock: r.stock, cantidad });
  });
  return { items: nuevos, avisos };
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [carritos, setCarritos] = useState(leer);
  // Avisos de cambios por tienda: viven solo en memoria, para que sobrevivan al paso del checkout al carrito
  const [avisos, setAvisos] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(carritos));
    } catch {
      // Sin almacenamiento (modo privado): el carrito sigue funcionando mientras la pestaña esté abierta
    }
  }, [carritos]);

  const editar = useCallback((slug, fn) => setCarritos((c) => ({ ...c, [slug]: fn(c[slug] || []) })), []);

  const value = useMemo(
    () => ({
      carritos,
      agregar: (slug, producto, cantidad = 1) =>
        editar(slug, (items) => {
          const limite = Math.min(producto.stock ?? MAX_POR_PRODUCTO, MAX_POR_PRODUCTO);
          const existente = items.find((i) => i.product === producto._id);
          if (existente) return items.map((i) => (i.product === producto._id ? { ...i, precio: producto.precio, stock: producto.stock, cantidad: Math.min(i.cantidad + cantidad, limite) } : i));
          return [...items, { product: producto._id, nombre: producto.nombre, imagen: producto.imagenes?.[0], precio: producto.precio, stock: producto.stock, cantidad: Math.min(cantidad, limite) }];
        }),
      cambiarCantidad: (slug, product, cantidad) =>
        editar(slug, (items) =>
          items.map((i) => (i.product === product ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock ?? MAX_POR_PRODUCTO, MAX_POR_PRODUCTO)) } : i))
        ),
      quitar: (slug, product) => editar(slug, (items) => items.filter((i) => i.product !== product)),
      vaciar: (slug) => {
        editar(slug, () => []);
        setAvisos((a) => ({ ...a, [slug]: [] }));
      },
      avisos,
      sincronizar: (slug, resultado) => {
        const actual = carritos[slug] || [];
        const { items, avisos: nuevos } = aplicarValidacion(actual, resultado);
        if (JSON.stringify(items) !== JSON.stringify(actual)) editar(slug, () => items);
        if (nuevos.length) setAvisos((a) => ({ ...a, [slug]: nuevos }));
      },
      descartarAvisos: (slug) => setAvisos((a) => ({ ...a, [slug]: [] })),
    }),
    [carritos, avisos, editar]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Carrito de una tienda con sus totales
export function useCart(slug) {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider');
  const items = ctx.carritos[slug] || [];
  return {
    items,
    cantidad: items.reduce((s, i) => s + i.cantidad, 0),
    subtotal: Math.round(items.reduce((s, i) => s + i.precio * i.cantidad, 0) * 100) / 100,
    agregar: (producto, cantidad) => ctx.agregar(slug, producto, cantidad),
    cambiarCantidad: (product, cantidad) => ctx.cambiarCantidad(slug, product, cantidad),
    quitar: (product) => ctx.quitar(slug, product),
    vaciar: () => ctx.vaciar(slug),
    avisos: ctx.avisos[slug] || [],
    sincronizar: (resultado) => ctx.sincronizar(slug, resultado),
    descartarAvisos: () => ctx.descartarAvisos(slug),
  };
}
