import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

// Miniatura de un producto: prueba la imagen guardada, luego la de respaldo (la imagen actual del producto)
// y, si ninguna carga, muestra un ícono en lugar de un recuadro vacío.
export default function ImagenProducto({ src, respaldo, className = 'h-10 w-10', alt = '' }) {
  const candidatas = [src, respaldo].filter((u, i, lista) => u && lista.indexOf(u) === i);
  const [indice, setIndice] = useState(0);

  useEffect(() => setIndice(0), [src, respaldo]);

  const actual = candidatas[indice];
  if (!actual) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 ${className}`} aria-hidden={!alt} title={alt || undefined}>
        <Package className="h-1/2 w-1/2" />
      </span>
    );
  }
  return <img src={actual} alt={alt} onError={() => setIndice((i) => i + 1)} className={`shrink-0 rounded-md border border-slate-200 object-cover ${className}`} />;
}
