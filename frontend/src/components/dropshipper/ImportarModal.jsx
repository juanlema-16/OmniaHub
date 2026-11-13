import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert from '../ui/Alert';
import { importProduct, updateStoreProduct } from '../../api/storeProducts';
import { getErrorMessage } from '../../api/axios';
import { formatQ } from '../../utils/formatQ';

// Importa un producto a la tienda (o cambia su precio si ya estaba importado)
export default function ImportarModal({ producto, onClose, onDone }) {
  const yaImportado = Boolean(producto?.storeProduct);
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (producto) {
      setPrecio(String(producto.storeProduct?.precioVenta ?? producto.precioSugerido));
      setError('');
    }
  }, [producto]);

  if (!producto) return null;
  const valor = Number(precio);
  const margen = valor - producto.precioProveedor;
  const errorPrecio = !(valor > 0) ? 'Ingresa el precio de venta' : valor < producto.precioProveedor ? `No puede ser menor al precio proveedor (${formatQ(producto.precioProveedor)})` : '';

  const guardar = async (e) => {
    e.preventDefault();
    if (errorPrecio) return setError(errorPrecio);
    setEnviando(true);
    try {
      const sp = yaImportado
        ? await updateStoreProduct(producto.storeProduct._id, { precioVenta: valor })
        : await importProduct({ product: producto._id, precioVenta: valor });
      toast.success(yaImportado ? 'Precio actualizado en tu tienda' : `${producto.nombre} ya está en tu tienda`);
      onDone?.({ _id: sp._id, precioVenta: sp.precioVenta, activo: sp.activo });
      onClose();
    } catch (err) {
      setError(err.response?.data?.errors?.[0]?.mensaje || getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={yaImportado ? 'Precio en tu tienda' : 'Importar a mi tienda'}
      description="Tus clientes verán este precio en tu tienda en línea."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-importar" icon={Store} loading={enviando}>
            {yaImportado ? 'Guardar precio' : 'Importar'}
          </Button>
        </>
      }
    >
      <form id="form-importar" onSubmit={guardar} className="space-y-4" noValidate>
        <div className="flex gap-3">
          <img src={producto.imagenes?.[0]} alt="" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900">{producto.nombre}</p>
            <p className="text-sm text-slate-500">
              Proveedor {formatQ(producto.precioProveedor)} · Sugerido {formatQ(producto.precioSugerido)}
            </p>
          </div>
        </div>
        {error && error !== errorPrecio && <Alert tone="error">{error}</Alert>}
        <Input
          label="Precio de venta"
          type="number"
          min="0"
          step="0.01"
          prefix="Q"
          value={precio}
          onChange={(e) => {
            setPrecio(e.target.value);
            setError('');
          }}
          error={error && error === errorPrecio ? error : ''}
          required
          autoFocus
        />
        <div className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${margen >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          <span>Margen por unidad (antes de envío y comisión)</span>
          <strong>{valor > 0 ? formatQ(margen) : '—'}</strong>
        </div>
      </form>
    </Modal>
  );
}
