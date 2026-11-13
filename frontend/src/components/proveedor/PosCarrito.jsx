import { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import EmptyState from '../ui/EmptyState';
import { createPosSale } from '../../api/pos';
import { getErrorMessage } from '../../api/axios';
import { formatQ } from '../../utils/formatQ';
import { plural } from '../../utils/plural';

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { value: 'TARJETA', label: 'Tarjeta', icon: CreditCard },
];

const redondear = (n) => Math.round(n * 100) / 100;

// Carrito del POS: cantidades con tope de stock, método de pago, datos de factura y cobro
export default function PosCarrito({ items, onChange, onSold }) {
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [recibido, setRecibido] = useState('');
  const [nombre, setNombre] = useState('');
  const [nit, setNit] = useState('');
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const total = redondear(items.reduce((s, i) => s + i.product.precioSugerido * i.cantidad, 0));
  const unidades = items.reduce((s, i) => s + i.cantidad, 0);
  const cambio = metodo === 'EFECTIVO' && recibido !== '' && Number(recibido) >= total ? redondear(Number(recibido) - total) : null;

  const fijarCantidad = (id, valor) => {
    onChange(items.map((i) => (i.product._id === id ? { ...i, cantidad: Math.max(1, Math.min(i.product.stock, Math.floor(Number(valor)) || 1)) } : i)));
  };
  const quitar = (id) => onChange(items.filter((i) => i.product._id !== id));

  const validarDatos = () => {
    const e = {};
    if (nombre.trim() && nombre.trim().length < 2) e.nombre = 'El nombre debe tener al menos 2 caracteres';
    if (nit.trim() && !/^(CF|\d{1,12}-?[\dK])$/i.test(nit.trim())) e.nit = 'Usa CF o un NIT válido (ej. 1234567-8)';
    if (metodo === 'EFECTIVO' && recibido !== '' && Number(recibido) < total) e.recibido = `El efectivo recibido no alcanza para ${formatQ(total)}`;
    return e;
  };

  const cobrar = async () => {
    const encontrados = validarDatos();
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;
    setEnviando(true);
    try {
      const venta = await createPosSale({
        items: items.map((i) => ({ product: i.product._id, cantidad: i.cantidad })),
        metodoPago: metodo,
        cliente: { nombre: nombre.trim() || undefined, nit: nit.trim() ? nit.trim().toUpperCase() : undefined },
      });
      toast.success(`Venta cobrada: ${formatQ(venta.total)}`);
      setRecibido('');
      setNombre('');
      setNit('');
      onSold(venta);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Card title="Venta actual" description={items.length ? plural(unidades, 'unidad', 'unidades') : undefined} padding={false}>
      {items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="El carrito está vacío" description="Toca un producto para agregarlo." compact />
      ) : (
        <>
          <ul className="divide-y divide-slate-100">
            {items.map(({ product: p, cantidad }) => (
              <li key={p._id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3">
                <img src={p.imagenes?.[0]} alt="" className="h-10 w-10 shrink-0 rounded-md border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1 basis-32">
                  <p className="truncate text-sm font-medium text-slate-900">{p.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {formatQ(p.precioSugerido)} · stock {p.stock}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => fijarCantidad(p._id, cantidad - 1)} disabled={cantidad <= 1} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40" aria-label={`Quitar una unidad de ${p.nombre}`}>
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input type="number" min="1" max={p.stock} value={cantidad} onChange={(e) => fijarCantidad(p._id, e.target.value)} aria-label={`Cantidad de ${p.nombre}`} className="h-8 w-12 rounded-md border border-slate-300 text-center text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100" />
                  <button type="button" onClick={() => fijarCantidad(p._id, cantidad + 1)} disabled={cantidad >= p.stock} className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50 disabled:opacity-40" aria-label={`Agregar una unidad de ${p.nombre}`}>
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="w-20 shrink-0 text-right text-sm font-semibold text-slate-900">{formatQ(p.precioSugerido * cantidad)}</p>
                <button type="button" onClick={() => quitar(p._id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label={`Quitar ${p.nombre} del carrito`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          <div className="space-y-4 border-t border-slate-100 p-5">
            <div className="flex items-center justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatQ(total)}</span>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-700">Método de pago</legend>
              <div className="grid grid-cols-2 gap-2">
                {METODOS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={metodo === m.value}
                    onClick={() => {
                      setMetodo(m.value);
                      setErrores((e) => ({ ...e, recibido: undefined }));
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${metodo === m.value ? 'border-primary bg-primary-50 text-primary' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <m.icon className="h-4 w-4" aria-hidden="true" /> {m.label}
                  </button>
                ))}
              </div>
            </fieldset>

            {metodo === 'EFECTIVO' && (
              <Input
                label="Efectivo recibido"
                type="number"
                min="0"
                step="0.01"
                prefix="Q"
                value={recibido}
                onChange={(e) => {
                  setRecibido(e.target.value);
                  setErrores((er) => ({ ...er, recibido: undefined }));
                }}
                error={errores.recibido}
                hint={cambio !== null ? undefined : 'Opcional: calcula el cambio'}
              />
            )}
            {cambio !== null && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-success" role="status">
                Cambio a devolver: {formatQ(cambio)}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nombre del cliente" value={nombre} onChange={(e) => { setNombre(e.target.value); setErrores((er) => ({ ...er, nombre: undefined })); }} error={errores.nombre} maxLength={120} placeholder="Consumidor Final" />
              <Input label="NIT" value={nit} onChange={(e) => { setNit(e.target.value); setErrores((er) => ({ ...er, nit: undefined })); }} error={errores.nit} maxLength={14} placeholder="CF" />
            </div>

            {error && <Alert tone="error">{error}</Alert>}
            <Button fullWidth size="lg" loading={enviando} onClick={cobrar}>
              Cobrar {formatQ(total)}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
