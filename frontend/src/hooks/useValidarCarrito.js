import { useCallback, useEffect, useRef, useState } from 'react';
import { useCart } from '../context/CartContext';
import { validateStoreCart } from '../api/store';

// Revisa el carrito contra la API al abrir la pantalla (y cuando se pide): los cambios se aplican en el carrito
// y quedan como avisos en useCart(slug).avisos
export default function useValidarCarrito(slug) {
  const carrito = useCart(slug);
  const actual = useRef(carrito);
  actual.current = carrito;
  const [validando, setValidando] = useState(carrito.items.length > 0);

  const revalidar = useCallback(async () => {
    const items = actual.current.items;
    if (!items.length) {
      setValidando(false);
      return;
    }
    setValidando(true);
    try {
      actual.current.sincronizar(await validateStoreCart(slug, items.map((i) => ({ product: i.product, cantidad: i.cantidad }))));
    } catch {
      // Sin conexión o tienda no disponible: el checkout vuelve a validar al enviar y dirá qué falla
    } finally {
      setValidando(false);
    }
  }, [slug]);

  useEffect(() => {
    revalidar();
  }, [revalidar]);

  return { validando, revalidar };
}
