import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Alert from '../ui/Alert';
import { createPurchase } from '../../api/purchases';
import { getErrorMessage } from '../../api/axios';
import { formatQ } from '../../utils/formatQ';
import { reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

const LINEA = { product: '', cantidad: '1', costo: '' };

const esquemaLinea = {
  product: [reglas.requerido('El producto')],
  cantidad: [reglas.requerido('La cantidad', 'a'), (v) => (v !== '' && !(Number.isInteger(Number(v)) && Number(v) >= 1) ? 'Debe ser un número entero, 1 o mayor' : null)],
  costo: [reglas.requerido('El costo'), (v) => (v !== '' && Number(v) < 0 ? 'El costo no puede ser negativo' : null)],
};

// Registra una compra de mercancía: suma stock a cada producto
export default function CompraFormModal({ open, productos, onClose, onSaved }) {
  const [origen, setOrigen] = useState('');
  const [notas, setNotas] = useState('');
  const [lineas, setLineas] = useState([LINEA]);
  const [errores, setErrores] = useState({ origen: '', lineas: [] });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setOrigen('');
    setNotas('');
    setLineas([{ ...LINEA }]);
    setErrores({ origen: '', lineas: [] });
    setError('');
  }, [open]);

  const total = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.costo) || 0), 0);
  const unidades = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0), 0);

  const limpiarError = (i, campo) =>
    setErrores((e) => ({ ...e, lineas: e.lineas.map((le, idx) => (idx === i ? { ...le, [campo]: undefined } : le)) }));

  const cambiarLinea = (i, campo, valor) => {
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
    limpiarError(i, campo);
  };

  const elegirProducto = (i, id) => {
    const p = productos.find((x) => x._id === id);
    setLineas((ls) => ls.map((l, idx) => (idx === i ? { ...l, product: id, costo: l.costo || (p ? String(p.precioProveedor) : '') } : l)));
    limpiarError(i, 'product');
    limpiarError(i, 'costo');
  };

  const quitarLinea = (i) => {
    setLineas((ls) => ls.filter((_, idx) => idx !== i));
    setErrores((er) => ({ ...er, lineas: er.lineas.filter((_, idx) => idx !== i) }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');
    const lineasErr = lineas.map((l) => validar(esquemaLinea, l));
    const origenErr = [reglas.requerido('El origen'), reglas.minimo('El origen', 2)].map((r) => r(origen)).find(Boolean) || '';
    setErrores({ origen: origenErr, lineas: lineasErr });
    if (origenErr || lineasErr.some((le) => Object.keys(le).length)) return;

    setEnviando(true);
    try {
      await createPurchase({
        origen: origen.trim(),
        notas: notas.trim() || undefined,
        items: lineas.map((l) => ({ product: l.product, cantidad: Number(l.cantidad), costo: Number(l.costo) })),
      });
      toast.success(`Compra registrada: ${plural(unidades, 'unidad', 'unidades')} sumadas al inventario`);
      onSaved();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Registrar compra"
      description="Cada producto de la compra suma su cantidad al inventario."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-compra" loading={enviando}>
            Registrar compra
          </Button>
        </>
      }
    >
      <form id="form-compra" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input
          label="Proveedor de origen"
          value={origen}
          onChange={(e) => {
            setOrigen(e.target.value);
            setErrores((er) => ({ ...er, origen: '' }));
          }}
          error={errores.origen}
          maxLength={120}
          placeholder="A quién le compraste la mercancía"
          required
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Productos</p>
          {lineas.map((l, i) => {
            const le = errores.lineas[i] || {};
            const usados = lineas.filter((_, idx) => idx !== i).map((x) => x.product);
            return (
              <div key={i} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-12 sm:items-start">
                <Select
                  label="Producto"
                  className="sm:col-span-6"
                  value={l.product}
                  onChange={(e) => elegirProducto(i, e.target.value)}
                  error={le.product}
                  placeholder="Elige un producto"
                  options={productos.map((p) => ({ value: p._id, label: `${p.nombre} (${p.sku})`, disabled: usados.includes(p._id) }))}
                />
                <Input label="Cantidad" className="sm:col-span-2" type="number" min="1" step="1" value={l.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} error={le.cantidad} />
                <Input label="Costo unitario" className="sm:col-span-3" type="number" min="0" step="0.01" prefix="Q" value={l.costo} onChange={(e) => cambiarLinea(i, 'costo', e.target.value)} error={le.costo} />
                <div className="flex justify-end sm:col-span-1 sm:mt-7">
                  <Button variant="ghost" size="icon" icon={Trash2} disabled={lineas.length === 1} onClick={() => quitarLinea(i)} aria-label={`Quitar línea ${i + 1}`} className="text-danger hover:bg-red-50" />
                </div>
              </div>
            );
          })}
          <Button variant="secondary" size="sm" icon={Plus} disabled={lineas.length >= 50 || lineas.length >= productos.length} onClick={() => setLineas((ls) => [...ls, { ...LINEA }])}>
            Agregar producto
          </Button>
        </div>

        <Textarea label="Notas" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={500} rows={2} placeholder="Factura, lote u otra referencia (opcional)" />

        <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
          <span className="text-slate-600">{plural(unidades, 'unidad', 'unidades')} en total</span>
          <span className="text-base font-bold text-slate-900">Total: {formatQ(total)}</span>
        </div>
      </form>
    </Modal>
  );
}
