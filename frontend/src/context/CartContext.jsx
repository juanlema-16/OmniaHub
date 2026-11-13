import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [carritos, setCarritos] = useState(leer);

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
      vaciar: (slug) => editar(slug, () => []),
    }),
    [carritos, editar]
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
  };
}
