import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import useDebounce from '../../hooks/useDebounce';
import useClickOutside from '../../hooks/useClickOutside';
import { listOrders } from '../../api/orders';
import { OrderStatusBadge } from '../ui/Badge';
import OrderQuickView from '../orders/OrderQuickView';

// Búsqueda rápida de órdenes por número, guía, teléfono o nombre del cliente
export default function HeaderSearch() {
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [ordenId, setOrdenId] = useState(null);
  const ref = useRef(null);
  const termino = useDebounce(texto.trim(), 300);
  const cerrar = useCallback(() => setAbierto(false), []);
  useClickOutside(ref, cerrar, abierto);

  useEffect(() => {
    if (termino.length < 2) {
      setResultados([]);
      return undefined;
    }
    let vigente = true;
    setBuscando(true);
    listOrders({ search: termino, limit: 6 })
      .then((d) => vigente && setResultados(d.items))
      .catch(() => vigente && setResultados([]))
      .finally(() => vigente && setBuscando(false));
    return () => {
      vigente = false;
    };
  }, [termino]);

  const abrir = (id) => {
    setOrdenId(id);
    setAbierto(false);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
        }}
        onFocus={() => setAbierto(true)}
        placeholder="Buscar orden, guía o teléfono…"
        aria-label="Buscar órdenes"
        className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm placeholder:text-slate-400 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
      />
      {buscando && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" aria-hidden="true" />}

      {abierto && termino.length >= 2 && !buscando && (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No hay órdenes que coincidan con “{termino}”</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {resultados.map((o) => (
                <li key={o._id}>
                  <button type="button" onClick={() => abrir(o._id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{o.numero}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {o.cliente.nombres} {o.cliente.apellidos} · {o.cliente.telefono}
                        {o.guia && ` · ${o.guia}`}
                      </span>
                    </span>
                    <OrderStatusBadge estado={o.estado} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <OrderQuickView orderId={ordenId} onClose={() => setOrdenId(null)} />
    </div>
  );
}
